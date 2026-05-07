import { logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type BookSource = "open_library" | "gutendex" | "google_books";

export type UnifiedBook = {
  id: string;
  external_id: string;
  source: BookSource;
  title: string;
  authors: string[];
  cover_url?: string;
  description: string;
  categories: string[];
  subjects: string[];
  rating: number;
  readable_url?: string;
  isbn?: string;
  published_year?: number;
  externalSource: BookSource;
  externalId: string;
  authorName: string;
  coverUrl?: string;
  averageRating: number;
  genres: string[];
  readableUrl?: string;
};

export type BookSearchFilters = {
  query?: string;
  genre?: string;
  source?: BookSource | "all";
  hasCover?: boolean;
  freeToRead?: boolean;
  maxResults?: number;
};

export type ExternalBookInput = Pick<UnifiedBook, "external_id" | "source" | "title" | "description"> &
  Partial<Omit<UnifiedBook, "externalSource">> & {
    externalSource?: string;
  };

type GoogleVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    averageRating?: number;
    publishedDate?: string;
    previewLink?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: Record<string, string | undefined>;
  };
  accessInfo?: {
    publicDomain?: boolean;
    webReaderLink?: string;
  };
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_sentence?: string | string[];
  subject?: string[];
  ia?: string[];
  has_fulltext?: boolean;
  first_publish_year?: number;
  isbn?: string[];
};

type OpenLibraryWork = {
  key?: string;
  title?: string;
  description?: string | { value?: string };
  subjects?: string[];
  covers?: number[];
};

type GutendexBook = {
  id?: number;
  title?: string;
  authors?: { name?: string }[];
  summaries?: string[];
  subjects?: string[];
  bookshelves?: string[];
  formats?: Record<string, string | undefined>;
  download_count?: number;
};

const fallbackDescription = "No description is available from this book source yet.";

function stripHtml(value?: string) {
  return value?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
}

function httpsUrl(url?: string) {
  return url?.replace("http://", "https://");
}

function cleanList(values?: (string | undefined)[], limit = 8) {
  return Array.from(new Set((values ?? []).map((item) => item?.trim()).filter(Boolean) as string[])).slice(0, limit);
}

function toBook(input: Omit<UnifiedBook, "id" | "externalSource" | "externalId" | "authorName" | "coverUrl" | "averageRating" | "genres" | "readableUrl">): UnifiedBook {
  const authors = input.authors.length ? input.authors : ["Unknown author"];
  const categories = cleanList(input.categories);
  const subjects = cleanList(input.subjects);

  return {
    ...input,
    id: `${input.source}:${input.external_id}`,
    authors,
    categories,
    subjects,
    rating: input.rating || 0,
    externalSource: input.source,
    externalId: input.external_id,
    authorName: authors.join(", "),
    coverUrl: input.cover_url,
    averageRating: input.rating || 0,
    genres: categories.length ? categories : subjects.slice(0, 5),
    readableUrl: input.readable_url
  };
}

export function completeUnifiedBook(book: ExternalBookInput): UnifiedBook {
  return toBook({
    external_id: book.external_id,
    source: book.source,
    title: book.title,
    authors: book.authors ?? (book.authorName ? [book.authorName] : []),
    cover_url: book.cover_url ?? book.coverUrl,
    description: book.description,
    categories: book.categories ?? book.genres ?? [],
    subjects: book.subjects ?? [],
    rating: book.rating ?? book.averageRating ?? 0,
    readable_url: book.readable_url ?? book.readableUrl,
    isbn: book.isbn,
    published_year: book.published_year
  });
}

function googleBooksUrl(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://www.googleapis.com/books/v1/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  if (process.env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  return url;
}

export function normalizeGoogleBook(volume: GoogleVolume): UnifiedBook | null {
  if (!volume.id || !volume.volumeInfo?.title) return null;
  const info = volume.volumeInfo;
  const title = info.title;
  if (!title) return null;
  const isbn =
    info.industryIdentifiers?.find((item) => item.type === "ISBN_13")?.identifier ??
    info.industryIdentifiers?.find((item) => item.type === "ISBN_10")?.identifier;
  const year = info.publishedDate?.match(/^\d{4}/)?.[0];
  const readableUrl = volume.accessInfo?.publicDomain ? volume.accessInfo.webReaderLink ?? info.previewLink : undefined;

  return toBook({
    external_id: volume.id,
    source: "google_books",
    title,
    authors: cleanList(info.authors, 4),
    description: stripHtml(info.description) || fallbackDescription,
    cover_url: httpsUrl(
      info.imageLinks?.thumbnail ??
        info.imageLinks?.smallThumbnail ??
        info.imageLinks?.small ??
        info.imageLinks?.medium ??
        info.imageLinks?.large ??
        info.imageLinks?.extraLarge
    ),
    categories: cleanList(info.categories, 5),
    subjects: cleanList(info.categories, 8),
    rating: info.averageRating ?? 0,
    readable_url: readableUrl,
    isbn,
    published_year: year ? Number(year) : undefined
  });
}

export function normalizeOpenLibraryBook(doc: OpenLibraryDoc): UnifiedBook | null {
  if (!doc.key || !doc.title) return null;
  const externalId = doc.key.replace("/works/", "");
  const firstSentence = Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence;
  const readableId = doc.has_fulltext ? doc.ia?.[0] : undefined;

  return toBook({
    external_id: externalId,
    source: "open_library",
    title: doc.title,
    authors: cleanList(doc.author_name, 4),
    description: firstSentence || (doc.subject?.length ? `Subjects include ${doc.subject.slice(0, 5).join(", ")}.` : fallbackDescription),
    cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
    categories: cleanList(doc.subject, 5),
    subjects: cleanList(doc.subject, 12),
    rating: 0,
    readable_url: readableId ? `https://archive.org/details/${encodeURIComponent(readableId)}` : undefined,
    isbn: doc.isbn?.[0],
    published_year: doc.first_publish_year
  });
}

export function normalizeOpenLibraryWork(work: OpenLibraryWork): UnifiedBook | null {
  if (!work.key || !work.title) return null;
  const description = typeof work.description === "string" ? work.description : work.description?.value;

  return toBook({
    external_id: work.key.replace("/works/", ""),
    source: "open_library",
    title: work.title,
    authors: ["Open Library"],
    description: stripHtml(description) || fallbackDescription,
    cover_url: work.covers?.[0] ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg` : undefined,
    categories: cleanList(work.subjects, 5),
    subjects: cleanList(work.subjects, 12),
    rating: 0
  });
}

export function normalizeGutendexBook(book: GutendexBook): UnifiedBook | null {
  if (!book.id || !book.title) return null;
  const readableUrl =
    book.formats?.["text/html"] ??
    book.formats?.["text/html; charset=utf-8"] ??
    book.formats?.["text/plain; charset=utf-8"] ??
    book.formats?.["text/plain"];

  return toBook({
    external_id: String(book.id),
    source: "gutendex",
    title: book.title,
    authors: cleanList(book.authors?.map((author) => author.name), 4),
    description: book.summaries?.[0] || (book.subjects?.length ? `Subjects include ${book.subjects.slice(0, 5).join(", ")}.` : fallbackDescription),
    cover_url: httpsUrl(book.formats?.["image/jpeg"]),
    categories: cleanList([...(book.bookshelves ?? []), ...(book.subjects ?? [])], 5),
    subjects: cleanList(book.subjects, 12),
    rating: book.download_count ? Math.min(5, Math.max(3.7, Math.log10(book.download_count) + 1.1)) : 0,
    readable_url: readableUrl ? httpsUrl(readableUrl) : undefined
  });
}

async function searchGoogleBooks(filters: BookSearchFilters) {
  const q = filters.query?.trim() || (filters.genre ? `subject:${filters.genre}` : "subject:fiction");
  const response = await fetch(
    googleBooksUrl("volumes", {
      q,
      maxResults: Math.min(Math.max(filters.maxResults ?? 8, 1), 40),
      printType: "books",
      orderBy: filters.query ? "relevance" : "newest"
    }),
    { next: { revalidate: 60 * 60 } }
  );
  if (!response.ok) throw new Error(`Google Books search failed with ${response.status}`);
  const data = (await response.json()) as { items?: GoogleVolume[] };
  return (data.items ?? []).map(normalizeGoogleBook).filter(Boolean) as UnifiedBook[];
}

async function searchOpenLibrary(filters: BookSearchFilters) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("limit", String(Math.min(filters.maxResults ?? 12, 50)));
  if (filters.query?.trim()) url.searchParams.set("q", filters.query.trim());
  else url.searchParams.set("subject", filters.genre || "fiction");
  const response = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!response.ok) throw new Error(`Open Library search failed with ${response.status}`);
  const data = (await response.json()) as { docs?: OpenLibraryDoc[] };
  return (data.docs ?? []).map(normalizeOpenLibraryBook).filter(Boolean) as UnifiedBook[];
}

async function searchGutendex(filters: BookSearchFilters) {
  const url = new URL("https://gutendex.com/books/");
  if (filters.query?.trim()) url.searchParams.set("search", filters.query.trim());
  else if (filters.genre) url.searchParams.set("topic", filters.genre);
  const response = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!response.ok) throw new Error(`Gutendex search failed with ${response.status}`);
  const data = (await response.json()) as { results?: GutendexBook[] };
  return (data.results ?? []).slice(0, filters.maxResults ?? 12).map(normalizeGutendexBook).filter(Boolean) as UnifiedBook[];
}

export async function getExternalBook(source: BookSource, externalId: string) {
  try {
    if (source === "google_books") {
      const response = await fetch(googleBooksUrl(`volumes/${encodeURIComponent(externalId)}`, {}), { next: { revalidate: 60 * 60 } });
      if (!response.ok) throw new Error(`Google Books detail failed with ${response.status}`);
      return normalizeGoogleBook((await response.json()) as GoogleVolume);
    }

    if (source === "open_library") {
      const response = await fetch(`https://openlibrary.org/works/${encodeURIComponent(externalId)}.json`, { next: { revalidate: 60 * 60 } });
      if (!response.ok) throw new Error(`Open Library detail failed with ${response.status}`);
      return normalizeOpenLibraryWork((await response.json()) as OpenLibraryWork);
    }

    const response = await fetch(`https://gutendex.com/books/${encodeURIComponent(externalId)}`, { next: { revalidate: 60 * 60 } });
    if (!response.ok) throw new Error(`Gutendex detail failed with ${response.status}`);
    return normalizeGutendexBook((await response.json()) as GutendexBook);
  } catch (error) {
    logServerError(`books.detail.${source}`, error);
    return null;
  }
}

function duplicateKey(book: UnifiedBook) {
  const title = book.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const author = book.authors[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  return `${title}:${author}`;
}

function dedupeBooks(books: UnifiedBook[]) {
  const ranked = [...books].sort((a, b) => Number(Boolean(b.readable_url)) - Number(Boolean(a.readable_url)) || Number(Boolean(b.cover_url)) - Number(Boolean(a.cover_url)));
  const seen = new Set<string>();
  return ranked.filter((book) => {
    const key = duplicateKey(book);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchExternalBooks(filters: BookSearchFilters = {}) {
  const source = filters.source ?? "all";
  const requested: BookSource[] = source === "all" ? ["open_library", "gutendex", "google_books"] : [source];
  const searches = requested.map(async (item) => {
    try {
      if (item === "open_library") return await searchOpenLibrary(filters);
      if (item === "gutendex") return await searchGutendex(filters);
      return await searchGoogleBooks(filters);
    } catch (error) {
      logServerError(`books.search.${item}`, error);
      return [];
    }
  });

  const results = dedupeBooks((await Promise.all(searches)).flat()).filter((book) => {
    if (filters.hasCover && !book.cover_url) return false;
    if (filters.freeToRead && !book.readable_url) return false;
    if (filters.genre) {
      const haystack = [...book.categories, ...book.subjects].join(" ").toLowerCase();
      if (!haystack.includes(filters.genre.toLowerCase())) return false;
    }
    return true;
  });

  return results.slice(0, filters.maxResults ?? 36);
}

export async function upsertExternalBook(book: ExternalBookInput) {
  const unifiedBook = completeUnifiedBook(book);
  const existing = await prisma.book.findFirst({
    where: { externalSource: unifiedBook.source, externalId: unifiedBook.external_id },
    include: { aiAnalysis: true }
  });
  if (existing) return existing;

  const genres = unifiedBook.categories.length ? unifiedBook.categories : unifiedBook.subjects.slice(0, 5);
  return prisma.book.create({
    data: {
      title: unifiedBook.title,
      authorName: unifiedBook.authors.join(", ") || "Unknown author",
      description: unifiedBook.description,
      coverUrl: unifiedBook.cover_url,
      isbn: unifiedBook.isbn,
      externalSource: unifiedBook.source,
      externalId: unifiedBook.external_id,
      publishedYear: unifiedBook.published_year,
      averageRating: unifiedBook.rating,
      aiAnalysis: {
        create: {
          contentType: "BOOK",
          summary: unifiedBook.description.slice(0, 260),
          genres: genres.length ? genres : ["book"],
          themes: unifiedBook.subjects.length ? unifiedBook.subjects.slice(0, 5) : genres.slice(0, 3),
          audience: "general readers",
          mood: unifiedBook.readable_url ? "free to read" : "discoverable",
          moderationFlags: [],
          embeddingText: `${unifiedBook.title}\n${unifiedBook.authors.join(", ")}\n${unifiedBook.description}\n${unifiedBook.categories.join(", ")}\n${unifiedBook.subjects.join(", ")}`
        }
      }
    },
    include: { aiAnalysis: true }
  });
}
