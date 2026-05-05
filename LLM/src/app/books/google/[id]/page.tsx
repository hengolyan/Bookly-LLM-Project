import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Star, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PostComposer } from "@/components/PostComposer";
import { SaveBookButton } from "@/components/SaveBookButton";
import { getCurrentUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { getGoogleBook } from "@/lib/google-books";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackCover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80";

export default async function GoogleBookDetailsPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const book = await getGoogleBook(params.id);
  if (!book) notFound();

  let saved = false;
  let posts: any[] = [];
  let allBooks: { id: string; title: string; authorName: string }[] = [];
  let databaseError = "";

  try {
    const localBook = await prisma.book.findFirst({
      where: { externalSource: "google_books", externalId: book.externalId },
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
    logServerError("googleBookDetails.localData", error);
    databaseError = databaseUnavailableMessage();
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="glass h-fit rounded-lg p-5">
          <img src={book.coverUrl ?? fallbackCover} alt="" className="aspect-[0.72] w-full rounded-md object-cover" />
          <div className="mt-4 flex flex-wrap gap-2">
            <SaveBookButton externalBook={book} initialSaved={saved} />
            <Link href={`/posts/create?googleBookId=${book.externalId}&kind=RECOMMENDATION`} className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink">
              Recommend
            </Link>
            <Link href={`/posts/create?googleBookId=${book.externalId}&kind=REVIEW`} className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink">
              Write Review
            </Link>
          </div>
        </aside>

        <div className="grid gap-5">
          {databaseError ? <EmptyState title="User actions may be unavailable" body={databaseError} /> : null}
          <article className="glass rounded-lg p-6">
            <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-gold/20 px-2 py-1 text-xs font-bold uppercase text-ink">
              Google Books
            </div>
            <h1 className="text-4xl font-black leading-tight text-ink">{book.title}</h1>
            <p className="mt-2 text-xl text-ink/64">by {book.authorName}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-gold">
              <span className="font-ui flex items-center gap-1 font-bold">
                <Star size={18} fill="currentColor" />
                {book.averageRating ? book.averageRating.toFixed(1) : "No rating yet"}
              </span>
              {book.publishedYear ? <span className="font-ui text-sm font-bold text-ink/54">{book.publishedYear}</span> : null}
            </div>
            <p className="mt-5 text-lg leading-8 text-ink/74">{book.description}</p>
            <div className="mt-5 rounded-md bg-white/45 p-4">
              <div className="font-ui mb-2 flex items-center gap-2 text-sm font-bold uppercase text-moss">
                <WandSparkles size={16} />
                Discovery metadata
              </div>
              <p className="font-ui text-sm font-bold text-ink/54">
                {(book.genres.length ? book.genres : ["Book"]).join(" / ")}
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
