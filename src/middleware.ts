import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const APP_HOST = "app.my-repair.it";
const TRACKING_HOST = "t.my-repair.it";
const MARKETING_HOSTS = new Set(["my-repair.it", "www.my-repair.it"]);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const isLoggedIn = !!req.auth;

  // Stripe webhook: always pass through (no auth, verified by signature)
  if (pathname === "/api/stripe/webhook") return NextResponse.next();

  // Tracking subdomain: t.my-repair.it/<token> → /t/<token> interno
  // API paths pass through directly (PDF doc generation, etc.)
  if (host === TRACKING_HOST) {
    if (pathname.startsWith("/api/")) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/t${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Marketing site: serve landing, feature pages, blog, changelog, legal
  if (MARKETING_HOSTS.has(host)) {
    if (
      pathname === "/" ||
      pathname === "/sitemap.xml" ||
      pathname === "/robots.txt" ||
      pathname.startsWith("/funzionalita") ||
      pathname.startsWith("/novita") ||
      pathname.startsWith("/blog") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/login")
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(`https://${APP_HOST}${pathname}${search}`);
  }

  // app.my-repair.it + localhost dev: full auth routing
  const isAppHost = host === APP_HOST;

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/pending") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/t/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/sign/") ||
    pathname.startsWith("/perizia/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/t/") ||
    pathname.startsWith("/api/support/client-request") ||
    pathname.startsWith("/api/support/sign-intervention") ||
    (!isAppHost && pathname === "/"); // landing pubblica solo in dev

  const isSuperAdmin = (req.auth?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;

  if (isLoggedIn && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL(isSuperAdmin ? "/admin" : "/dashboard", req.url));
  }

  // Super admin non ha un'org: blocca fuori dal pannello admin
  if (isLoggedIn && isSuperAdmin && !pathname.startsWith("/admin") && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.ico).*)"],
};
