"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function StoryEditor() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");

  async function submitStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        coverUrl: form.get("coverUrl") || undefined,
        status,
        chapters: [
          {
            title: form.get("chapterTitle"),
            body: form.get("body")
          }
        ]
      })
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError("Could not save the story. Please fill every required field.");
      return;
    }

    const data = await response.json();
    router.push(`/stories/${data.story.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submitStory} className="glass rounded-lg p-5">
      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        Story title
        <input name="title" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 text-2xl font-black outline-none" />
      </label>
      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        Description
        <textarea name="description" required rows={3} className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 outline-none" />
      </label>
      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        Cover URL
        <input name="coverUrl" type="url" className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 outline-none" />
      </label>
      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        Chapter title
        <input name="chapterTitle" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 text-lg outline-none" />
      </label>
      <label className="font-ui mb-4 block text-sm font-bold text-ink/70">
        Chapter body
        <textarea name="body" required className="mt-1 min-h-[360px] w-full resize-y rounded-md border border-ink/10 bg-white/68 p-4 text-lg leading-8 outline-none" />
      </label>
      {error ? <p className="font-ui mb-3 text-sm font-bold text-rose">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          onClick={() => setStatus("DRAFT")}
          className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink"
        >
          Save Draft
        </button>
        <button
          type="submit"
          onClick={() => setStatus("PUBLISHED")}
          className="font-ui rounded-md bg-ink px-4 py-3 font-bold text-parchment"
        >
          Publish
        </button>
      </div>
    </form>
  );
}
