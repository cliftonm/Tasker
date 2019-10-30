using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;

using Newtonsoft.Json;

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

    // Create EXE with dotnet publish -c Debug -r win10-x64 --no-build
    // Putting this in the post-build step without "--no-build" will result in infinite recursion of the build process.  Sigh.
    // https://stackoverflow.com/a/55169309/2276361
    // But then it got removed: https://github.com/dotnet/cli/issues/5331  Idiots
    // And I don't remember how (or if) I solved this with my rPI work.
    class Program
    {
        private static WebListener webListenerLocal;
        private static List<WebListener> webListeners = new List<WebListener>();
        private static string webAppPath = "";
        private static Router router;
        private static Dictionary<string, List<string>> schema = new Dictionary<string, List<string>>();
        private static object schemaLocker = new object();
        private static TableFieldComparer tableFieldComparer = new TableFieldComparer();
        private static string auditLogTableName = "AuditLogStore";

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
            router.AddRoute<LoadStore>("GET", "/load", Load, false);
            router.AddRoute<SaveStore>("POST", "/Save", Save, false);
            router.AddRoute<AuditLog>("POST", "/SaveLogEntry", SaveLogEntry, false);
            router.AddRoute("GET", "/", () => RouteResponse.Page("Hello World", "text/html"), false);
        }

        private static IRouteResponse Load(LoadStore store)
        {
            Console.WriteLine($"Load store {store.StoreName} for user {store.UserId}");

            using (var conn = OpenConnection())
            {
                CheckForTable(conn, store.StoreName);
                var data = LoadStore(conn, store.StoreName, store.UserId);

                return RouteResponse.OK(data);
            }
        }

        private static IRouteResponse Save(SaveStore store)
        {
            var logs = JsonConvert.DeserializeObject<List<AuditLog>>(store.AuditLog);

            using (var conn = OpenConnection())
            {
                // Evil!
                lock (schemaLocker)
                {
                    UpdateSchema(conn, logs);

                    // The CRUD operations have to be in the lock operation so that another request doesn't update the schema while we're updating the record.
                    logs.ForEach(l => PersistTransaction(conn, l, store.UserId));
                }
            }

            return RouteResponse.OK();
        }

        private static IRouteResponse SaveLogEntry(AuditLog entry)
        {
            using (var conn = OpenConnection())
            {
                CreateLogEntry(conn, entry);
            }

            return RouteResponse.OK();
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

        private static void CheckForTable(SqlConnection conn, string storeName)
        {
            if (!schema.ContainsKey(storeName))
            {
                CreateTable(conn, storeName);
                schema[storeName] = new List<string>();
            }
        }

        private static void CheckForField(SqlConnection conn, string storeName, string fieldName)
        {
            if (!schema[storeName].Contains(fieldName))
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

        private static void Execute(SqlConnection conn, string sql)
        {
            Console.WriteLine($"SQL: {sql}");
            var cmd = new SqlCommand(sql, conn);
            cmd.ExecuteNonQuery();
        }

        private static void Execute(SqlConnection conn, string sql, SqlParameter[] parms)
        {
            Console.WriteLine($"SQL: {sql}");
            var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddRange(parms);
            cmd.ExecuteNonQuery();
        }

        private static void CreateTable(SqlConnection conn, string storeName)
        {
            // __ID must be a string because in ParentChildStore.GetChildInfo, this Javascript: childRecIds.indexOf((<any>r).__ID)
            // Does not match on "1" == 1
            string sql = $"CREATE TABLE [{storeName}] (ID int NOT NULL PRIMARY KEY IDENTITY(1,1), UserId UNIQUEIDENTIFIER NOT NULL, __ID nvarchar(16) NOT NULL)";
            Execute(conn, sql);
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
