import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { commentPostViaRest } from "@/lib/supabase-actions";

const commentSchema = z.object({
  body: z.string().trim().min(1).max(500)
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = commentSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid comment" }, { status: 400 });

    try {
      const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

      const comment = await prisma.comment.create({
        data: {
          authorId: user.id,
          postId: params.id,
          body: parsed.data.body
        },
        include: {
          author: { select: { displayName: true, username: true } }
        }
      });

      return NextResponse.json({ status: "success", comment });
    } catch (prismaError) {
      logServerError("api.posts.comments.create.prisma-fallback", prismaError);
      const comment = await commentPostViaRest(user, params.id, parsed.data.body);
      return NextResponse.json({ status: "success", comment });
    }
  } catch (error) {
    logServerError("api.posts.comments.create", error);
    return NextResponse.json({ error: apiErrorMessage(error) }, { status: 500 });
  }
}
