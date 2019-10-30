namespace Server
{
    public class AuditLog : RequestCommon
    {
        public enum AuditLogAction
        {
            Create,
            Update,
            Delete
        }

        public AuditLogAction Action { get; set; }
        public int RecordIndex { get; set; }
        public string Property { get; set; }
        public string Value { get; set; }
    }
}
