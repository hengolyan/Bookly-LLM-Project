import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { upsertGoogleBook } from "@/lib/google-books";
import { prisma } from "@/lib/prisma";

const googleBookSchema = z.object({
  externalSource: z.literal("google_books"),
  externalId: z.string().min(1),
  title: z.string().min(1),
  authorName: z.string().min(1),
  description: z.string().min(1),
  coverUrl: z.string().url().optional(),
  isbn: z.string().optional(),
  publishedYear: z.number().int().optional(),
  averageRating: z.number().default(0),
  genres: z.array(z.string()).default([])
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = z.object({ book: googleBookSchema }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid Google book payload" }, { status: 400 });

    const book = await upsertGoogleBook(parsed.data.book);
    const existing = await prisma.savedItem.findFirst({
      where: { userId: user.id, bookId: book.id },
      select: { id: true }
    });

    if (!existing) {
      await prisma.savedItem.create({ data: { userId: user.id, bookId: book.id } });
    }

    return NextResponse.json({ status: "success", saved: true, bookId: book.id });
  } catch (error) {
    logServerError("api.books.google.save", error);
    return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 500 });
  }
}
