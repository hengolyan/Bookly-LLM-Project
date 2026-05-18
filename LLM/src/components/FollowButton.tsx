"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, UserPlus } from "lucide-react";

export function FollowButton({
  userId,
  initialFollowing,
  disabled = false
}: {
  userId: string;
  initialFollowing: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function toggleFollow() {
    if (disabled || pending) return;
    const next = !following;
    setFollowing(next);
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: next ? "POST" : "DELETE"
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFollowing(!next);
        setError(data.error ?? "Could not update follow.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={disabled || pending}
        className={`font-ui inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition ${
          following ? "border border-ink/10 bg-white/65 text-ink" : "bg-moss text-white"
        } disabled:cursor-not-allowed disabled:opacity-55`}
      >
        {following ? <UserMinus size={18} /> : <UserPlus size={18} />}
        {pending ? "Saving..." : following ? "Unfollow" : "Follow"}
      </button>
      {error ? <p className="font-ui text-xs font-bold text-rose">{error}</p> : null}
    </div>
  );
}
