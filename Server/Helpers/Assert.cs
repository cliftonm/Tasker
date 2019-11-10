using System;
using System.Collections.Generic;

namespace Helpers
{
    public static class Assert
    {
        public static void That(bool condition, string exceptionMessage)
        {
            if (!condition)
            {
                throw new Exception(exceptionMessage);
            }
        }

        public static void ThatAll<T>(IEnumerable<T> collection, Func<T, bool> test, Func<T, string> msg)
        {
            collection.ForEach(c => {
                if (!test(c)) throw new Exception(msg(c));
            });
        }
    }
}
