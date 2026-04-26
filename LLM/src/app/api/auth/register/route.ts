import { NextResponse } from "next/server";
import { z } from "zod";
import { AccountKind } from "@prisma/client";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(2).max(80),
  password: z.string().min(8),
  accountKind: z.nativeEnum(AccountKind).default(AccountKind.READER_WRITER)
});

export async function POST(request: Request) {
  const body = registerSchema.parse(await request.json());
  const passwordHash = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      username: body.username.toLowerCase(),
      displayName: body.displayName,
      passwordHash,
      accountKind: body.accountKind
    }
  });

  await createSession(user.id);
  return NextResponse.json({ id: user.id, username: user.username });
}
