import Link from "next/link";
import { Filter, Search, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q?.trim();
  let books: any[] = [];
  let databaseError = "";

  try {
    books = await prisma.book.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { authorName: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } }
            ]
          }
        : undefined,
      include: { aiAnalysis: true, posts: { take: 2 } },
      orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
      take: 12
    });
  } catch (error) {
    logServerError("discover", error);
    databaseError = databaseUnavailableMessage();
  }

  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-black text-ink">Discover</h1>
        <form className="glass mt-4 flex flex-wrap items-center gap-3 rounded-lg p-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md bg-white/65 px-3 py-3">
            <Search size={18} />
            <input name="q" defaultValue={q} className="font-ui w-full bg-transparent text-sm outline-none" placeholder="Search stories, books, authors, publishers" />
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment" title="Search">
            <Filter size={18} />
          </button>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {databaseError ? (
            <div className="md:col-span-3">
              <EmptyState title="Discovery is temporarily unavailable" body={databaseError} />
            </div>
          ) : null}
          {!databaseError && !books.length ? (
            <div className="md:col-span-3">
              <EmptyState title="No books found" body="Try another search, or seed/add books in the database." />
            </div>
          ) : null}
          {books.map((book: any) => (
            <Link key={book.id} href={`/books/${book.id}`} className="glass block rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-rose/12 px-2 py-1 text-xs font-bold text-rose">
                <WandSparkles size={14} />
                AI explanation
              </div>
              <h2 className="text-xl font-black text-ink">{book.title}</h2>
              <p className="mt-1 text-ink/58">by {book.authorName}</p>
              <p className="font-ui mt-4 text-sm leading-6 text-ink/68">
                {book.aiAnalysis?.summary ?? book.description}
              </p>
              <p className="font-ui mt-4 text-xs font-bold uppercase text-moss">
                {book.aiAnalysis?.genres.join(" • ") || "Book"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
