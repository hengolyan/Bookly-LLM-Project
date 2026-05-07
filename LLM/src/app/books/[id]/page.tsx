import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ExternalLink, MessageCircle, PenLine, Star, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { SaveBookButton } from "@/components/SaveBookButton";
import { PostComposer } from "@/components/PostComposer";
import { getCurrentUser } from "@/lib/auth";
import { getExternalBook, type BookSource, type UnifiedBook } from "@/lib/books";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackCover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80";

function isBookSource(source?: string | null): source is BookSource {
  return source === "open_library" || source === "gutendex" || source === "google_books";
}

export default async function BookDetailsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  let book: any = null;
  let externalBook: UnifiedBook | null = null;
  let saved = false;
  let relatedStories: any[] = [];
  let allBooks: { id: string; title: string; authorName: string }[] = [];
  let databaseError = "";

  try {
    book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        aiAnalysis: true,
        tags: { include: { tag: true } },
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { displayName: true, username: true, accountKind: true } },
            likes: { select: { id: true } },
            comments: { select: { id: true } }
          }
        }
      }
    });

    if (!book) notFound();
    externalBook =
      isBookSource(book.externalSource) && book.externalId ? await getExternalBook(book.externalSource, book.externalId) : null;

    saved = user
      ? Boolean(await prisma.savedItem.findFirst({ where: { userId: user.id, bookId: book.id }, select: { id: true } }))
      : false;

    relatedStories = await prisma.story.findMany({
      where: book.aiAnalysis?.genres.length
        ? {
            status: "PUBLISHED",
            aiAnalysis: { genres: { hasSome: book.aiAnalysis.genres } }
          }
        : { status: "PUBLISHED" },
      include: { author: { select: { displayName: true, username: true } }, aiAnalysis: true },
      take: 3
    });

    allBooks = await prisma.book.findMany({ select: { id: true, title: true, authorName: true }, orderBy: { title: "asc" } });
  } catch (error) {
    logServerError("bookDetails", error);
    databaseError = databaseUnavailableMessage();
  }

  if (databaseError || !book) {
    return (
      <AppShell>
        <EmptyState title="Book details are temporarily unavailable" body={databaseError || "This book could not be found."} actionHref="/discover" actionLabel="Back To Discover" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="glass h-fit rounded-lg p-5">
          <img src={book.coverUrl ?? fallbackCover} alt="" className="aspect-[0.72] w-full rounded-md object-cover" />
          <div className="mt-4 flex flex-wrap gap-2">
            {externalBook?.readable_url ? (
              <a href={externalBook.readable_url} target="_blank" rel="noreferrer" className="font-ui inline-flex items-center gap-2 rounded-md bg-gold px-4 py-3 font-bold text-midnight">
                <BookOpen size={18} />
                Read Book
                <ExternalLink size={16} />
              </a>
            ) : null}
            <SaveBookButton bookId={book.id} initialSaved={saved} />
            <Link href={`/posts/create?bookId=${book.id}&kind=RECOMMENDATION`} className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink">
              Recommend
            </Link>
            <Link href={`/posts/create?bookId=${book.id}&kind=REVIEW`} className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink">
              Write Review
            </Link>
          </div>
        </aside>

        <div className="grid gap-5">
          <article className="glass rounded-lg p-6">
            <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-gold/20 px-2 py-1 text-xs font-bold uppercase text-ink">
              {book.aiAnalysis?.genres[0] ?? "Published book"}
            </div>
            <h1 className="text-4xl font-black leading-tight text-ink">{book.title}</h1>
            <p className="mt-2 text-xl text-ink/64">by {book.authorName}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-gold">
              <span className="font-ui flex items-center gap-1 font-bold">
                <Star size={18} fill="currentColor" />
                {book.averageRating.toFixed(1)}
              </span>
              <span className="font-ui text-sm font-bold text-ink/54">{book.posts.filter((post: any) => post.kind === "REVIEW").length} reviews</span>
              {book.publishedYear ? <span className="font-ui text-sm font-bold text-ink/54">{book.publishedYear}</span> : null}
            </div>
            <p className="mt-5 text-lg leading-8 text-ink/74">{book.description}</p>
            {book.aiAnalysis ? (
              <div className="mt-5 rounded-md bg-white/45 p-4">
                <div className="font-ui mb-2 flex items-center gap-2 text-sm font-bold uppercase text-moss">
                  <WandSparkles size={16} />
                  AI explanation
                </div>
                <p className="text-ink/70">{book.aiAnalysis.summary}</p>
                <p className="font-ui mt-3 text-sm font-bold text-ink/54">
                  {book.aiAnalysis.genres.join(" • ")} · {book.aiAnalysis.mood}
                </p>
              </div>
            ) : null}
          </article>

          <article className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-rose" />
              <h2 className="text-2xl font-black text-ink">Reviews And Recommendations</h2>
            </div>
            <div className="grid gap-3">
              {book.posts.length ? (
                book.posts.map((post: any) => (
                  <Link key={post.id} href="/feed" className="rounded-md border border-ink/10 bg-white/45 p-4">
                    <p className="font-ui text-xs font-bold uppercase text-moss">{post.kind.replace("_", " ")}</p>
                    <h3 className="mt-1 text-xl font-black text-ink">{post.title}</h3>
                    <p className="text-ink/60">by {post.author.displayName}</p>
                    <p className="mt-2 text-ink/70">{post.body}</p>
                  </Link>
                ))
              ) : (
                <p className="text-ink/62">No reviews yet. Be the first to recommend this book.</p>
              )}
            </div>
          </article>

          <article className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2">
              <PenLine size={18} className="text-moss" />
              <h2 className="text-2xl font-black text-ink">Related Stories</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {relatedStories.map((story: any) => (
                <Link key={story.id} href={`/stories/${story.id}`} className="rounded-md border border-ink/10 bg-white/45 p-4">
                  <h3 className="text-lg font-black text-ink">{story.title}</h3>
                  <p className="text-sm text-ink/60">by {story.author.displayName}</p>
                  <p className="font-ui mt-3 text-xs font-bold text-moss">{story.aiAnalysis?.genres.join(" • ")}</p>
                </Link>
              ))}
            </div>
          </article>

          {user ? (
            <article>
              <h2 className="mb-3 text-2xl font-black text-ink">Create A Post About This Book</h2>
              <PostComposer books={allBooks} defaultBookId={book.id} />
            </article>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
