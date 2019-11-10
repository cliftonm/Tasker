using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading;

using Newtonsoft.Json.Linq;

using Helpers;
using WebServer;

// testing: 
// http://127.0.0.1/Load?StoreName=Test&UserID=00000000-0000-0000-0000-000000000000

namespace Server
{
    public class TableFieldComparer : IEqualityComparer<AuditLog>
    {
        public bool Equals(AuditLog a, AuditLog b)
        {
            return a.StoreName == b.StoreName && a.Property == b.Property;
        }

        public int GetHashCode(AuditLog l)
        {
            return (l.StoreName + l.Property).GetHashCode();
        }
    }

    public class Transaction
    {
        public SqlTransaction t;
        public SqlConnection c;
        public long rollbackCount;
        public long transactionCount;

        public Transaction(SqlTransaction t, SqlConnection c)
        {
            this.t = t;
            this.c = c;
        }
    }

    // Create EXE with dotnet publish -c Debug -r win10-x64 --no-build
    // Putting this in the post-build step without "--no-build" will result in infinite recursion of the build process.  Sigh.
    // https://stackoverflow.com/a/55169309/2276361
    // But then it got removed: https://github.com/dotnet/cli/issues/5331  Idiots
    // And I don't remember how (or if) I solved this with my rPI work.
    class Program
    {
        private static StringComparer ignoreCaseComparer = StringComparer.OrdinalIgnoreCase;
        private static WebListener webListenerLocal;
        private static List<WebListener> webListeners = new List<WebListener>();
        private static string webAppPath = "";
        private static Router router;
        private static Dictionary<string, List<string>> schema = new Dictionary<string, List<string>>(ignoreCaseComparer);
        private static object schemaLocker = new object();
        private static TableFieldComparer tableFieldComparer = new TableFieldComparer();
        private static string auditLogTableName = "AuditLogStore";
        private static ConcurrentDictionary<Guid, Transaction> transactions = new ConcurrentDictionary<Guid, Transaction>();

        private static string connectionString = @"Data Source=MARC-DELL2\SQLEXPRESS2017;Initial Catalog=TaskTracker;Integrated Security=True;";
        // private static string connectionString = @"Data Source=MCLIFTON-5P5KZN\MSSQL2017;Initial Catalog=TaskTracker;Integrated Security=True;";

            // private static string localIP;

        static void Main(string[] args)
        {
            InitializeRouter();
            LoadSchema();
            CreateAuditLogTable();

            // webAppPath = ConfigurationManager.AppSettings["webAppPath"];
            // Console.WriteLine($"WebApp: {webAppPath}");

            InitializeLocalhostWebListener(router, webAppPath);

            // localIP = WebListener.GetLocalHostIPs().First().ToString();
            // localIPs = WebListener.GetLocalHostIPs().ToString();
            // InitializeLocalWebListeners(router, webAppPath, localIP);

            Console.WriteLine("Press ENTER to exit the server.");
            Console.ReadLine();
            Console.WriteLine("Stopping listeners...");
            webListeners.ForEach(wl => wl.Stop());
            webListenerLocal?.Stop();
            Console.WriteLine("Stopped");
        }

        private static void InitializeRouter()
        {
            router = new Router();
            router.AddRoute<RequestCommon>("GET", "/Load", Load, false);
            router.AddRoute<RequestCommon>("POST", "/BeginTransaction", BeginTransaction, false);
            router.AddRoute<RequestCommon>("POST", "/CommitTransaction", CommitTransaction, false);
            router.AddRoute<RequestCommon>("POST", "/RollbackTransaction", RollbackTransaction, false);
            router.AddRoute<AuditLogEntries>("POST", "/ImportChanges", ImportAuditLog, false);
            router.AddRoute<EntityData>("POST", "/ImportEntity", ImportEntity, false);
            router.AddRoute<AuditLog>("POST", "/SaveLogEntry", SaveLogEntry, false);
            router.AddRoute("GET", "/", () => RouteResponse.Page("Hello World", "text/html"), false);
        }

        private static IRouteResponse BeginTransaction(RequestCommon req)
        {
            var conn = OpenConnection();
            // var transaction = conn.BeginTransaction();
            SqlTransaction transaction = null;
            transactions[req.UserId] = new Transaction(transaction, conn);

            return RouteResponse.OK();
        }

        private static IRouteResponse CommitTransaction(RequestCommon req)
        {
            Console.WriteLine("Committing transactions...");
            var tinfo = transactions[req.UserId];
            Console.WriteLine($"{tinfo.transactionCount} {tinfo.rollbackCount} {tinfo.c.State}");
            // tinfo.t.Commit();
            tinfo.c.Close();
            transactions.Remove(req.UserId, out _);

            return RouteResponse.OK();
        }

        private static IRouteResponse RollbackTransaction(RequestCommon req)
        {
            var tinfo = transactions[req.UserId];
            Interlocked.Increment(ref tinfo.rollbackCount);

            while (Interlocked.Read(ref tinfo.transactionCount) > 0)
            {
                // Thread.Sleep(0) is evil, see some article I wrote somewhere regarding that.
                Thread.Sleep(1);
            }

            Console.WriteLine($"Abort {req.UserId}");
            // transactions[req.UserId].t.Rollback();
            transactions[req.UserId].c.Close();
            transactions.Remove(req.UserId, out _);
            // No need to decrement the rollback counter as we're all done.

            return RouteResponse.OK();
        }

        private static IRouteResponse Load(RequestCommon req)
        {
            Console.WriteLine($"Load store {req.StoreName} for user {req.UserId}");

            using (var conn = OpenConnection())
            {
                CheckForTable(conn, req.StoreName);
                var data = LoadStore(conn, req.StoreName, req.UserId);

                return RouteResponse.OK(data);
            }
        }

        private static IRouteResponse SaveLogEntry(AuditLog entry)
        {
            using (var conn = OpenConnection())
            {
                CreateLogEntry(conn, entry);
            }

            return RouteResponse.OK();
        }

        private static IRouteResponse ImportAuditLog(AuditLogEntries log)
        {
            using (var conn = OpenConnection())
            {
                // Evil!
                lock (schemaLocker)
                {
                    UpdateSchema(conn, log.Entries);

                    // The CRUD operations have to be in the lock operation so that another request doesn't update the schema while we're updating the record.
                    log.Entries.ForEach(l => PersistTransaction(conn, l, log.UserId));
                }
            }

            return RouteResponse.OK();
        }

        private static IRouteResponse ImportEntity(EntityData entity)
        {
            IRouteResponse resp = RouteResponse.OK();

            // Evil!
            // Lock the whole process in case another async call fails and the client calls abort which gets
            // processed and then more import calls are received.
            lock (schemaLocker)
            {
                // We assume there's data!
                using (var tconn = OpenConnection())
                {
                    CheckForTable(tconn, entity.StoreName);

                    // Somewhat annoyingly we actually have to check all the records for any new field.
                    entity.StoreData.ForEach(d =>
                    {
                        foreach (var prop in d.Properties())
                        {
                            CheckForField(tconn, entity.StoreName, prop.Name);
                        }
                    });
                }

                var tinfo = transactions[entity.UserId];
                var transaction = tinfo.t;
                var conn = tinfo.c;

                try
                {
                    Interlocked.Increment(ref tinfo.transactionCount);
                    Console.WriteLine($"{tinfo.transactionCount} {tinfo.rollbackCount} {tinfo.c.State}");

                    for (int n = 0; n < entity.StoreData.Count && Interlocked.Read(ref tinfo.rollbackCount) == 0; ++n)
                    {
                        InsertRecord(conn, transaction, entity.UserId, entity.StoreName, entity.StoreData[n]);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    resp = RouteResponse.ServerError(new { Error = ex.Message });
                }
                finally
                {
                    Interlocked.Decrement(ref tinfo.transactionCount);
                }
            }

            return resp;
        }

        private static void UpdateSchema(SqlConnection conn, List<AuditLog> logs)
        {
            // Create any missing tables.
            logs.Select(l => l.StoreName).Distinct().ForEach(sn => CheckForTable(conn, sn));

            // Create any missing fields.
            foreach (var log in logs.Where(l => !String.IsNullOrEmpty(l.Property)).DistinctBy(l => l, tableFieldComparer))
            {
                CheckForField(conn, log.StoreName, log.Property);
            }
        }

        private static void InitializeLocalhostWebListener(IRouter router, string webAppPath)
        {
            webListenerLocal = new WebListener("127.0.0.1", 80, router, webAppPath);
            webListenerLocal.Start();

            Console.WriteLine($"Started 127.0.0.1:80");
        }

        private static void InitializeLocalWebListeners(IRouter router, string webAppPath, string localIP)
        {
            try
            {
                var webListener = new WebListener(localIP.ToString(), 80, router, webAppPath);
                webListener.Start();
                Console.WriteLine($"Started {localIP.ToString()}:80");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{ex.Message}\r\nFailed to start {localIP.ToString()}:80\r\nLaunch \"as administrator?\"");
            }
        }

        private static void LoadSchema()
        {
            const string sqlGetTables = "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'";
            using (var conn = OpenConnection())
            {
                var dt = Query(conn, sqlGetTables);

                foreach (DataRow row in dt.Rows)
                {
                    var tableName = row["TABLE_NAME"].ToString();
                    schema[tableName] = new List<string>();
                    var fields = LoadTableSchema(conn, tableName);
                    schema[tableName].AddRange(fields);
                }
            }
        }

        private static void CreateAuditLogTable()
        {
            if (!schema.ContainsKey(auditLogTableName))
            {
                using (var conn = OpenConnection())
                {
                    string sql = $@"CREATE TABLE [{auditLogTableName}] (ID int NOT NULL PRIMARY KEY IDENTITY(1,1), UserId UNIQUEIDENTIFIER NOT NULL, 
                    [StoreName] NVARCHAR(255) NOT NULL,
                    [Action] INT NOT NULL,
                    [RecordIndex] INT NOT NULL,
                    [Property] NVARCHAR(255) NULL,
                    [Value] NVARCHAR(255) NULL
                    )";

                    Execute(conn, sql);
                    var fields = LoadTableSchema(conn, auditLogTableName);
                    schema[auditLogTableName] = new List<string>();
                    schema[auditLogTableName].AddRange(fields);
                }
            }
        }

        private static IEnumerable<string> LoadTableSchema(SqlConnection conn, string tableName)
        {
            string sqlGetTableFields = $"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName";
            var dt = Query(conn, sqlGetTableFields, new SqlParameter[] { new SqlParameter("@tableName", tableName) });
            var fields = (dt.AsEnumerable().Select(r => r[0].ToString()));

            return fields;
        }

        private static void PersistTransaction(SqlConnection conn, AuditLog log, Guid userId)
        {
            switch (log.Action)
            {
                case AuditLog.AuditLogAction.Create:
                    CreateRecord(conn, userId, log.StoreName, log.RecordIndex);
                    break;

                case AuditLog.AuditLogAction.Delete:
                    DeleteRecord(conn, userId, log.StoreName, log.RecordIndex);
                    break;

                case AuditLog.AuditLogAction.Update:
                    UpdateRecord(conn, userId, log.StoreName, log.RecordIndex, log.Property, log.Value);
                    break;
            }
        }

        private static void CreateLogEntry(SqlConnection conn, AuditLog logEntry)
        {
            string sql = $"INSERT INTO [{auditLogTableName}] (UserID, StoreName, Action, RecordIndex, Property, Value) values (@userId, @storeName, @action, @recordIndex, @property, @value)";
            Execute(conn, sql, new SqlParameter[] 
            {
                new SqlParameter("@userId", logEntry.UserId),
                new SqlParameter("@storeName", logEntry.StoreName),
                new SqlParameter("@action", logEntry.Action),
                new SqlParameter("@recordIndex", logEntry.RecordIndex),
                new SqlParameter("@property", (object)logEntry.Property ?? DBNull.Value),
                new SqlParameter("@value", (object)logEntry.Value ?? DBNull.Value),
            });
        }

        private static void CreateRecord(SqlConnection conn, Guid userId, string storeName, int idx)
        {
            string sql = $"INSERT INTO [{storeName}] (__ID, UserID) values (@idx, @userId)";
            Execute(conn, sql, new SqlParameter[] { new SqlParameter("@idx", idx), new SqlParameter("@userId", userId) });
        }

        private static void DeleteRecord(SqlConnection conn, Guid userId, string storeName, int idx)
        {
            string sql = $"DELETE FROM [{storeName}] WHERE __ID = @idx and UserId = @userId";
            Execute(conn, sql, new SqlParameter[] { new SqlParameter("@idx", idx), new SqlParameter("@userId", userId) });
        }

        private static void UpdateRecord(SqlConnection conn, Guid userId, string storeName, int idx, string field, string value)
        {
            string sql = $"UPDATE [{storeName}] SET [{field}] = @value WHERE __ID = @idx and UserId = @userId";

            Execute(conn, sql, new SqlParameter[] 
            {
                new SqlParameter("@idx", idx),
                new SqlParameter("@userId", userId),
                // new SqlParameter("@field", field),
                new SqlParameter("@value", value),
            });
        }

        private static void InsertRecord(SqlConnection conn, SqlTransaction t, Guid userId, string storeName, JObject obj)
        {
            Assert.That(schema.ContainsKey(storeName), $"{storeName} is not a table in the database.");
            Assert.ThatAll(obj.Properties(), f => schema[storeName].Contains(f.Name, ignoreCaseComparer), f => $"{f.Name} is not a valid column name.");

            Dictionary<string, string> fields = new Dictionary<string, string>();
            obj.Properties().ForEach(p => fields[p.Name] = p.Value.ToString());
            string columnNames = String.Join(",", fields.Select(kvp => $"[{kvp.Key}]"));
            string paramNames = String.Join(",", fields.SelectWithIndex((kvp, idx) => $"@{idx}"));
            var sqlParams = fields.SelectWithIndex((kvp, idx) => new SqlParameter($"@{idx}", kvp.Value)).ToList();
            sqlParams.Add(new SqlParameter("@userId", userId));

            string sql = $"INSERT INTO [{storeName}] (UserId, {columnNames}) VALUES (@userId, {paramNames})";
            Execute(conn, sql, sqlParams.ToArray(), t);
        }

        private static void CheckForTable(SqlConnection conn, string storeName)
        {
            if (!schema.ContainsKey(storeName))
            {
                CreateTable(conn, storeName);
                schema[storeName] = new List<string>();
                schema[storeName].AddRange(new string[] { "UserId", "__ID" });
            }
        }

        private static void CheckForField(SqlConnection conn, string storeName, string fieldName)
        {
            if (!schema[storeName].Contains(fieldName, ignoreCaseComparer))
            {
                CreateField(conn, storeName, fieldName);
                schema[storeName].Add(fieldName);
            }
        }

        private static SqlConnection OpenConnection()
        {
            var conn = new SqlConnection(connectionString);
            conn.Open();

            return conn;
        }

        private static DataTable Query(SqlConnection conn, string sql)
        {
            Console.WriteLine($"SQL: {sql}");
            var cmd = new SqlCommand(sql, conn);
            DataTable dt = new DataTable();
            var da = new SqlDataAdapter(cmd);
            da.Fill(dt);

            return dt;
        }

        private static DataTable Query(SqlConnection conn, string sql, SqlParameter[] parms)
        {
            Console.WriteLine($"SQL: {sql}");
            var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddRange(parms);
            DataTable dt = new DataTable();
            var da = new SqlDataAdapter(cmd);
            da.Fill(dt);

            return dt;
        }

        private static void Execute(SqlConnection conn, string sql, SqlTransaction t = null)
        {
            Console.WriteLine($"SQL: {sql}");
            var cmd = new SqlCommand(sql, conn);
            cmd.Transaction = t;
            cmd.ExecuteNonQuery();
        }

        private static void Execute(SqlConnection conn, string sql, SqlParameter[] parms, SqlTransaction t = null)
        {
            Console.WriteLine($"SQL: {sql}");
            var cmd = new SqlCommand(sql, conn);
            cmd.Transaction = t;
            cmd.Parameters.AddRange(parms);
            cmd.ExecuteNonQuery();
        }

        private static void CreateTable(SqlConnection conn, string storeName)
        {
            // __ID must be a string because in ParentChildStore.GetChildInfo, this Javascript: childRecIds.indexOf((<any>r).__ID)
            // Does not match on "1" == 1
            string sql = $"CREATE TABLE [{storeName}] (ID int NOT NULL PRIMARY KEY IDENTITY(1,1), UserId UNIQUEIDENTIFIER NOT NULL, __ID nvarchar(16) NOT NULL)";
            Execute(conn, sql);
            string sqlIndex = $"CREATE UNIQUE INDEX [{storeName}Index] ON [{storeName}] (UserId, __ID)";
            Execute(conn, sqlIndex);
        }

        private static void CreateField(SqlConnection conn, string storeName, string fieldName)
        {
            // Here we suffer from a loss of fidelity as we don't know the field type nor length/precision.
            string sql = $"ALTER TABLE [{storeName}] ADD [{fieldName}] NVARCHAR(255) NULL";
            Execute(conn, sql);
        }

        private static DataTable LoadStore(SqlConnection conn, string storeName, Guid userId)
        {
            string sql = $"SELECT * FROM [{storeName}] WHERE UserId = @UserId";
            var dt = Query(conn, sql, new SqlParameter[] { new SqlParameter("@UserId", userId) });

            return dt;
        }
    }
}
