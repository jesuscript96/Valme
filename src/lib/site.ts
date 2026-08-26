export const SITE_URL = "https://www.valmesolutions.com";

export function absoluteUrl(pathname = "/"): string {
  return new URL(pathname, `${SITE_URL}/`).toString();
}
