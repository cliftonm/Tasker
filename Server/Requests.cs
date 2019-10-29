namespace Server
{
    public class LoadStore : RequestCommon
    {
    }

    public class SaveStore : RequestCommon
    {
        public string AuditLog { get; set; }
    }
}
