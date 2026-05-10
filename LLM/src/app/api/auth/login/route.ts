import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthEnv, signInWithSupabaseAuth } from "@/lib/supabase-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }
    const body = parsed.data;
    const email = body.email.toLowerCase();
    const supabaseEnv = getSupabaseAuthEnv();
    if (supabaseEnv.missing.length) {
      return NextResponse.json({ error: `Missing Supabase Auth environment variables: ${supabaseEnv.missing.join(", ")}.` }, { status: 500 });
    }
    const supabaseLogin = await signInWithSupabaseAuth({ email, password: body.password });
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!supabaseLogin.ok && (!existingUser || !(await verifyPassword(body.password, existingUser.passwordHash)))) {
      console.error(`[BOOKLY:api.auth.login.supabase] ${supabaseLogin.error}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          email,
          username: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24),
          displayName: email.split("@")[0],
          passwordHash: await hashPassword(body.password),
          settings: { create: {} }
        }
      }));

    await createSession(user.id);
    return NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        accountKind: user.accountKind
      }
    });
  } catch (error) {
    logServerError("api.auth.login", error);
    return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 500 });
  }
}
