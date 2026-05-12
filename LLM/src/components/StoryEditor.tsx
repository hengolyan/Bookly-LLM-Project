"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ImagePlus, Plus, Send, Trash2 } from "lucide-react";

type EditableStory = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  chapters: { id: string; number: number; title: string }[];
};

export function StoryEditor({ story }: { story?: EditableStory | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">((story?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"));
  const isEditing = Boolean(story);

  async function submitStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      coverUrl: form.get("coverUrl") || undefined,
      status,
      chapterTitle: form.get("chapterTitle") || undefined,
      body: form.get("body") || undefined,
      chapters: [
        {
          title: form.get("chapterTitle"),
          body: form.get("body")
        }
      ]
    };

    const response = await fetch(isEditing ? `/api/stories/${story!.id}` : "/api/stories", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not save the story. Please fill every required field.");
      return;
    }

    const data = await response.json();
    router.push(status === "PUBLISHED" ? `/stories/${data.story.id}` : "/write");
    router.refresh();
  }

  async function deleteStory() {
    if (!story) return;
    const confirmed = window.confirm(`Delete "${story.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setError("");
    const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not delete this story.");
      return;
    }
    router.push("/write");
    router.refresh();
  }

  return (
    <form onSubmit={submitStory} className="glass rounded-lg p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-ui text-xs font-black uppercase tracking-[0.18em] text-moss">{isEditing ? "Continue book" : "New book"}</p>
          <h1 className="mt-1 text-3xl font-black text-ink">{isEditing ? story?.title : "Start a new BOOKLY story"}</h1>
        </div>
        {isEditing ? (
          <button type="button" onClick={deleteStory} className="font-ui inline-flex items-center gap-2 rounded-md border border-rose/30 bg-rose/10 px-3 py-2 text-sm font-black text-rose">
            <Trash2 size={16} />
            Delete
          </button>
        ) : null}
      </div>

      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        Story title
        <input name="title" defaultValue={story?.title ?? ""} required className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 text-2xl font-black outline-none" />
      </label>
      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        Description
        <textarea name="description" defaultValue={story?.description ?? ""} required rows={3} className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 outline-none" />
      </label>
      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        <span className="inline-flex items-center gap-2"><ImagePlus size={16} /> Cover photo URL</span>
        <input name="coverUrl" type="url" defaultValue={story?.coverUrl ?? ""} className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 outline-none" />
      </label>

      {isEditing && story?.chapters.length ? (
        <div className="mb-4 rounded-md border border-ink/10 bg-white/45 p-4">
          <p className="font-ui text-xs font-black uppercase tracking-[0.16em] text-moss">Existing chapters</p>
          <div className="mt-3 grid gap-2">
            {story.chapters.map((chapter) => (
              <div key={chapter.id} className="font-ui flex items-center gap-2 text-sm font-bold text-ink/70">
                <BookOpen size={15} />
                Chapter {chapter.number}: {chapter.title}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
        <span className="inline-flex items-center gap-2"><Plus size={16} /> {isEditing ? "Add chapter title" : "First chapter title"}</span>
        <input name="chapterTitle" required={!isEditing} className="mt-1 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 text-lg outline-none" />
      </label>
      <label className="font-ui mb-4 block text-sm font-bold text-ink/70">
        {isEditing ? "New chapter body" : "First chapter body"}
        <textarea name="body" required={!isEditing} className="mt-1 min-h-[360px] w-full resize-y rounded-md border border-ink/10 bg-white/68 p-4 text-lg leading-8 outline-none" />
      </label>
      {error ? <p className="font-ui mb-3 text-sm font-bold text-rose">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          onClick={() => setStatus("DRAFT")}
          className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 font-bold text-ink"
        >
          {isEditing ? "Save Changes" : "Save Draft"}
        </button>
        <button
          type="submit"
          onClick={() => setStatus("PUBLISHED")}
          className="font-ui inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-parchment"
        >
          <Send size={16} />
          Publish
        </button>
      </div>
    </form>
  );
}
