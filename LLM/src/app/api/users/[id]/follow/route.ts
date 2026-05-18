import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Log in to follow readers and writers." }, { status: 401 });
    if (user.id === params.id) return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: user.id, followingId: params.id } },
      update: {},
      create: { followerId: user.id, followingId: params.id }
    });

    return NextResponse.json({ status: "success", following: true });
  } catch (error) {
    logServerError("api.users.follow", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not follow this user.") }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Log in to unfollow readers and writers." }, { status: 401 });

    await prisma.follow.deleteMany({
      where: { followerId: user.id, followingId: params.id }
    });

    return NextResponse.json({ status: "success", following: false });
  } catch (error) {
    logServerError("api.users.unfollow", error);
    return NextResponse.json({ error: apiErrorMessage(error, "Could not unfollow this user.") }, { status: 500 });
  }
}
