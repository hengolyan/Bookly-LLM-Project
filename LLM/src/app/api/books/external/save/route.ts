import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { type BookSource, upsertExternalBook } from "@/lib/books";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const sources: BookSource[] = ["open_library", "gutendex", "google_books"];

const externalBookSchema = z.object({
  id: z.string().optional(),
  external_id: z.string().min(1),
  source: z.enum(sources as [BookSource, ...BookSource[]]),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  cover_url: z.string().url().optional(),
  description: z.string().min(1),
  categories: z.array(z.string()).default([]),
  subjects: z.array(z.string()).default([]),
  rating: z.number().default(0),
  readable_url: z.string().url().optional(),
  isbn: z.string().optional(),
  published_year: z.number().int().optional(),
  externalSource: z.string().optional(),
  externalId: z.string().optional(),
  authorName: z.string().optional(),
  coverUrl: z.string().url().optional(),
  averageRating: z.number().optional(),
  genres: z.array(z.string()).optional(),
  readableUrl: z.string().url().optional()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = z.object({ book: externalBookSchema }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid external book payload" }, { status: 400 });

    const book = await upsertExternalBook(parsed.data.book);
    const existing = await prisma.savedItem.findFirst({
      where: { userId: user.id, bookId: book.id },
      select: { id: true }
    });

    if (!existing) await prisma.savedItem.create({ data: { userId: user.id, bookId: book.id } });

    return NextResponse.json({ status: "success", saved: true, bookId: book.id });
  } catch (error) {
    logServerError("api.books.external.save", error);
    return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 500 });
  }
}
