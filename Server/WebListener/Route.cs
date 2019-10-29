using System;

namespace WebServer
{
    public class RouterException : Exception
    {
        public RouterException(string msg) : base(msg) { }
    }

    public class Route<T> : IRoute where T : IRequestData
    {
        public string Verb { get; set; }
        public string Path { get; set; }
        public Func<T, IRouteResponse> RouteHandler { get; set; }

        public Type DataType { get { return typeof(T); } }
        public bool AuthenticationRequired { get; set; } = true;

        public IRouteResponse Invoke(IRequestData data)
        {
            return RouteHandler((T)data);
        }
    }
}
