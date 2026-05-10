import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountKind, Prisma } from "@prisma/client";
import { createSession, hashPassword } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(2).max(80),
  password: z.string().min(8),
  accountKind: z.nativeEnum(AccountKind).default(AccountKind.READER_WRITER)
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in a valid email, username, display name, and password of at least 8 characters." }, { status: 400 });
  }

  const body = parsed.data;
  const passwordHash = await hashPassword(body.password);

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        username: body.username.toLowerCase(),
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
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(" or ") : "email or username";
      return NextResponse.json({ error: `That ${target} is already used. Try signing in or choose another one.` }, { status: 409 });
    }
    return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 500 });
  }
}
