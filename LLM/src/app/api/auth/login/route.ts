import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword, verifyPassword, type SessionUser } from "@/lib/auth";
import { apiErrorMessage, databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createUserProfile, findUserProfileByEmail } from "@/lib/supabase-db";
import { getSupabaseAuthEnv, signInWithSupabaseAuth } from "@/lib/supabase-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function findExistingUser(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    logServerError("api.auth.login.findUser.prisma", error);
    return await findUserProfileByEmail(email);
  }
}

async function createFallbackUser({
  id,
  email,
  password,
  accessToken
}: {
  id: string;
  email: string;
  password: string;
  accessToken?: string;
}) {
  const usernameBase = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || "reader";
  const passwordHash = await hashPassword(password);
  try {
    return await prisma.user.create({
      data: {
        id,
        email,
        username: usernameBase,
        displayName: usernameBase,
        passwordHash,
        settings: { create: {} }
      }
    });
  } catch (error) {
    logServerError("api.auth.login.createUser.prisma", error);
    const profile = await createUserProfile({
      id,
      email,
      username: usernameBase,
      displayName: usernameBase,
      passwordHash,
      accountKind: "READER_WRITER",
      accessToken
    });
    if (!profile) throw new Error("Profile insert returned no user.");
    return profile;
  }
}

function sessionFallbackUser({
  id,
  email
}: {
  id: string;
  email: string;
}): SessionUser {
  const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || "reader";
  return {
    id,
    email,
    username,
    displayName: username,
    accountKind: "READER_WRITER",
    avatarUrl: null,
    bio: ""
  };
}

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
    const existingUser = await findExistingUser(email);

    const localPasswordHash =
      existingUser && "passwordHash" in existingUser && typeof existingUser.passwordHash === "string"
        ? existingUser.passwordHash
        : null;

    if (!supabaseLogin.ok && (!localPasswordHash || !(await verifyPassword(body.password, localPasswordHash)))) {
      console.error(`[BOOKLY:api.auth.login.supabase] ${supabaseLogin.error}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    let user = existingUser;
    if (!user) {
      const fallbackUserId = supabaseLogin.data?.user?.id ?? supabaseLogin.data?.id ?? crypto.randomUUID();
      try {
        user = await createFallbackUser({
          id: fallbackUserId,
          email,
          password: body.password,
          accessToken: supabaseLogin.data?.session?.access_token ?? supabaseLogin.data?.access_token
        });
      } catch (profileError) {
        logServerError("api.auth.login.profile.fallback-session", profileError);
        if (!supabaseLogin.ok) throw profileError;
        user = sessionFallbackUser({ id: fallbackUserId, email });
      }
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
    logServerError("api.auth.login", error);
    return NextResponse.json({ error: apiErrorMessage(error, databaseUnavailableMessage()) }, { status: 500 });
  }
}
