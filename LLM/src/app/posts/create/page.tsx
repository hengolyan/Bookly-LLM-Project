import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PostComposer } from "@/components/PostComposer";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PostKind } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CreatePostPage({ searchParams }: { searchParams?: { bookId?: string; kind?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const books = await prisma.book.findMany({
    select: { id: true, title: true, authorName: true },
    orderBy: { title: "asc" }
  });

  const kind = ["REVIEW", "RECOMMENDATION", "QUOTE", "DISCUSSION", "READING_UPDATE"].includes(searchParams?.kind ?? "")
    ? (searchParams?.kind as PostKind)
    : "RECOMMENDATION";

  return (
    <AppShell>
      <section className="max-w-3xl">
        <h1 className="text-3xl font-black text-ink">Create Post</h1>
        <p className="mt-1 text-ink/64">Recommend books, write reviews, share quotes, or start a reading discussion.</p>
        <div className="mt-5">
          <PostComposer books={books} defaultBookId={searchParams?.bookId} defaultKind={kind} />
        </div>
      </section>
    </AppShell>
  );
}
