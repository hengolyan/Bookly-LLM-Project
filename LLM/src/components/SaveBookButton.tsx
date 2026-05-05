"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark } from "lucide-react";

export function SaveBookButton({ bookId, initialSaved }: { bookId: string; initialSaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function saveBook() {
    setBusy(true);
    const response = await fetch(`/api/books/${bookId}/save`, { method: "POST" });
    setBusy(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (response.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <button
      onClick={saveBook}
      disabled={busy || saved}
      className="font-ui inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-parchment disabled:opacity-65"
    >
      <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
      {saved ? "Saved" : busy ? "Saving..." : "Save Book"}
    </button>
  );
}
