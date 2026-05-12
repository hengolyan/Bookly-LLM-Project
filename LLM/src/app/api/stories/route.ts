import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { analyzeContent } from "@/lib/ai";

const storySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  coverUrl: z.string().url().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  chapters: z.array(
    z.object({
      title: z.string().min(1),
      body: z.string().min(1)
    })
  ).min(1)
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = storySchema.parse(await request.json());
    const joinedText = [body.description, ...body.chapters.map((chapter) => chapter.body)].join("\n\n");
    const analysis = await analyzeContent({ title: body.title, body: joinedText, contentType: "story" });

    const story = await prisma.story.create({
      data: {
        authorId: user.id,
        title: body.title,
        description: body.description,
        coverUrl: body.coverUrl,
        status: body.status,
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
        chapters: {
          create: body.chapters.map((chapter, index) => ({
            number: index + 1,
            title: chapter.title,
            body: chapter.body
          }))
        },
        aiAnalysis: {
          create: {
            contentType: "STORY",
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

    return NextResponse.json({ story, analysis });
  } catch (error) {
    logServerError("api.stories.create", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not save this story.") }, { status: 500 });
  }
}
