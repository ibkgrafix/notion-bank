import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/personal-banking",
  "/business-banking",
  "/checking",
  "/savings",
  "/cards",
  "/loans",
  "/mortgages",
  "/security",
  "/about",
  "/contact",
  "/help",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  // Decode token (without full DB verification — DB check is in server components)
  let role: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      role = (payload as { role?: string }).role || null;
    } catch {
      role = null;
    }
  }

  const isDashboardPath = pathname.startsWith("/dashboard");
  const isAdminPath = pathname.startsWith("/admin");
  const isProtectedApiPath =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/");

  // Require auth for dashboard/admin
  if ((isDashboardPath || isAdminPath || isProtectedApiPath) && !role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Block non-admin from /admin (middleware as first layer; server enforces too)
  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect authenticated users away from login/register
  if ((pathname === "/login" || pathname === "/register") && role) {
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/admin" : "/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
