import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/access-denied",
  "/interview",
  "/ex-portal",
  "/api/auth",
];

/** Rotas que exigem ADMIN ou IT_ADMIN — o restante do painel é liberado
 * para qualquer papel autenticado que não seja EMPLOYEE. */
const IT_ADMIN_ONLY_PREFIXES = ["/integrations"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (user.role === "EMPLOYEE") {
    return NextResponse.redirect(new URL("/access-denied", req.nextUrl.origin));
  }

  const isItAdminOnly = IT_ADMIN_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isItAdminOnly && user.role !== "ADMIN" && user.role !== "IT_ADMIN") {
    return NextResponse.redirect(new URL("/access-denied", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
