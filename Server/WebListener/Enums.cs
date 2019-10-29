namespace WebServer
{
    public enum HttpStatusCode
    {
        NoResponse = 0,
        OK = 200,
        BadRequest = 400,           // client error regarding request
        Unauthorized = 401,
        Forbidden = 403,
        NotFound = 404,             // resource not found
        MethodNotFound = 405,       // route not found
        ServerError = 500,
    }
}
