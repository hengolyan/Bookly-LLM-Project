"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ThumbsUp } from "lucide-react";

export function LikeButton({ postId, initialLikes, initialLiked }: { postId: string; initialLikes: number; initialLiked: boolean }) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function like() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    setBusy(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (response.ok && !liked) {
      setLiked(true);
      setLikes((value) => value + 1);
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => null);
    setError(data?.error ?? "Could not like this post.");
  }

  return (
    <div>
      <button
        onClick={like}
        disabled={busy || liked}
        className="font-ui flex h-10 items-center gap-2 rounded-md border border-ink/10 bg-white/55 px-3 text-sm font-bold text-ink disabled:opacity-60"
        title="Like"
      >
        <ThumbsUp size={18} fill={liked ? "currentColor" : "none"} />
        {likes}
      </button>
      {error ? <p className="font-ui mt-1 max-w-xs text-xs font-bold text-rose">{error}</p> : null}
    </div>
  );
}

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: form.get("body") })
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Comment could not be posted.");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submitComment} className="mt-4 flex gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-ink/10 bg-white/55 px-3">
        <MessageCircle size={16} />
        <input name="body" required maxLength={500} className="font-ui min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" placeholder="Write a comment" />
      </div>
      <button className="font-ui rounded-md bg-moss px-3 py-2 text-sm font-bold text-white">Post</button>
      {error ? <p className="font-ui text-xs font-bold text-rose">{error}</p> : null}
    </form>
  );
}
