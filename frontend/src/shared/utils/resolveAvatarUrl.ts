export function resolveAvatarUrl(url?: string | null): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const rawBase = (import.meta.env.VITE_API_URL as string) || "";
  const serverOrigin = rawBase.replace(/\/api\/?$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${serverOrigin}${normalizedPath}`;
}
