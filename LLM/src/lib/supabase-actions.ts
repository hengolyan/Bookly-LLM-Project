import { PostKind } from "@prisma/client";
import { completeUnifiedBook, type ExternalBookInput } from "@/lib/books";
import { ensureUserProfile, supabaseServiceRest, type PublicUserProfile } from "@/lib/supabase-db";

type AnalysisInput = {
  summary: string;
  genres: string[];
  themes: string[];
  audience: string;
  mood: string;
  moderationFlags: string[];
};

function one<T>(rows: T[] | null | undefined) {
  return Array.isArray(rows) ? rows[0] : null;
}

function id() {
  return crypto.randomUUID();
}

async function ensureProfile(user: PublicUserProfile) {
  await ensureUserProfile({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    accountKind: user.accountKind
  });
}

export async function upsertExternalBookViaRest(input: ExternalBookInput) {
  const book = completeUnifiedBook(input);
  const existing = await supabaseServiceRest(
    `Book?externalSource=eq.${encodeURIComponent(book.source)}&externalId=eq.${encodeURIComponent(book.external_id)}&select=*&limit=1`
  );
  if (!existing.ok) throw new Error(existing.error);
  const current = one<any>(existing.data);
  if (current) return current;

  const created = await supabaseServiceRest("Book?select=*", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: id(),
      title: book.title,
      authorName: book.authors.join(", ") || "Unknown author",
      description: book.description,
      coverUrl: book.cover_url,
      isbn: book.isbn,
      externalSource: book.source,
      externalId: book.external_id,
      publishedYear: book.published_year,
      averageRating: book.rating
    })
  });
  if (!created.ok) throw new Error(created.error);
  return one<any>(created.data);
}

export async function saveBookViaRest(user: PublicUserProfile, bookId: string) {
  await ensureProfile(user);
  const book = await supabaseServiceRest(`Book?id=eq.${encodeURIComponent(bookId)}&select=id&limit=1`);
  if (!book.ok) throw new Error(book.error);
  if (!one(book.data)) throw new Error("Book not found");

  const existing = await supabaseServiceRest(`SavedItem?userId=eq.${encodeURIComponent(user.id)}&bookId=eq.${encodeURIComponent(bookId)}&select=id&limit=1`);
  if (!existing.ok) throw new Error(existing.error);
  if (one(existing.data)) return { saved: true, bookId };

  const saved = await supabaseServiceRest("SavedItem?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ id: id(), userId: user.id, bookId })
  });
  if (!saved.ok) throw new Error(saved.error);
  return { saved: true, bookId };
}

export async function saveExternalBookViaRest(user: PublicUserProfile, input: ExternalBookInput) {
  const book = await upsertExternalBookViaRest(input);
  return saveBookViaRest(user, book.id);
}

export async function createPostViaRest({
  user,
  kind,
  title,
  body,
  imageUrl,
  bookId,
  otherBookTitle,
  externalBook,
  analysis
}: {
  user: PublicUserProfile;
  kind: PostKind;
  title: string;
  body: string;
  imageUrl?: string;
  bookId?: string;
  otherBookTitle?: string;
  externalBook?: ExternalBookInput;
  analysis: AnalysisInput;
}) {
  await ensureProfile(user);
  const book = externalBook ? await upsertExternalBookViaRest(externalBook) : null;
  const manualBook = !book && otherBookTitle
    ? await upsertExternalBookViaRest({
        external_id: otherBookTitle.toLowerCase(),
        source: "google_books",
        title: otherBookTitle,
        authors: ["Community mention"],
        description: `Mentioned by ${user.displayName} in a BOOKLY post.`,
        categories: ["community"],
        subjects: ["community"],
        rating: 0
      })
    : null;
  const postId = id();
  const postResult = await supabaseServiceRest("Post?select=*", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: postId,
      authorId: user.id,
      kind,
      title,
      body,
      imageUrl,
      bookId: book?.id ?? manualBook?.id ?? bookId
    })
  });
  if (!postResult.ok) throw new Error(postResult.error);

  const aiResult = await supabaseServiceRest("AIContentAnalysis?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: id(),
      contentType: "POST",
      postId,
      summary: analysis.summary,
      genres: analysis.genres,
      themes: analysis.themes,
      audience: analysis.audience,
      mood: analysis.mood,
      moderationFlags: analysis.moderationFlags,
      embeddingText: `${analysis.summary}\n${analysis.genres.join(", ")}\n${analysis.themes.join(", ")}`
    })
  });
  if (!aiResult.ok) throw new Error(aiResult.error);

  return one<any>(postResult.data);
}

export async function commentPostViaRest(user: PublicUserProfile, postId: string, body: string) {
  await ensureProfile(user);
  const post = await supabaseServiceRest(`Post?id=eq.${encodeURIComponent(postId)}&select=id&limit=1`);
  if (!post.ok) throw new Error(post.error);
  if (!one(post.data)) throw new Error("Post not found");

  const comment = await supabaseServiceRest("Comment?select=*", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ id: id(), authorId: user.id, postId, body })
  });
  if (!comment.ok) throw new Error(comment.error);
  return one<any>(comment.data);
}

export async function likePostViaRest(user: PublicUserProfile, postId: string) {
  await ensureProfile(user);
  const existing = await supabaseServiceRest(`Like?userId=eq.${encodeURIComponent(user.id)}&postId=eq.${encodeURIComponent(postId)}&select=id&limit=1`);
  if (!existing.ok) throw new Error(existing.error);
  if (one(existing.data)) return { liked: true };

  const liked = await supabaseServiceRest("Like?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ id: id(), userId: user.id, postId })
  });
  if (!liked.ok) throw new Error(liked.error);
  return { liked: true };
}
