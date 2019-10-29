using WebServer;

namespace Server
{
    public class AuditLog : IRequestData
    {
        public enum AuditLogAction
        {
            Create,
            Update,
            Delete
        }

        public string StoreName { get; set; }
        public AuditLogAction Action { get; set; }
        public int RecordIndex { get; set; }
        public string Property { get; set; }
        public string Value { get; set; }
    }
}
