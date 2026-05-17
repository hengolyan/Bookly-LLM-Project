import Link from "next/link";
import { redirect } from "next/navigation";
import { BookMarked, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { logServerError, withTimeout } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackCover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let savedItems: any[] = [];
  let reading: any[] = [];
  let libraryLoaded = true;

  try {
    [savedItems, reading] = await withTimeout(
      Promise.all([
        prisma.savedItem.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          include: {
            book: { include: { aiAnalysis: true } },
            story: { include: { author: { select: { displayName: true } } } }
          }
        }),
        prisma.readingProgress.findMany({
          where: { userId: user.id },
          orderBy: { lastOpenedAt: "desc" },
          include: { book: true, story: { include: { author: { select: { displayName: true } } } } }
        })
      ]),
      4000,
      "Library database queries"
    );
  } catch (error) {
    logServerError("library", error);
    libraryLoaded = false;
  }

  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-black text-ink">My Library</h1>
        <p className="mt-1 text-ink/64">Saved books, saved stories, and current reading progress.</p>

        <h2 className="mt-6 text-2xl font-black text-ink">Saved Items</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {!savedItems.length ? (
            <div className="lg:col-span-3">
              <EmptyState
                title={libraryLoaded ? "No saved items yet" : "Saved items are not loading right now"}
                body={libraryLoaded ? "Open a book details page and press Save Book." : "You can still browse books and come back here after the connection is available."}
                actionHref="/discover"
                actionLabel="Find Books"
              />
            </div>
          ) : null}
          {savedItems.map((item: any) => {
            const title = item.book?.title ?? item.story?.title ?? "Saved item";
            const author = item.book?.authorName ?? item.story?.author.displayName ?? "BOOKLY";
            const href = item.bookId ? `/books/${item.bookId}` : `/stories/${item.storyId}`;
            const cover = item.book?.coverUrl ?? item.story?.coverUrl ?? fallbackCover;
            return (
              <Link key={item.id} href={href} className="glass block rounded-lg p-4">
                <div className="flex gap-4">
                  <img src={cover} alt="" className="h-32 w-24 rounded-md object-cover" />
                  <div>
                    <BookMarked className="mb-2 text-moss" size={20} />
                    <h3 className="text-xl font-black text-ink">{title}</h3>
                    <p className="text-ink/58">{author}</p>
                    <div className="mt-3 flex items-center gap-1 text-gold">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-8 text-2xl font-black text-ink">Continue Reading</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {!reading.length ? (
            <EmptyState
              title={libraryLoaded ? "No reading progress yet" : "Reading progress is not loading right now"}
              body={libraryLoaded ? "Open a story or book to begin tracking progress." : "The page is still usable, but your saved progress could not be loaded this time."}
              actionHref="/discover"
              actionLabel="Discover"
            />
          ) : null}
          {reading.map((item: any) => (
            <Link key={item.id} href={item.storyId ? `/stories/${item.storyId}` : `/books/${item.bookId}`} className="glass block rounded-lg p-5">
              <h3 className="text-xl font-black text-ink">{item.story?.title ?? item.book?.title}</h3>
              <p className="font-ui mt-2 text-sm font-bold text-ink/60">{Math.round(item.progress)}% complete</p>
              <div className="mt-3 h-3 rounded-full bg-ink/10">
                <div className="h-3 rounded-full bg-moss" style={{ width: `${Math.round(item.progress)}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
