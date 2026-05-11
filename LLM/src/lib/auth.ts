import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { AccountKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/env";
import { findUserProfileById } from "@/lib/supabase-db";

const COOKIE_NAME = "bookly_session";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  accountKind: AccountKind;
  avatarUrl: string | null;
  bio: string;
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    console.error("[BOOKLY:auth] JWT_SECRET is missing or shorter than 24 characters.");
    throw new Error("JWT_SECRET must be set to a long random value.");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: string | SessionUser) {
  const userId = typeof user === "string" ? user : user.id;
  const claims =
    typeof user === "string"
      ? {}
      : {
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          accountKind: user.accountKind,
          avatarUrl: user.avatarUrl,
          bio: user.bio
        };

  const token = await new SignJWT({ sub: userId, ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(jwtSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  noStore();
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, jwtSecret());
    const userId = verified.payload.sub;
    if (!userId) return null;
    const fallbackUser =
      typeof verified.payload.email === "string" &&
      typeof verified.payload.username === "string" &&
      typeof verified.payload.displayName === "string" &&
      typeof verified.payload.accountKind === "string"
        ? {
            id: userId,
            email: verified.payload.email,
            username: verified.payload.username,
            displayName: verified.payload.displayName,
            accountKind: verified.payload.accountKind as AccountKind,
            avatarUrl: typeof verified.payload.avatarUrl === "string" ? verified.payload.avatarUrl : null,
            bio: typeof verified.payload.bio === "string" ? verified.payload.bio : ""
          }
        : null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          accountKind: true,
          avatarUrl: true,
          bio: true
        }
      });
      if (user) return user;
    } catch (error) {
      logServerError("auth.getCurrentUser.prisma", error);
    }

    try {
      const user = await findUserProfileById(userId);
      if (user) return user;
    } catch (error) {
      logServerError("auth.getCurrentUser.supabase", error);
    }

    return fallbackUser;
  } catch (error) {
    logServerError("auth.getCurrentUser", error);
    return null;
  }
}
