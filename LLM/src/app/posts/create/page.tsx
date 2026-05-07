import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PostComposer } from "@/components/PostComposer";
import { getCurrentUser } from "@/lib/auth";
import { getExternalBook, type BookSource, type UnifiedBook } from "@/lib/books";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { PostKind } from "@prisma/client";

export const dynamic = "force-dynamic";

function isBookSource(source?: string): source is BookSource {
  return source === "open_library" || source === "gutendex" || source === "google_books";
}

export default async function CreatePostPage({
  searchParams
}: {
  searchParams?: { bookId?: string; googleBookId?: string; source?: string; externalId?: string; kind?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let books: { id: string; title: string; authorName: string }[] = [];
  let externalBook: UnifiedBook | undefined;
  let databaseError = "";
  const externalSource = isBookSource(searchParams?.source) ? searchParams.source : searchParams?.googleBookId ? "google_books" : undefined;
  const externalId = searchParams?.externalId ?? searchParams?.googleBookId;

  try {
    const [savedBooks, fetchedExternalBook] = await Promise.all([
      prisma.book.findMany({
        select: { id: true, title: true, authorName: true },
        orderBy: { title: "asc" }
      }),
      externalSource && externalId ? getExternalBook(externalSource, externalId) : Promise.resolve(null)
    ]);
    books = savedBooks;
    externalBook = fetchedExternalBook ?? undefined;
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
