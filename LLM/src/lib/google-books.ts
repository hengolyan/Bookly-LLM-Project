import { logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type NormalizedGoogleBook = {
  externalSource: "google_books";
  externalId: string;
  title: string;
  authorName: string;
  description: string;
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
  averageRating: number;
  genres: string[];
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
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
  };
};

const fallbackDescription = "No description is available from Google Books yet.";

function normalizeCover(url?: string) {
  if (!url) return undefined;
  return url.replace("http://", "https://");
}

export function normalizeGoogleBook(volume: GoogleVolume): NormalizedGoogleBook | null {
  if (!volume.id || !volume.volumeInfo?.title) return null;

  const info = volume.volumeInfo;
  const title = info.title;
  if (!title) return null;
  const isbn =
    info.industryIdentifiers?.find((item) => item.type === "ISBN_13")?.identifier ??
    info.industryIdentifiers?.find((item) => item.type === "ISBN_10")?.identifier;
  const year = info.publishedDate?.match(/^\d{4}/)?.[0];

  return {
    externalSource: "google_books",
    externalId: volume.id,
    title,
    authorName: info.authors?.filter(Boolean).join(", ") || "Unknown author",
    description: info.description?.replace(/<[^>]*>/g, "").trim() || fallbackDescription,
    coverUrl: normalizeCover(
      info.imageLinks?.thumbnail ??
        info.imageLinks?.smallThumbnail ??
        info.imageLinks?.small ??
        info.imageLinks?.medium ??
        info.imageLinks?.large ??
        info.imageLinks?.extraLarge
    ),
    isbn,
    publishedYear: year ? Number(year) : undefined,
    averageRating: info.averageRating ?? 0,
    genres: info.categories?.filter(Boolean).slice(0, 5) ?? []
  };
}

function googleBooksUrl(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://www.googleapis.com/books/v1/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }
  return url;
}

export async function searchGoogleBooks({ query, genre, maxResults = 12 }: { query?: string; genre?: string; maxResults?: number }) {
  const q = query?.trim() || (genre ? `subject:${genre}` : "subject:fiction");
  try {
    const response = await fetch(
      googleBooksUrl("volumes", {
        q,
        maxResults: Math.min(Math.max(maxResults, 1), 40),
        printType: "books",
        orderBy: query ? "relevance" : "newest"
      }),
      { next: { revalidate: 60 * 60 } }
    );

    if (!response.ok) {
      throw new Error(`Google Books search failed with ${response.status}`);
    }

    const data = (await response.json()) as { items?: GoogleVolume[] };
    return (data.items ?? []).map(normalizeGoogleBook).filter(Boolean) as NormalizedGoogleBook[];
  } catch (error) {
    logServerError("googleBooks.search", error);
    return [];
  }
}

export async function getGoogleBook(externalId: string) {
  try {
    const response = await fetch(googleBooksUrl(`volumes/${encodeURIComponent(externalId)}`, {}), {
      next: { revalidate: 60 * 60 }
    });

    if (!response.ok) {
      throw new Error(`Google Books detail failed with ${response.status}`);
    }

    return normalizeGoogleBook((await response.json()) as GoogleVolume);
  } catch (error) {
    logServerError("googleBooks.detail", error);
    return null;
  }
}

export async function upsertGoogleBook(book: NormalizedGoogleBook) {
  const existing = await prisma.book.findFirst({
    where: { externalSource: "google_books", externalId: book.externalId },
    include: { aiAnalysis: true }
  });

  if (existing) {
    return existing;
  }

  return prisma.book.create({
    data: {
      title: book.title,
      authorName: book.authorName,
      description: book.description,
      coverUrl: book.coverUrl,
      isbn: book.isbn,
      externalSource: "google_books",
      externalId: book.externalId,
      publishedYear: book.publishedYear,
      averageRating: book.averageRating,
      aiAnalysis: {
        create: {
          contentType: "BOOK",
          summary: book.description.slice(0, 260),
          genres: book.genres.length ? book.genres : ["book"],
          themes: book.genres.length ? book.genres.slice(0, 3) : ["reading"],
          audience: "general readers",
          mood: "discoverable",
          moderationFlags: [],
          embeddingText: `${book.title}\n${book.authorName}\n${book.description}\n${book.genres.join(", ")}`
        }
      }
    },
    include: { aiAnalysis: true }
  });
}
