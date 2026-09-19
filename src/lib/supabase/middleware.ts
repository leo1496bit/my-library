import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Chemins accessibles sans session active.
const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback", "/auth/confirm"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Rafraîchit la session Supabase à chaque requête et protège les routes
// applicatives : sans session, redirection vers /login.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname) && pathname !== "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/library";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // IMPORTANT : ne pas modifier supabaseResponse (cookies) sans recréer
  // l'objet via NextResponse.next(...) comme ci-dessus, sinon la session
  // se désynchronise de manière aléatoire.
  return supabaseResponse;
}
