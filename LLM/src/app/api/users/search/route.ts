import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiErrorMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").replace(/^@/, "").trim();

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        id: user?.id ? { not: user.id } : undefined,
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        accountKind: true
      },
      orderBy: [{ username: "asc" }],
      take: 8
    });

    return NextResponse.json({ users });
  } catch (error) {
    logServerError("api.users.search", error);
    return NextResponse.json({ error: apiErrorMessage(error), users: [] }, { status: 500 });
  }
}
