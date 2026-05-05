import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountKind } from "@prisma/client";
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
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details" }, { status: 400 });
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
    return NextResponse.json({ id: user.id, username: user.username });
  } catch (error) {
    logServerError("api.auth.register", error);
    return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 500 });
  }
}
