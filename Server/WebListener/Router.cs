using System;
using System.Collections.Generic;
using System.Linq;

namespace WebServer
{
    /// <summary>
    /// Used in wrapper for when route handler doesn't require request data.
    /// </summary>
    public class NullData : IRequestData { };

    public class Router : IRouter
    {
        public string LoginPage { get; set; }

        protected List<IRoute> routes = new List<IRoute>();

        public Router()
        {
        }

        /// <summary>
        /// Add a route that doesn't expect any request data.
        /// </summary>
        public Router AddRoute(string verb, string path, Func<IRouteResponse> handler, bool requiresAuthentication = true)
        {
            var route = new Route<NullData>()
            {
                Verb = verb,
                Path = path,
                RouteHandler = _ => handler(),
                AuthenticationRequired = requiresAuthentication
            };
            routes.Add(route);

            return this;
        }

        public Router AddRoute<T>(Route<T> route, bool requiresAuthentication = true) where T : IRequestData
        {
            route.AuthenticationRequired = requiresAuthentication;
            routes.Add(route);

            return this;
        }

        /// <summary>
        /// Add a route that takes a handler to receive specific T instance of data from the request.
        /// </summary>
        public Router AddRoute<T>(string verb, string path, Func<T, IRouteResponse> handler, bool requiresAuthentication = true) where T : IRequestData
        {
            var route = new Route<T>()
            {
                Verb = verb,
                Path = path,
                RouteHandler = handler,
                AuthenticationRequired = requiresAuthentication
            };
            routes.Add(route);

            return this;
        }

        public Router ChangeRouteHandler<T>(string verb, string path, Func<T, IRouteResponse> handler, bool requiresAuthentication = true) where T : IRequestData
        {
            Route<T> route = (Route<T>)routes.Single(r => r.Verb == verb && r.Path == path);
            route.AuthenticationRequired = requiresAuthentication;
            route.RouteHandler = handler;

            return this;
        }

        public IRoute GetRoute(string verb, string path)
        {
            return routes.SingleOrDefault(r => r.Verb == verb && StringComparer.InvariantCultureIgnoreCase.Compare(r.Path, path) == 0);
        }
   }
}
