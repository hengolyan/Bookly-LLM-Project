import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeContent } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

const bookSchema = z.object({
  title: z.string().min(1),
  authorName: z.string().min(1),
  description: z.string().min(1),
  coverUrl: z.string().url().optional(),
  isbn: z.string().optional(),
  externalSource: z.string().optional(),
  externalId: z.string().optional(),
  publishedYear: z.number().int().optional()
});

export async function POST(request: Request) {
  const body = bookSchema.parse(await request.json());
  const analysis = await analyzeContent({
    title: body.title,
    body: `${body.authorName}\n${body.description}`,
    contentType: "book"
  });

  const book = await prisma.book.create({
    data: {
      title: body.title,
      authorName: body.authorName,
      description: body.description,
      coverUrl: body.coverUrl,
      isbn: body.isbn,
      externalSource: body.externalSource ?? "manual",
      externalId: body.externalId,
      publishedYear: body.publishedYear,
      aiAnalysis: {
        create: {
          contentType: "BOOK",
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

  return NextResponse.json({ book, analysis });
}
