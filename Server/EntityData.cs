using System.Collections.Generic;

using Newtonsoft.Json.Linq;

namespace Server
{
    public class EntityData : RequestCommon
    {
        public List<JObject> StoreData = new List<JObject>();
    }
}
