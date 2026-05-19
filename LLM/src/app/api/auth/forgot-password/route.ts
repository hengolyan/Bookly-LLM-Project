import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { sendPasswordRecoveryEmail } from "@/lib/supabase-auth";

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const origin = new URL(request.url).origin;
    const result = await sendPasswordRecoveryEmail({
      email: parsed.data.email.toLowerCase(),
      redirectTo: `${origin}/reset-password`
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Could not send reset email." }, { status: result.status });
    }

    return NextResponse.json({
      status: "success",
      message: "If this email exists, BOOKLY sent password reset instructions."
    });
  } catch (error) {
    logServerError("api.auth.forgotPassword", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not send reset email.") }, { status: 500 });
  }
}
