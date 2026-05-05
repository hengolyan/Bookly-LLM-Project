import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const book = await prisma.book.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    const existing = await prisma.savedItem.findFirst({
      where: { userId: user.id, bookId: params.id },
      select: { id: true }
    });

    if (!existing) {
      await prisma.savedItem.create({ data: { userId: user.id, bookId: params.id } });
    }

    return NextResponse.json({ status: "success", saved: true });
  } catch (error) {
    logServerError("api.books.save", error);
    return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 500 });
  }
}
