"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BookMarked } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Could not sign you in. Check your email and password.");
      return;
    }

    const data = await response.json().catch(() => null);
    router.replace(data?.user?.username ? `/profile/${data.user.username}` : "/");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-lg p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment">
            <BookMarked size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-black text-ink">Welcome back</h1>
            <p className="font-ui text-sm text-ink/58">Sign in to BOOKLY</p>
          </div>
        </div>
        <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
        </label>
        <label className="font-ui mb-4 block text-sm font-bold text-ink/70">
          Password
          <input name="password" type="password" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
        </label>
        {error ? <p className="font-ui mb-3 text-sm font-bold text-rose">{error}</p> : null}
        <button className="font-ui w-full rounded-md bg-ink px-4 py-3 font-bold text-parchment">Sign in</button>
        <p className="font-ui mt-4 text-center text-sm text-ink/64">
          New here? <Link href="/register" className="font-bold text-moss">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
