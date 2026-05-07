import { getExternalBook, searchExternalBooks, upsertExternalBook, normalizeGoogleBook } from "@/lib/books";
export { normalizeGoogleBook };
export type { UnifiedBook as NormalizedGoogleBook } from "@/lib/books";

export function getGoogleBook(externalId: string) {
  return getExternalBook("google_books", externalId);
}

export function searchGoogleBooks({ query, genre, maxResults = 12 }: { query?: string; genre?: string; maxResults?: number }) {
  return searchExternalBooks({ query, genre, maxResults, source: "google_books" });
}

export const upsertGoogleBook = upsertExternalBook;
