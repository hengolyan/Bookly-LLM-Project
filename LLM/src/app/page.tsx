import Link from "next/link";
import type { CSSProperties } from "react";
import { BookOpen, ChevronRight, Clock, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Metric } from "@/components/Metric";
import { getCurrentUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackCover = "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80";

export default async function HomePage() {
  const user = await getCurrentUser();
  let currentRead: any = null;
  let books: any[] = [];
  let savedCount = 0;
  let draftCount = 0;
  let reviewCount = 0;
  let databaseError = "";

  try {
    currentRead = user
      ? await prisma.readingProgress.findFirst({
          where: { userId: user.id },
          orderBy: { lastOpenedAt: "desc" },
          include: {
            story: { include: { author: { select: { displayName: true } }, chapters: { orderBy: { number: "asc" }, take: 1 } } },
            book: true
          }
        })
      : null;

    books = await prisma.book.findMany({
      orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { aiAnalysis: true, posts: { take: 1 } }
    });

    savedCount = user ? await prisma.savedItem.count({ where: { userId: user.id } }) : 0;
    draftCount = user ? await prisma.story.count({ where: { authorId: user.id, status: "DRAFT" } }) : 0;
    reviewCount = user ? await prisma.post.count({ where: { authorId: user.id, kind: "REVIEW" } }) : 0;
  } catch (error) {
    logServerError("home", error);
    databaseError = databaseUnavailableMessage();
  }

  const currentTitle = currentRead?.story?.title ?? currentRead?.book?.title ?? books[0]?.title ?? "Start your first BOOKLY read";
  const currentAuthor = currentRead?.story?.author.displayName ?? currentRead?.book?.authorName ?? "BOOKLY";
  const currentCover = currentRead?.story?.coverUrl ?? currentRead?.book?.coverUrl ?? fallbackCover;
  const currentHref = currentRead?.storyId ? `/stories/${currentRead.storyId}` : currentRead?.bookId ? `/books/${currentRead.bookId}` : "/discover";

  return (
    <AppShell>
      <section className="grid min-w-0 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex min-w-0 items-center justify-between gap-4 lg:col-span-2">
          <div className="min-w-0">
            <p className="font-ui text-xs font-bold uppercase tracking-[0.18em] text-gold sm:text-sm sm:tracking-[0.22em]">Enchanted Folio</p>
            <h1 className="mt-1 text-xl font-black text-ink sm:text-3xl">Your reading garden</h1>
          </div>
        </div>
        {databaseError ? (
          <div className="lg:col-span-2">
            <EmptyState title="BOOKLY needs its database connection" body={databaseError} actionHref="/login" actionLabel="Go to login" />
          </div>
        ) : null}
        <div className="glass overflow-hidden rounded-lg">
          <div className="grid min-h-[360px] md:grid-cols-[0.8fr_1.2fr]">
            <div className="book-cover min-h-[280px]" style={{ "--cover-url": `url(${currentCover})` } as CSSProperties} />
            <div className="flex flex-col justify-between p-6">
              <div>
                <div className="font-ui mb-4 flex items-center gap-2 text-sm font-bold uppercase text-moss">
                  <Clock size={16} />
                  {currentRead ? "Continue reading" : "Begin reading"}
                </div>
                <h1 className="break-words text-3xl font-black leading-tight text-ink sm:text-4xl">{currentTitle}</h1>
                <p className="mt-2 text-lg text-ink/68">by {currentAuthor}</p>
                <div className="mt-6">
                  <div className="mb-2 flex justify-between font-ui text-sm font-bold text-ink/62">
                    <span>{currentRead?.currentChapter ? `Chapter ${currentRead.currentChapter}` : "Fresh pick"}</span>
                    <span>{Math.round(currentRead?.progress ?? 0)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-ink/10">
                    <div className="h-3 rounded-full bg-moss" style={{ width: `${Math.round(currentRead?.progress ?? 0)}%` }} />
                  </div>
                </div>
              </div>
              <Link href={currentHref} className="font-ui mt-8 inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 font-bold text-parchment">
                Open
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="glass rounded-lg p-5">
            <div className="font-ui mb-3 flex items-center gap-2 text-sm font-bold uppercase text-rose">
              <WandSparkles size={16} />
              Your reading taste
            </div>
            <h2 className="break-words text-2xl font-black text-ink">{user ? `Welcome back, ${user.displayName}` : "Create an account to save and recommend books."}</h2>
            <p className="mt-3 text-ink/68">BOOKLY now reads and writes real Supabase data for books, stories, posts, saves, and reading progress.</p>
            {!user ? (
              <div className="mt-4 flex gap-2">
                <Link href="/login" className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-2 font-bold text-ink">Login</Link>
                <Link href="/register" className="font-ui rounded-md bg-moss px-4 py-2 font-bold text-white">Sign Up</Link>
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Saved" value={savedCount} />
            <Metric label="Drafts" value={draftCount} />
            <Metric label="Reviews" value={reviewCount} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-ink">Recommended Books</h2>
            <Link href="/discover" className="font-ui text-sm font-bold text-moss">View all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {books.length ? books.map((book: any) => (
              <Link key={book.id} href={`/books/${book.id}`} className="glass block rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-glow">
                <div className="font-ui mb-4 inline-flex items-center gap-2 rounded bg-moss/12 px-2 py-1 text-xs font-bold text-moss">
                  <BookOpen size={14} />
                  {book.aiAnalysis?.genres[0] ?? "Published book"}
                </div>
                <h3 className="text-xl font-black text-ink">{book.title}</h3>
                <p className="mt-1 text-ink/58">{book.authorName}</p>
                <p className="font-ui mt-4 text-sm leading-6 text-ink/68">
                  {book.aiAnalysis?.summary ?? book.description}
                </p>
              </Link>
            )) : (
              <EmptyState title="No books yet" body="Add a book through the API or seed the database to see recommendations here." actionHref="/discover" actionLabel="Refresh discovery" />
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
