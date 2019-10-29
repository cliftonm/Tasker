using System;
using System.Collections.Generic;

using WebServer;

namespace Server
{
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
        // private static string localIP;

        static void Main(string[] args)
        {
            InitializeRouter();

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
            router.AddRoute("GET", "/", () => RouteResponse.Page("Hello World", "text/html"), false);
        }

        private static IRouteResponse Load(LoadStore store)
        {
            Console.WriteLine($"Load store {store.StoreName}");

            return RouteResponse.OK(new string[] {});

            // return RouteResponse.OK(new [] { new { Test = "test" } });
        }

        private static IRouteResponse AuditLog(AuditLog auditLog)
        {
            return RouteResponse.OK();
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

    }//end of  class Program
}
