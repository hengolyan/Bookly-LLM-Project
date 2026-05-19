import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, authorId: true }
    });
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    if (post.authorId !== user.id) return NextResponse.json({ error: "You can only remove your own posts." }, { status: 403 });

    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ status: "success", deleted: true });
  } catch (error) {
    logServerError("api.posts.delete", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not remove this post.") }, { status: 500 });
  }
}
