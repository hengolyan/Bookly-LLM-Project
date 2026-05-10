import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountKind, Prisma } from "@prisma/client";
import { createSession, hashPassword } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthEnv, signUpWithSupabaseAuth } from "@/lib/supabase-auth";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(2).max(80),
  password: z.string().min(8, "Password must be at least 8 characters."),
  accountKind: z.nativeEnum(AccountKind).default(AccountKind.READER_WRITER)
});

function developmentError(message: string, details?: string) {
  return process.env.NODE_ENV === "development" && details ? `${message} (${details})` : message;
}

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please fill in valid signup details." }, { status: 400 });
  }

  const body = parsed.data;
  const email = body.email.toLowerCase();
  const username = body.username.toLowerCase();
  const supabaseEnv = getSupabaseAuthEnv();
  if (supabaseEnv.missing.length) {
    return NextResponse.json({ error: `Missing Supabase Auth environment variables: ${supabaseEnv.missing.join(", ")}.` }, { status: 500 });
  }

  try {
    const existingUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (existingUsername) return NextResponse.json({ error: "Username already exists." }, { status: 409 });

    const existingEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingEmail) return NextResponse.json({ error: "Email already exists." }, { status: 409 });

    const supabaseSignup = await signUpWithSupabaseAuth({
      email,
      password: body.password,
      username,
      displayName: body.displayName,
      accountKind: body.accountKind
    });

    if (!supabaseSignup.ok) {
      console.error(`[BOOKLY:api.auth.register.supabase] ${supabaseSignup.error}`);
      return NextResponse.json({ error: supabaseSignup.error }, { status: supabaseSignup.status });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: body.displayName,
        passwordHash,
        accountKind: body.accountKind,
        settings: { create: {} }
      }
    });

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
    logServerError("api.auth.register", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(" ") : "";
      if (target.includes("username")) return NextResponse.json({ error: "Username already exists." }, { status: 409 });
      if (target.includes("email")) return NextResponse.json({ error: "Email already exists." }, { status: 409 });
      return NextResponse.json({ error: "Email or username already exists." }, { status: 409 });
    }
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: developmentError(databaseUnavailableMessage(), details) }, { status: 500 });
  }
}
