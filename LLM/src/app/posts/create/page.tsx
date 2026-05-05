import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PostComposer } from "@/components/PostComposer";
import { getCurrentUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { getGoogleBook, type NormalizedGoogleBook } from "@/lib/google-books";
import { prisma } from "@/lib/prisma";
import type { PostKind } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CreatePostPage({ searchParams }: { searchParams?: { bookId?: string; googleBookId?: string; kind?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let books: { id: string; title: string; authorName: string }[] = [];
  let externalBook: NormalizedGoogleBook | undefined;
  let databaseError = "";

  try {
    const [savedBooks, googleBook] = await Promise.all([
      prisma.book.findMany({
        select: { id: true, title: true, authorName: true },
        orderBy: { title: "asc" }
      }),
      searchParams?.googleBookId ? getGoogleBook(searchParams.googleBookId) : Promise.resolve(null)
    ]);
    books = savedBooks;
    externalBook = googleBook ?? undefined;
  } catch (error) {
    logServerError("createPost", error);
    databaseError = databaseUnavailableMessage();
  }

  const kind = ["REVIEW", "RECOMMENDATION", "QUOTE", "DISCUSSION", "READING_UPDATE"].includes(searchParams?.kind ?? "")
    ? (searchParams?.kind as PostKind)
    : "RECOMMENDATION";

  return (
    <AppShell>
      <section className="max-w-3xl">
        <h1 className="text-3xl font-black text-ink">Create Post</h1>
        <p className="mt-1 text-ink/64">Recommend books, write reviews, share quotes, or start a reading discussion.</p>
        <div className="mt-5">
          {databaseError ? (
            <EmptyState title="Post creation is temporarily unavailable" body={databaseError} />
          ) : (
            <PostComposer books={books} defaultBookId={searchParams?.bookId} externalBook={externalBook} defaultKind={kind} />
          )}
        </div>
      </section>
    </AppShell>
  );
}
