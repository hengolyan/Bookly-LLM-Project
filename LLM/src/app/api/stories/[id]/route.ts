import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { analyzeContent } from "@/lib/ai";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const updateStorySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  coverUrl: z.string().url().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  chapterTitle: z.string().optional(),
  body: z.string().optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = updateStorySchema.parse(await request.json());
    const story = await prisma.story.findFirst({
      where: { id: params.id, authorId: user.id },
      include: { chapters: { orderBy: { number: "asc" } } }
    });
    if (!story) return NextResponse.json({ error: "Story not found or you do not own it." }, { status: 404 });

    const shouldAddChapter = Boolean(body.chapterTitle?.trim() && body.body?.trim());
    const nextChapterNumber = story.chapters.length + 1;
    const analysisText = [body.description, ...story.chapters.map((chapter) => chapter.body), shouldAddChapter ? body.body : ""].filter(Boolean).join("\n\n");
    const analysis = await analyzeContent({ title: body.title, body: analysisText, contentType: "story" });

    const updated = await prisma.story.update({
      where: { id: story.id },
      data: {
        title: body.title,
        description: body.description,
        coverUrl: body.coverUrl,
        status: body.status,
        publishedAt: body.status === "PUBLISHED" ? story.publishedAt ?? new Date() : null,
        chapters: shouldAddChapter
          ? {
              create: {
                number: nextChapterNumber,
                title: body.chapterTitle!.trim(),
                body: body.body!.trim()
              }
            }
          : undefined,
        aiAnalysis: {
          upsert: {
            create: {
              contentType: "STORY",
              summary: analysis.summary,
              genres: analysis.genres,
              themes: analysis.themes,
              audience: analysis.audience,
              mood: analysis.mood,
              moderationFlags: analysis.moderationFlags,
              embeddingText: `${analysis.summary}\n${analysis.genres.join(", ")}\n${analysis.themes.join(", ")}`
            },
            update: {
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
      },
      include: { chapters: { orderBy: { number: "asc" } }, aiAnalysis: true }
    });

    return NextResponse.json({ status: "success", story: updated, analysis });
  } catch (error) {
    logServerError("api.stories.update", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not update this story.") }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const story = await prisma.story.findFirst({ where: { id: params.id, authorId: user.id }, select: { id: true } });
    if (!story) return NextResponse.json({ error: "Story not found or you do not own it." }, { status: 404 });

    await prisma.story.delete({ where: { id: story.id } });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    logServerError("api.stories.delete", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not delete this story.") }, { status: 500 });
  }
}
