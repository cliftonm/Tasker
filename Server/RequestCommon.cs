using System;

using WebServer;

namespace Server
{
    public class RequestCommon : IRequestData
    {
        public Guid UserId { get; set; }
        public string StoreName { get; set; }
    }
}
