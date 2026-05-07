import { NextResponse } from "next/server";
import { z } from "zod";
import { PostKind } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { analyzeContent } from "@/lib/ai";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { upsertExternalBook } from "@/lib/books";
import { prisma } from "@/lib/prisma";

const externalBookSchema = z.object({
  id: z.string().optional(),
  external_id: z.string().min(1),
  source: z.enum(["open_library", "gutendex", "google_books"]),
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

const postSchema = z.object({
  kind: z.nativeEnum(PostKind),
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().url().optional(),
  bookId: z.string().optional(),
  externalBook: externalBookSchema.optional()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = postSchema.parse(await request.json());
    const analysis = await analyzeContent({ title: body.title, body: body.body, contentType: "post" });
    const book = body.externalBook ? await upsertExternalBook(body.externalBook) : null;

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        kind: body.kind,
        title: body.title,
        body: body.body,
        imageUrl: body.imageUrl,
        bookId: book?.id ?? body.bookId,
        aiAnalysis: {
          create: {
            contentType: "POST",
            summary: analysis.summary,
            genres: analysis.genres,
            themes: analysis.themes,
            audience: analysis.audience,
            mood: analysis.mood,
            moderationFlags: analysis.moderationFlags,
            embeddingText: `${analysis.summary}\n${analysis.genres.join(", ")}\n${analysis.themes.join(", ")}`
          }
        }
      }
    });

    return NextResponse.json({ post, analysis });
  } catch (error) {
    logServerError("api.posts.create", error);
    return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 500 });
  }
}
