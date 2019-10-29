using System;

namespace Helpers
{
    public static class MatchExtensionMethods
    {
        public static void Match<T>(this T val, params (Func<T, bool> qualifier, Action<T> action)[] matches)
        {
            foreach (var match in matches)
            {
                if (match.qualifier(val))
                {
                    match.action(val);
                    break;
                }
            }
        }

        public static void MatchAll<T>(this T val, params (Func<T, bool> qualifier, Action<T> action)[] matches)
        {
            foreach (var match in matches)
            {
                if (match.qualifier(val))
                {
                    match.action(val);
                }
            }
        }

        public static U MatchReturn<T, U>(this T val, params (Func<T, bool> qualifier, Func<T, U> func)[] matches)
        {
            U ret = default(U);

            foreach (var match in matches)
            {
                if (match.qualifier(val))
                {
                    ret = match.func(val);
                    break;
                }
            }

            return ret;
        }

        public static U MatchReturn<T, U>(this T val, params (Func<T, bool> qualifier, Func<U> func)[] matches)
        {
            U ret = default(U);

            foreach (var match in matches)
            {
                if (match.qualifier(val))
                {
                    ret = match.func();
                    break;
                }
            }

            return ret;
        }

        public static U ReverseMatchReturn<T, U>(this T val, params (Func<T, bool> qualifier, Func<T, U> func)[] matches)
        {
            U ret = default(U);

            for (int n = matches.Length - 1; n >= 0; n--)
            {
                var match = matches[n];

                if (match.qualifier(val))
                {
                    ret = match.func(val);
                    break;
                }
            }

            return ret;
        }
    }
}