namespace WebServer
{
    public class RouteResponse : IRouteResponse
    {
        public HttpStatusCode Status { get; set; }
        public object ResponseObject { get; set; }
        public string RedirectUrl { get; set; }
        public string PageText { get; set; }
        public string ContentType { get; set; }

        public static RouteResponse OK(object responseObject = null)
        {
            return new RouteResponse() { Status = HttpStatusCode.OK, ResponseObject = responseObject};
        }

        public static RouteResponse Page(string text, string contentType)
        {
            return new RouteResponse() { PageText = text, ContentType = contentType, Status = HttpStatusCode.OK };
        }

        public static RouteResponse ServerError(object responseObject = null)
        {
            return new RouteResponse() { Status = HttpStatusCode.ServerError, ResponseObject = responseObject };
        }

        public static RouteResponse BadRequest(object responseObject = null)
        {
            return new RouteResponse() { Status = HttpStatusCode.BadRequest, ResponseObject = responseObject };
        }

        public static RouteResponse Unauthorized(object responseObject = null)
        {
            return new RouteResponse() { Status = HttpStatusCode.Unauthorized, ResponseObject = responseObject };
        }

        public static RouteResponse Forbidden(object responseObject = null)
        {
            return new RouteResponse() { Status = HttpStatusCode.Forbidden, ResponseObject = responseObject };
        }

        public static RouteResponse NotFound(object responseObject = null)
        {
            return new RouteResponse() { Status = HttpStatusCode.NotFound, ResponseObject = responseObject };
        }

        public static RouteResponse MethodNotFound(object responseObject = null)
        {
            return new RouteResponse() { Status = HttpStatusCode.MethodNotFound, ResponseObject = responseObject };
        }

        public static RouteResponse Redirect(string url)
        {
            return new RouteResponse() { RedirectUrl = url };
        }
    }
}
