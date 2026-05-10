"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import type { UnifiedBook } from "@/lib/books";

export function SaveBookButton({
  bookId,
  externalBook,
  initialSaved
}: {
  bookId?: string;
  externalBook?: UnifiedBook;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveBook() {
    setBusy(true);
    setError("");
    const response = await (bookId
      ? fetch(`/api/books/${bookId}/save`, { method: "POST" })
      : fetch("/api/books/external/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book: externalBook })
        }));
    setBusy(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (response.ok) {
      setSaved(true);
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => null);
    setError(data?.error ?? "Could not save this book. Please try again.");
  }

  return (
    <div>
      <button
        onClick={saveBook}
        disabled={busy || saved}
        className="font-ui inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-parchment disabled:opacity-65"
      >
        <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : busy ? "Saving..." : "Save Book"}
      </button>
      {error ? <p className="font-ui mt-2 max-w-xs text-sm font-bold text-rose">{error}</p> : null}
    </div>
  );
}
