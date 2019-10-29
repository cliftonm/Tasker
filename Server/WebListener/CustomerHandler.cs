using System;
using System.Collections.Generic;

namespace WebServer
{
    public class CustomHandlerService
    {
        protected Dictionary<string, Func<string, byte[]>> customHandlers = new Dictionary<string, Func<string, byte[]>>();

        public void AddCustomHandler(string path, Func<string, byte[]> handler)
        {
            customHandlers[path] = handler;
        }

        public bool Handled(string path, string filePath, out byte[] data)
        {
            bool handled = false;
            data = null;

            if (customHandlers.TryGetValue(path, out Func<string, byte[]> handler))
            {
                handled = true;
                data = handler(filePath);
            }

            return handled;
        }
    }
}
