import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { updateSupabasePassword } from "@/lib/supabase-auth";

const resetPasswordSchema = z.object({
  accessToken: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export async function POST(request: Request) {
  try {
    const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid new password." }, { status: 400 });
    }

    const result = await updateSupabasePassword(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Could not reset password." }, { status: result.status });
    }

    const email = result.data?.user?.email ?? result.data?.email;
    if (email) {
      try {
        await prisma.user.update({
          where: { email: email.toLowerCase() },
          data: { passwordHash: await hashPassword(parsed.data.password) }
        });
      } catch (error) {
        logServerError("api.auth.resetPassword.localHash", error);
      }
    }

    return NextResponse.json({ status: "success", message: "Password updated. You can sign in with the new password." });
  } catch (error) {
    logServerError("api.auth.resetPassword", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not reset password.") }, { status: 500 });
  }
}
