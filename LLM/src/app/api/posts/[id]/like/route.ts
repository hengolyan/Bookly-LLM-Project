import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId: params.id } },
      select: { id: true }
    });

    if (!existing) {
      await prisma.like.create({ data: { userId: user.id, postId: params.id } });
    }

    return NextResponse.json({ status: "success", liked: true });
  } catch (error) {
    logServerError("api.posts.like", error);
    return NextResponse.json({ error: apiErrorMessage(error) }, { status: 500 });
  }
}
