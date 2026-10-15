import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP basic auth for /admin. Any username, password = ADMIN_PASSWORD.
 * Unset in development → admin is open. Unset in production → admin is locked.
 */
export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Admin is locked: set ADMIN_PASSWORD.", { status: 503 });
    }
    return NextResponse.next();
  }
  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    if (supplied === password) return NextResponse.next();
  }
  return new NextResponse("Sign in required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="PTA volunteers", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/admin/:path*"] };
