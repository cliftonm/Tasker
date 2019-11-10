using System.Collections.Generic;

namespace Server
{
    public class AuditLogEntries : RequestCommon
    {
        public List<AuditLog> Entries = new List<AuditLog>();
    }
}
