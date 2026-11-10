/**
 * The colour of the system chrome around the page (iOS status bar area, the
 * browser/PWA background, theme-color), chosen to match the top of each page.
 *
 * iOS 26 draws installed web apps edge to edge under a Liquid Glass status
 * bar and tints it from the page background, not from theme-color alone. If
 * <body> stays white while a page has a dark header, iOS paints a white haze
 * over that header. So <html>, <body> and theme-color all use this colour.
 */

// Exact sRGB of the --color-navi-dark token (oklch(20.9% 0.015 258.1)) used by
// the dark page headers. theme-color needs a literal colour, so keep this in
// sync with globals.css or the status bar and header will visibly differ.
export const CHROME_DARK = "#14181f";
export const CHROME_LIGHT = "#ffffff";

const DARK_HEADER_PREFIXES = ["/settings", "/members/", "/categories/", "/accounts/"];

export function hasDarkHeader(pathname: string) {
  return pathname === "/" || DARK_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function chromeColor(pathname: string) {
  return hasDarkHeader(pathname) ? CHROME_DARK : CHROME_LIGHT;
}
