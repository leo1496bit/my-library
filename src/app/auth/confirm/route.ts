import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Lien de confirmation d'e-mail envoyé par Supabase Auth
// (?token_hash=...&type=email).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/library";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation`);
}
