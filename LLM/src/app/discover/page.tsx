import Link from "next/link";
import { BookOpen, Filter, Search, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { searchExternalBooks, type BookSource, type UnifiedBook } from "@/lib/books";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DiscoverSource = "all" | BookSource | "app_books";

const sources: { value: DiscoverSource; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "app_books", label: "App Books" },
  { value: "open_library", label: "Open Library" },
  { value: "gutendex", label: "Project Gutenberg" },
  { value: "google_books", label: "Google Books" }
];

export default async function DiscoverPage({
  searchParams
}: {
  searchParams?: { q?: string; source?: string; hasCover?: string; free?: string; genre?: string };
}) {
  const q = searchParams?.q?.trim();
  const source = sources.some((item) => item.value === searchParams?.source) ? (searchParams?.source as DiscoverSource) : "all";
  const hasCover = searchParams?.hasCover === "1";
  const freeToRead = searchParams?.free === "1";
  const genre = searchParams?.genre?.trim();
  let localBooks: any[] = [];
  let appBooks: any[] = [];
  let externalBooks: UnifiedBook[] = [];
  let databaseError = "";

  try {
    const shouldLoadAppBooks = source === "all" || source === "app_books";
    const shouldLoadSavedBooks = source === "all";
    const shouldLoadExternalBooks = source !== "app_books";

    const [savedCatalog, storyCatalog, externalCatalog] = await Promise.all([
      shouldLoadSavedBooks
        ? prisma.book.findMany({
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
          })
        : Promise.resolve([]),
      shouldLoadAppBooks
        ? prisma.story.findMany({
            where: {
              status: "PUBLISHED",
              ...(q
                ? {
                    OR: [
                      { title: { contains: q, mode: "insensitive" } },
                      { description: { contains: q, mode: "insensitive" } },
                      { author: { displayName: { contains: q, mode: "insensitive" } } }
                    ]
                  }
                : {}),
              ...(hasCover ? { coverUrl: { not: null } } : {}),
              ...(genre ? { aiAnalysis: { genres: { has: genre } } } : {})
            },
            include: {
              author: { select: { displayName: true, username: true, accountKind: true } },
              aiAnalysis: true,
              chapters: { select: { id: true }, take: 1 }
            },
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
            take: source === "app_books" ? 36 : 12
          })
        : Promise.resolve([]),
      shouldLoadExternalBooks
        ? searchExternalBooks({
            query: q,
            genre: genre || (q ? undefined : "fantasy"),
            source: source === "all" ? "all" : source,
            hasCover,
            freeToRead,
            maxResults: 36
          })
        : Promise.resolve([])
    ]);

    localBooks = savedCatalog;
    appBooks = storyCatalog;
    externalBooks = externalCatalog.filter(
      (external) => !savedCatalog.some((book) => book.externalSource === external.source && book.externalId === external.external_id)
    );
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
            <input name="q" defaultValue={q} className="font-ui w-full bg-transparent text-sm outline-none" placeholder="Search app books, free books, Google Books, and BOOKLY" />
          </div>
          <select name="source" defaultValue={source} className="font-ui min-h-11 rounded-md border border-ink/10 bg-white/70 px-3 py-2 text-sm font-bold text-ink outline-none">
            {sources.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input name="genre" defaultValue={genre} className="font-ui min-h-11 rounded-md border border-ink/10 bg-white/70 px-3 py-2 text-sm font-bold text-ink outline-none" placeholder="Genre/category" />
          <label className="font-ui flex min-h-11 items-center gap-2 rounded-md bg-white/60 px-3 text-sm font-bold text-ink">
            <input type="checkbox" name="hasCover" value="1" defaultChecked={hasCover} />
            Has cover
          </label>
          <label className="font-ui flex min-h-11 items-center gap-2 rounded-md bg-white/60 px-3 text-sm font-bold text-ink">
            <input type="checkbox" name="free" value="1" defaultChecked={freeToRead} />
            Free to read
          </label>
          <button className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment" title="Search">
            <Filter size={18} />
          </button>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {databaseError ? (
            <div className="md:col-span-3">
              <EmptyState title="Discovery is partially available" body={`${databaseError} Google Books results may still appear if the external API is reachable.`} />
            </div>
          ) : null}
          {!databaseError && !localBooks.length && !appBooks.length && !externalBooks.length ? (
            <div className="md:col-span-3">
              <EmptyState title="No books found" body="Try another search. BOOKLY searches app books, Open Library, Project Gutenberg, Google Books, and your saved Supabase catalog." />
            </div>
          ) : null}
          {appBooks.map((story: any) => (
            <Link key={story.id} href={`/stories/${story.id}`} className="glass block rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-gold/20 px-2 py-1 text-xs font-bold text-ink">
                <BookOpen size={14} />
                App Book
              </div>
              {story.coverUrl ? <img src={story.coverUrl} alt="" className="mb-4 h-44 w-32 rounded-md object-cover" /> : null}
              <h2 className="text-xl font-black text-ink">{story.title}</h2>
              <p className="mt-1 text-ink/58">by {story.author.displayName}</p>
              <p className="font-ui mt-4 line-clamp-4 text-sm leading-6 text-ink/68">
                {story.aiAnalysis?.summary ?? story.description}
              </p>
              <span className="font-ui mt-4 inline-flex items-center gap-2 rounded-md bg-gold px-3 py-2 text-xs font-black uppercase text-midnight">
                <BookOpen size={14} />
                Read in app
              </span>
              <p className="font-ui mt-4 text-xs font-bold uppercase text-moss">
                {story.aiAnalysis?.genres?.join(" / ") || "BOOKLY story"}
              </p>
            </Link>
          ))}
          {localBooks.map((book: any) => (
            <Link key={book.id} href={`/books/${book.id}`} className="glass block rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-moss/12 px-2 py-1 text-xs font-bold text-moss">
                <WandSparkles size={14} />
                Saved in BOOKLY
              </div>
              {book.coverUrl ? <img src={book.coverUrl} alt="" className="mb-4 h-44 w-32 rounded-md object-cover" /> : null}
              <h2 className="text-xl font-black text-ink">{book.title}</h2>
              <p className="mt-1 text-ink/58">by {book.authorName}</p>
              <p className="font-ui mt-4 line-clamp-4 text-sm leading-6 text-ink/68">
                {book.aiAnalysis?.summary ?? book.description}
              </p>
              <p className="font-ui mt-4 text-xs font-bold uppercase text-moss">
                {book.aiAnalysis?.genres.join(" / ") || "Book"}
              </p>
            </Link>
          ))}
          {externalBooks.map((book) => (
            <Link key={book.id} href={`/books/external/${book.source}/${encodeURIComponent(book.external_id)}`} className="glass block rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-rose/12 px-2 py-1 text-xs font-bold text-rose">
                <WandSparkles size={14} />
                {book.source === "gutendex" ? "Project Gutenberg" : book.source === "open_library" ? "Open Library" : "Google Books"}
              </div>
              {book.cover_url ? <img src={book.cover_url} alt="" className="mb-4 h-44 w-32 rounded-md object-cover" /> : null}
              <h2 className="text-xl font-black text-ink">{book.title}</h2>
              <p className="mt-1 text-ink/58">by {book.authors.join(", ")}</p>
              <p className="font-ui mt-4 line-clamp-4 text-sm leading-6 text-ink/68">{book.description}</p>
              {book.readable_url ? (
                <span className="font-ui mt-4 inline-flex items-center gap-2 rounded-md bg-gold px-3 py-2 text-xs font-black uppercase text-midnight">
                  <BookOpen size={14} />
                  Free to read
                </span>
              ) : null}
              <p className="font-ui mt-4 text-xs font-bold uppercase text-moss">
                {(book.categories.length ? book.categories : book.subjects).slice(0, 3).join(" / ") || "External book"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
