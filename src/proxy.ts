import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const protectedRoutes = ["/dashboard", "/admin", "/account"];
const authRoutes = ["/auth/sign-in", "/auth/sign-up"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  if (path === "/" || path.startsWith("/api/")) {
    return NextResponse.next();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__bauth.session_token");
  const hasSession = !!sessionCookie?.value;

  if (isProtectedRoute && !hasSession) {
    const signInUrl = new URL("/auth/sign-in", req.nextUrl);
    signInUrl.searchParams.set(
      "message",
      "You must be signed in to access this page!"
    );
    signInUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
