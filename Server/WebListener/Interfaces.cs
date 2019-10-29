using System;

namespace WebServer
{
    public interface IRequestData
    {
    }

    public interface IRoute
    {
        string Verb { get; }
        string Path { get; }
        Type DataType { get; }
        bool AuthenticationRequired { get; set; }

        IRouteResponse Invoke(IRequestData data);
    }

    public interface IRouter
    {
        string LoginPage { get; set; }
        IRoute GetRoute(string verb, string path);
    }

    public interface IRouteResponse
    {
        HttpStatusCode Status { get; }
        object ResponseObject { get; }
        string RedirectUrl { get; }
        string PageText { get; }
        string ContentType { get; }
    }

    public interface IAuthenticationService
    {
        bool Authenticated { get; }
    }
}
