"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { PostKind } from "@prisma/client";
import type { UnifiedBook } from "@/lib/books";

export function PostComposer({
  books,
  defaultBookId,
  externalBook,
  users = [],
  defaultKind = "RECOMMENDATION"
}: {
  books: { id: string; title: string; authorName: string }[];
  defaultBookId?: string;
  externalBook?: UnifiedBook;
  users?: { id: string; displayName: string; username: string }[];
  defaultKind?: PostKind;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [bookChoice, setBookChoice] = useState(defaultBookId ?? (externalBook ? "external" : ""));

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const selectedBookId = form.get("bookId");
    const isOtherBook = selectedBookId === "__other__";
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: form.get("kind"),
        bookId: !isOtherBook && selectedBookId ? selectedBookId : undefined,
        otherBookTitle: isOtherBook ? form.get("otherBookTitle") : undefined,
        taggedUsernames: form.getAll("taggedUsernames").filter(Boolean),
        externalBook,
        title: form.get("title"),
        body: form.get("body"),
        imageUrl: form.get("imageUrl") || undefined
      })
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not create the post. Check the required fields.");
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <form onSubmit={submitPost} className="glass grid gap-4 rounded-lg p-5">
      <label className="font-ui text-sm font-bold text-ink/70">
        Post type
        <select name="kind" defaultValue={defaultKind} className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none">
          <option value="RECOMMENDATION">Recommendation</option>
          <option value="REVIEW">Review</option>
          <option value="QUOTE">Quote</option>
          <option value="DISCUSSION">Discussion</option>
          <option value="READING_UPDATE">Reading update</option>
        </select>
      </label>
      <label className="font-ui text-sm font-bold text-ink/70">
        Related book
        <select
          name="bookId"
          value={bookChoice}
          onChange={(event) => setBookChoice(event.target.value)}
          className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none"
        >
          <option value="">No book selected</option>
          {externalBook ? <option value="external">{externalBook.title} by {externalBook.authors.join(", ")}</option> : null}
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title} by {book.authorName}
            </option>
          ))}
          <option value="__other__">Other book...</option>
        </select>
      </label>
      {bookChoice === "__other__" ? (
        <label className="font-ui text-sm font-bold text-ink/70">
          Book name
          <input name="otherBookTitle" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" placeholder="Write the book title" />
        </label>
      ) : null}
      <label className="font-ui text-sm font-bold text-ink/70">
        Title
        <input name="title" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
      </label>
      <label className="font-ui text-sm font-bold text-ink/70">
        Tag users
        <select name="taggedUsernames" multiple className="mt-1 min-h-28 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none">
          {users.map((user) => (
            <option key={user.id} value={user.username}>
              @{user.username} - {user.displayName}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-ink/52">Hold Ctrl to choose more than one user.</span>
      </label>
      <label className="font-ui text-sm font-bold text-ink/70">
        Image URL
        <input name="imageUrl" type="url" className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
      </label>
      <label className="font-ui text-sm font-bold text-ink/70">
        Post
        <textarea name="body" required rows={8} className="mt-1 w-full resize-y rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
      </label>
      {error ? <p className="font-ui text-sm font-bold text-rose">{error}</p> : null}
      <button className="font-ui w-fit rounded-md bg-ink px-5 py-3 font-bold text-parchment">Publish Post</button>
    </form>
  );
}
