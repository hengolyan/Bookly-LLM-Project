import { NextResponse } from "next/server";
import { z } from "zod";
import { PostKind } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { analyzeContent } from "@/lib/ai";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { upsertExternalBook } from "@/lib/books";
import { prisma } from "@/lib/prisma";
import { createPostViaRest } from "@/lib/supabase-actions";

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
  otherBookTitle: z.string().trim().min(1).max(160).optional(),
  taggedUsernames: z.array(z.string().trim().min(1).max(32)).default([]),
  externalBook: externalBookSchema.optional()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = postSchema.parse(await request.json());
    const taggedUsernames = Array.from(new Set(body.taggedUsernames.map((username) => username.replace(/^@/, "").toLowerCase())));
    const validTaggedUsers = taggedUsernames.length
      ? await prisma.user.findMany({
          where: { username: { in: taggedUsernames } },
          select: { id: true, username: true }
        })
      : [];
    const mentionLine = validTaggedUsers.length ? `\n\nTagged: ${validTaggedUsers.map((user) => `@${user.username}`).join(" ")}` : "";
    const postBody = `${body.body}${mentionLine}`;
    const analysis = await analyzeContent({ title: body.title, body: postBody, contentType: "post" });
    try {
      const manualBookId = body.otherBookTitle?.toLowerCase();
      const book = body.externalBook
        ? await upsertExternalBook(body.externalBook)
        : manualBookId
          ? (await prisma.book.findFirst({ where: { externalSource: "bookly_manual", externalId: manualBookId } })) ??
            (await prisma.book.create({
              data: {
                title: body.otherBookTitle!,
                authorName: "Community mention",
                description: `Mentioned by ${user.displayName} in a BOOKLY post.`,
                externalSource: "bookly_manual",
                externalId: manualBookId
              }
            }))
          : null;

      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          kind: body.kind,
          title: body.title,
          body: postBody,
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

      if (validTaggedUsers.length) {
        await prisma.postMention
          .createMany({
            data: validTaggedUsers.map((taggedUser) => ({
              postId: post.id,
              userId: taggedUser.id
            })),
            skipDuplicates: true
          })
          .catch((mentionError) => logServerError("api.posts.create.mentions", mentionError));
      }

      return NextResponse.json({ post, analysis });
    } catch (prismaError) {
      logServerError("api.posts.create.prisma-fallback", prismaError);
      const post = await createPostViaRest({
        user,
        kind: body.kind,
        title: body.title,
        body: postBody,
        imageUrl: body.imageUrl,
        bookId: body.bookId,
        otherBookTitle: body.otherBookTitle,
        externalBook: body.externalBook,
        analysis
      });
      return NextResponse.json({ post, analysis });
    }
  } catch (error) {
    logServerError("api.posts.create", error);
    return NextResponse.json({ error: apiErrorMessage(error) }, { status: 500 });
  }
}
