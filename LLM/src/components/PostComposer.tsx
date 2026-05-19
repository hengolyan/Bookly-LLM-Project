"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { PostKind } from "@prisma/client";
import type { UnifiedBook } from "@/lib/books";

export function PostComposer({
  books,
  defaultBookId,
  externalBook,
  defaultKind = "RECOMMENDATION"
}: {
  books: { id: string; title: string; authorName: string }[];
  defaultBookId?: string;
  externalBook?: UnifiedBook;
  defaultKind?: PostKind;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [bookChoice, setBookChoice] = useState(defaultBookId ?? (externalBook ? "external" : ""));
  const [tagQuery, setTagQuery] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<{ id: string; displayName: string; username: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; displayName: string; username: string }[]>([]);
  const [tagLoading, setTagLoading] = useState(false);

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
        taggedUsernames: selectedUsers.map((user) => user.username),
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

  async function searchUsers(query: string) {
    setTagQuery(query);
    if (query.trim().replace(/^@/, "").length < 2) {
      setTagSuggestions([]);
      return;
    }

    setTagLoading(true);
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    const data = await response.json().catch(() => ({ users: [] }));
    setTagLoading(false);
    if (!response.ok) {
      setTagSuggestions([]);
      return;
    }

    const selected = new Set(selectedUsers.map((user) => user.username));
    setTagSuggestions((data.users ?? []).filter((user: { username: string }) => !selected.has(user.username)));
  }

  function addTaggedUser(user: { id: string; displayName: string; username: string }) {
    setSelectedUsers((current) => (current.some((item) => item.username === user.username) ? current : [...current, user]));
    setTagQuery("");
    setTagSuggestions([]);
  }

  function removeTaggedUser(username: string) {
    setSelectedUsers((current) => current.filter((user) => user.username !== username));
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
        <input
          value={tagQuery}
          onChange={(event) => searchUsers(event.target.value)}
          className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none"
          placeholder="Type a username, like @booklover"
        />
        {selectedUsers.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <span key={user.id} className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-black text-ink">
                @{user.username}
                <button type="button" onClick={() => removeTaggedUser(user.username)} className="grid h-5 w-5 place-items-center rounded-full bg-ink/10 text-ink">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {tagQuery.trim().length >= 2 ? (
          <div className="mt-2 overflow-hidden rounded-md border border-ink/10 bg-white/90 shadow-glow">
            {tagLoading ? <p className="px-3 py-3 text-xs text-ink/56">Searching readers...</p> : null}
            {!tagLoading && tagSuggestions.length === 0 ? <p className="px-3 py-3 text-xs text-ink/56">No matching users found.</p> : null}
            {tagSuggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => addTaggedUser(user)}
                className="flex w-full items-center justify-between px-3 py-3 text-left hover:bg-gold/10"
              >
                <span>
                  <span className="block text-sm font-black text-ink">@{user.username}</span>
                  <span className="block text-xs text-ink/52">{user.displayName}</span>
                </span>
                <span className="text-xs font-black text-moss">Tag</span>
              </button>
            ))}
          </div>
        ) : null}
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
