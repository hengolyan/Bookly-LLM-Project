import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountKind, Prisma } from "@prisma/client";
import { createSession, hashPassword, type SessionUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createUserProfile, findUserProfileByEmail, findUserProfileByUsername } from "@/lib/supabase-db";
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

function canUseLocalSignupFallback(error: string) {
  const lower = error.toLowerCase();
  return (
    lower.includes("email rate limit") ||
    lower.includes("email not confirmed") ||
    lower.includes("already registered") ||
    lower.includes("user already registered")
  );
}

async function findExistingUsername(username: string) {
  try {
    return await prisma.user.findUnique({ where: { username }, select: { id: true } });
  } catch (error) {
    logServerError("api.auth.register.username.prisma", error);
    return await findUserProfileByUsername(username);
  }
}

async function findExistingEmail(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email }, select: { id: true } });
  } catch (error) {
    logServerError("api.auth.register.email.prisma", error);
    return await findUserProfileByEmail(email);
  }
}

async function createBooklyProfile(input: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  accountKind: AccountKind;
  accessToken?: string;
}) {
  try {
    return await prisma.user.create({
      data: {
        id: input.id,
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        accountKind: input.accountKind,
        settings: { create: {} }
      }
    });
  } catch (error) {
    logServerError("api.auth.register.profile.prisma", error);
    const profile = await createUserProfile(input);
    if (!profile) throw new Error("Profile insert returned no user.");
    return profile;
  }
}

function sessionFallbackUser(input: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  accountKind: AccountKind;
}): SessionUser {
  return {
    id: input.id,
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    accountKind: input.accountKind,
    avatarUrl: null,
    bio: ""
  };
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
    const existingUsername = await findExistingUsername(username);
    if (existingUsername) return NextResponse.json({ error: "Username already exists." }, { status: 409 });

    const existingEmail = await findExistingEmail(email);
    if (existingEmail) return NextResponse.json({ error: "Email already exists." }, { status: 409 });

    const supabaseSignup = await signUpWithSupabaseAuth({
      email,
      password: body.password,
      username,
      displayName: body.displayName,
      accountKind: body.accountKind
    });

    const passwordHash = await hashPassword(body.password);

    const supabaseError = supabaseSignup.error ?? "Supabase Auth signup failed.";

    if (!supabaseSignup.ok && !canUseLocalSignupFallback(supabaseError)) {
      console.error(`[BOOKLY:api.auth.register.supabase] ${supabaseSignup.error}`);
      return NextResponse.json({ error: supabaseError }, { status: supabaseSignup.status });
    }

    if (!supabaseSignup.ok) {
      console.error(`[BOOKLY:api.auth.register.supabase-fallback] ${supabaseError}`);
    }

    const supabaseAccessToken = supabaseSignup.ok ? supabaseSignup.data?.session?.access_token ?? supabaseSignup.data?.access_token : undefined;
    const supabaseUserId = supabaseSignup.ok ? supabaseSignup.data?.user?.id ?? supabaseSignup.data?.id : crypto.randomUUID();
    if (!supabaseUserId && supabaseSignup.ok) {
      return NextResponse.json({ error: "Supabase Auth signup did not return a user id. Check email confirmation/auth settings." }, { status: 500 });
    }

    const finalUserId = supabaseUserId ?? crypto.randomUUID();
    let user: SessionUser;
    try {
      user = await createBooklyProfile({
        id: finalUserId,
        email,
        username,
        displayName: body.displayName,
        passwordHash,
        accountKind: body.accountKind,
        accessToken: supabaseAccessToken
      });
    } catch (profileError) {
      logServerError("api.auth.register.profile.fallback-session", profileError);
      if (!supabaseSignup.ok) throw profileError;
      user = sessionFallbackUser({
        id: finalUserId,
        email,
        username,
        displayName: body.displayName,
        accountKind: body.accountKind
      });
    }

    await createSession(user);
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
