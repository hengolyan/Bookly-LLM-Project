import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ExternalLink, MessageCircle, Star, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PostComposer } from "@/components/PostComposer";
import { SaveBookButton } from "@/components/SaveBookButton";
import { getCurrentUser } from "@/lib/auth";
import { getExternalBook, type BookSource } from "@/lib/books";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackCover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80";
const sourceLabels: Record<BookSource, string> = {
  open_library: "Open Library",
  gutendex: "Project Gutenberg",
  google_books: "Google Books"
};

function isBookSource(source: string): source is BookSource {
  return source === "open_library" || source === "gutendex" || source === "google_books";
}

export default async function ExternalBookDetailsPage({ params }: { params: { source: string; id: string } }) {
  if (!isBookSource(params.source)) notFound();

  const user = await getCurrentUser();
  const book = await getExternalBook(params.source, decodeURIComponent(params.id));
  if (!book) notFound();

  let saved = false;
  let posts: any[] = [];
  let allBooks: { id: string; title: string; authorName: string }[] = [];
  let databaseError = "";

  try {
    const localBook = await prisma.book.findFirst({
      where: { externalSource: book.source, externalId: book.external_id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { displayName: true, username: true } },
            likes: { select: { id: true } },
            comments: { select: { id: true } }
          }
        }
      }
    });

    if (localBook) {
      posts = localBook.posts;
      saved = user
        ? Boolean(await prisma.savedItem.findFirst({ where: { userId: user.id, bookId: localBook.id }, select: { id: true } }))
        : false;
    }

    allBooks = await prisma.book.findMany({ select: { id: true, title: true, authorName: true }, orderBy: { title: "asc" } });
  } catch (error) {
    logServerError("externalBookDetails.localData", error);
    databaseError = databaseUnavailableMessage();
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="glass h-fit rounded-lg p-5">
          <img src={book.cover_url ?? fallbackCover} alt="" className="aspect-[0.72] w-full rounded-md object-cover" />
          <div className="mt-4 flex flex-wrap gap-2">
            {book.readable_url ? (
              <a href={book.readable_url} target="_blank" rel="noreferrer" className="font-ui inline-flex items-center gap-2 rounded-md bg-gold px-4 py-3 font-bold text-midnight">
                <BookOpen size={18} />
                Read Book
                <ExternalLink size={16} />
              </a>
            ) : null}
            <SaveBookButton externalBook={book} initialSaved={saved} />
            <Link href={`/posts/create?source=${book.source}&externalId=${encodeURIComponent(book.external_id)}&kind=RECOMMENDATION`} className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink">
              Recommend
            </Link>
            <Link href={`/posts/create?source=${book.source}&externalId=${encodeURIComponent(book.external_id)}&kind=REVIEW`} className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink">
              Write Review
            </Link>
          </div>
        </aside>

        <div className="grid gap-5">
          {databaseError ? <EmptyState title="User actions may be unavailable" body={databaseError} /> : null}
          <article className="glass rounded-lg p-6">
            <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-gold/20 px-2 py-1 text-xs font-bold uppercase text-ink">
              {sourceLabels[book.source]}
            </div>
            <h1 className="text-4xl font-black leading-tight text-ink">{book.title}</h1>
            <p className="mt-2 text-xl text-ink/64">by {book.authors.join(", ")}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-gold">
              <span className="font-ui flex items-center gap-1 font-bold">
                <Star size={18} fill="currentColor" />
                {book.rating ? book.rating.toFixed(1) : "No rating yet"}
              </span>
              {book.published_year ? <span className="font-ui text-sm font-bold text-ink/54">{book.published_year}</span> : null}
              {book.readable_url ? <span className="font-ui text-sm font-bold text-moss">Free to read</span> : null}
            </div>
            <p className="mt-5 text-lg leading-8 text-ink/74">{book.description}</p>
            <div className="mt-5 rounded-md bg-white/45 p-4">
              <div className="font-ui mb-2 flex items-center gap-2 text-sm font-bold uppercase text-moss">
                <WandSparkles size={16} />
                Discovery metadata
              </div>
              <p className="font-ui text-sm font-bold text-ink/54">
                {(book.categories.length ? book.categories : book.subjects).slice(0, 8).join(" / ") || "Book"}
              </p>
            </div>
          </article>

          <article className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-rose" />
              <h2 className="text-2xl font-black text-ink">BOOKLY Reviews And Recommendations</h2>
            </div>
            <div className="grid gap-3">
              {posts.length ? (
                posts.map((post: any) => (
                  <Link key={post.id} href="/feed" className="rounded-md border border-ink/10 bg-white/45 p-4">
                    <p className="font-ui text-xs font-bold uppercase text-moss">{post.kind.replace("_", " ")}</p>
                    <h3 className="mt-1 text-xl font-black text-ink">{post.title}</h3>
                    <p className="text-ink/60">by {post.author.displayName}</p>
                    <p className="mt-2 text-ink/70">{post.body}</p>
                  </Link>
                ))
              ) : (
                <p className="text-ink/62">No BOOKLY reviews yet. Save or review this book to add it to Supabase.</p>
              )}
            </div>
          </article>

          {user ? (
            <article>
              <h2 className="mb-3 text-2xl font-black text-ink">Create A Post About This Book</h2>
              <PostComposer books={allBooks} externalBook={book} />
            </article>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
