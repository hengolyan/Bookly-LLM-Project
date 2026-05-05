import { NextResponse } from "next/server";
import { z } from "zod";
import { PostKind } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { analyzeContent } from "@/lib/ai";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  kind: z.nativeEnum(PostKind),
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().url().optional(),
  bookId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = postSchema.parse(await request.json());
    const analysis = await analyzeContent({ title: body.title, body: body.body, contentType: "post" });

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        kind: body.kind,
        title: body.title,
        body: body.body,
        imageUrl: body.imageUrl,
        bookId: body.bookId,
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
