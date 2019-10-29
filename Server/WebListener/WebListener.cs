using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using Newtonsoft.Json;

using Helpers;

// To find sockets in use, run cmd as administrator:
// netstat -anob

namespace WebServer
{
    public class AlwaysAuthenticated : IAuthenticationService
    {
        public bool Authenticated { get; } = true;
    }

    public class WebListener
    {
        public CustomHandlerService CustomHandlerService { get; set; }
        public IAuthenticationService AuthenticationService { get; set; }
        public bool Stopped { get; protected set; }

        protected IRouter router;
        protected HttpListener listener;
        protected bool stop;
        protected string webAppPath;

        private Dictionary<string, string> contentTypeMap = new Dictionary<string, string>()
        {
            {".ico", "image/ico"},
            {".png", "image/png"},
            {".jpg", "image/jpg"},
            {".gif", "image/gif"},
            {".bmp", "image/bmp"},
            {".htm", "text/html"},
            {".html", "text/html"},
            {".css", "text/css"},
            {".js", "text/javascript"},
            {".json", "text/json"},
        };

        public WebListener(string ip, int port, IRouter router, string webAppPath = null)
        {
            AuthenticationService = new AlwaysAuthenticated();
            CustomHandlerService = new CustomHandlerService();
            this.router = router;
            this.webAppPath = webAppPath;
            listener = InitializeListener(ip, port);
        }

        public static List<IPAddress> GetLocalHostIPs()
        {
            IPHostEntry host;
            host = Dns.GetHostEntry(Dns.GetHostName());
            List<IPAddress> ret = host.AddressList.Where(ip => ip.AddressFamily == AddressFamily.InterNetwork).ToList();

            return ret;
        }

        protected HttpListener InitializeListener(string ip, int port)
        {
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add($"http://{ip}:{port}/");

            return listener;
        }

        public void Start()
        {
            listener.Start();

            // wait for contexts in a separate thread.
            Task.Run(() =>
            {
                while (!stop)
                {
                    try
                    {
                        HttpListenerContext context = listener.GetContext();

                        // Process context in a separate thread so we don't block on other pending connections.
                        Task.Run(() => ProcessContext(context));
                    }
                    catch (HttpListenerException)
                    {
                        // Occurs when we stop the listener.
                    }
                    catch (Exception /*ex*/)
                    {
                        // TODO: Log an unexpected exception to the event logger.
                    }
                }

                Stopped = true;
            });
        }

        public void Stop()
        {
            stop = true;
            listener.Stop();

            while (!Stopped)
            {
                Thread.Sleep(1);
            }
        }

        protected virtual void ProcessContext(HttpListenerContext context)
        {
            IRouteResponse resp = RouteResponse.BadRequest();

            try
            {
                var verb = context.Request.HttpMethod;
                var path = context.Request.RawUrl.LeftOf('?');
                Console.WriteLine($"{verb}: {path}");
                var route = router.GetRoute(verb, path);

                if (route != null)
                {
                    if (!route.AuthenticationRequired || AuthenticationService.Authenticated)
                    {
                        // We expect JSON data packets or URL data
                        string data = new StreamReader(context.Request.InputStream, context.Request.ContentEncoding).ReadToEnd();
                        Type dataType = route.DataType;
                        IRequestData packet = CreateRequestPacket(context, data, dataType);
                        resp = route.Invoke(packet);

                        if (resp.ContentType == "text/html")
                        {
                            byte[] pageData = Encoding.ASCII.GetBytes(resp.PageText);
                            ContentResponder(context, pageData, resp.ContentType);
                        }
                        else
                        {
                            JsonResponder(context, resp);
                        }
                    }
                    else
                    {
                        NotAuthorized(context);
                    }
                }
                else if (verb == "GET" && webAppPath != null && TryFilePath(path, out byte[] data, out string contentType))
                {
                    // testing content type is probably not very safe -- possibly easily spoofed.
                    // TODO: router should indicate if file doesn't require authentication, or the reverse -- files that do.
                    // At the moment, this allows us to load non html content like css, js, img, etc.
                    if (AuthenticationService.Authenticated || contentType != "text/html" || path == $"/{router.LoginPage}")
                    {
                        ContentResponder(context, data, contentType);
                    }
                    else
                    {
                        Redirect(context, router.LoginPage);
                    }
                }
                else
                {
                    // bad request.
                    JsonResponder(context, resp);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                resp = RouteResponse.ServerError(new { ex.Message, ex.StackTrace });
                JsonResponder(context, resp);
            }
        }

        protected bool TryFilePath(string path, out byte[] data, out string contentType)
        {
            bool ret = false;
            data = null;
            contentType = null;

            path = path.Substring(1);       // Everything to the right of the first "/"

            if (path == "")
            {
                path = "index.html";
            }

            path = path.Replace("/", @"\");

            string filePath = Path.Combine(webAppPath, path);

            if (File.Exists(filePath))
            {
                if (contentTypeMap.TryGetValue(Path.GetExtension(path).ToLower(), out contentType))
                {
                    ret = true;

                    if (!CustomHandlerService.Handled(path, filePath, out data))
                    {
                        data = File.ReadAllBytes(filePath);
                    }
                }
            }

            return ret;
        }

        protected IRequestData CreateRequestPacket(HttpListenerContext context, string data, Type dataType)
        {
            IRequestData packet = null;
            var verb = context.Request.HttpMethod;

            if (!string.IsNullOrEmpty(data))
            {
                // JSON data starts with "{"
                if (data[0] == '{')
                {
                    packet = (IRequestData)JsonConvert.DeserializeObject(data, dataType);
                }
                else
                {
                    /*
                    // Example: "username=sdfsf&password=sdfsdf&LoginButton=Login"
                    string[] parms = data.Split('&');
                    packet = (IRequestData)Activator.CreateInstance(dataType);

                    foreach (string parm in parms)
                    {
                        string[] keyVal = parm.Split('=');
                        PropertyInfo pi = dataType.GetProperty(keyVal[0], BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);

                        if (pi != null)
                        {
                            // TODO: Convert to property type.
                            // TODO: value needs to be re-encoded to handle special characters.
                            pi.SetValue(packet, keyVal[1]);
                        }
                    }
                    */
                }
            }
            else if (verb == "GET")
            {
                // With a GET, parse the query string into the handler's properties.
                NameValueCollection nvc = context.Request.QueryString;
                packet = (IRequestData)Activator.CreateInstance(dataType);

                foreach (string key in nvc.AllKeys)
                {
                    PropertyInfo pi = dataType.GetProperty(key, BindingFlags.Public | BindingFlags.Instance);

                    if (pi != null)
                    {
                        object val = Converter.Convert(nvc[key], pi.PropertyType);
                        pi.SetValue(packet, val);
                    }
                }
            }

            return packet;
        }

        protected void JsonResponder(HttpListenerContext context, IRouteResponse resp)
        {
            // Header required when we load the TypeScript webpage from one "server" but post requests to another.
            context.Response.AppendHeader("Access-Control-Allow-Origin", "*");
            //context.Response.AddHeader("Access-Control-Allow-Methods", "GET, POST");
            //context.Response.AddHeader("Access-Control-Allow-Headers", "Authorization, Origin, Content-Type, Accept, X-Requested-With");
            //context.Response.AddHeader("Access-Control-Max-Age", "1728000");

            context.Response.StatusCode = (int)resp.Status;

            if (resp.ResponseObject != null)
            {
                string json = JsonConvert.SerializeObject(resp.ResponseObject, Formatting.Indented);
                context.Response.ContentEncoding = Encoding.UTF8;
                context.Response.ContentType = "application/json";
                byte[] buffer = Encoding.UTF8.GetBytes(json);
                context.Response.OutputStream.Write(buffer, 0, buffer.Length);
                context.Response.OutputStream.Flush();
            }

            context.Response.OutputStream.Close();
        }

        protected void NotAuthorized(HttpListenerContext context)
        {
            context.Response.StatusCode = (int)RouteResponse.Unauthorized().Status;
            context.Response.OutputStream.Close();
        }

        protected void ContentResponder(HttpListenerContext context, byte[] buffer, string contentType)
        {
            context.Response.ContentEncoding = Encoding.UTF8;
            context.Response.ContentType = contentType;
            context.Response.OutputStream.Write(buffer, 0, buffer.Length);
            context.Response.OutputStream.Flush();
            context.Response.OutputStream.Close();
        }

        protected void Redirect(HttpListenerContext context, string url)
        {
            context.Response.Redirect(url);
            context.Response.Close();
        }
    }
}
