import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { UserRole, hasMinimumRole } from "@/data/contracts/auth";

const publicPrefixes = ["/trace/waste/", "/trace/product/", "/api/auth/", "/auth/callback"];
const publicExact = new Set(["/", "/login", "/forgot-password", "/reset-password"]);
const authPages = new Set(["/login", "/forgot-password"]);

function requiredRole(pathname: string): UserRole {
  if (pathname === "/admin/settings" || pathname.startsWith("/admin/settings/")) return "super_admin";
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return "admin";
  if (/^\/waste-batches\/(new|[^/]+\/edit)$/.test(pathname)) return "operator";
  if (/^\/products\/(new|[^/]+\/edit)$/.test(pathname)) return "researcher";
  if (/^\/laboratory\/(new|[^/]+\/edit)$/.test(pathname)) return "researcher";
  if (pathname === "/ai/waste-analyzer" || pathname === "/ai/processing-advisor") return "operator";
  if (pathname === "/ai/history" || pathname === "/reports/generate") return "researcher";
  return "viewer";
}

function isPublic(pathname: string): boolean {
  return publicExact.has(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (isPublic(request.nextUrl.pathname)) return response;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "?auth=configuration";
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false,
            path: "/",
          });
        });
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    if (isPublic(request.nextUrl.pathname)) return response;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "?auth=required";
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut({ scope: "local" });
    if (isPublic(request.nextUrl.pathname)) return response;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "?auth=inactive";
    return NextResponse.redirect(redirectUrl);
  }

  if (authPages.has(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!isPublic(request.nextUrl.pathname) && !hasMinimumRole(profile.role as UserRole, requiredRole(request.nextUrl.pathname))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "?auth=forbidden";
    return NextResponse.redirect(redirectUrl);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
