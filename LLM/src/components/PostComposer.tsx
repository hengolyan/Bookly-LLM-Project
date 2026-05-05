"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { PostKind } from "@prisma/client";
import type { NormalizedGoogleBook } from "@/lib/google-books";

export function PostComposer({
  books,
  defaultBookId,
  externalBook,
  defaultKind = "RECOMMENDATION"
}: {
  books: { id: string; title: string; authorName: string }[];
  defaultBookId?: string;
  externalBook?: NormalizedGoogleBook;
  defaultKind?: PostKind;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: form.get("kind"),
        bookId: form.get("bookId") || undefined,
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
      setError("Could not create the post. Check the required fields.");
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
        <select name="bookId" defaultValue={defaultBookId ?? ""} className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none">
          <option value="">No book selected</option>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title} by {book.authorName}
            </option>
          ))}
        </select>
      </label>
      <label className="font-ui text-sm font-bold text-ink/70">
        Title
        <input name="title" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
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
