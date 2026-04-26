"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BookMarked } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.get("displayName"),
        username: form.get("username"),
        email: form.get("email"),
        password: form.get("password"),
        accountKind: form.get("accountKind")
      })
    });

    if (!response.ok) {
      setError("Could not create the account. Try another email or username.");
      return;
    }

    router.push("/");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-lg p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment">
            <BookMarked size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-black text-ink">Join BOOKLY</h1>
            <p className="font-ui text-sm text-ink/58">Create, read, and recommend</p>
          </div>
        </div>
        <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
          Display name
          <input name="displayName" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
        </label>
        <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
          Username
          <input name="username" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
        </label>
        <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
        </label>
        <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
          Account type
          <select name="accountKind" className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none">
            <option value="READER_WRITER">Reader-writer</option>
            <option value="INDEPENDENT_AUTHOR">Independent author</option>
            <option value="VERIFIED_AUTHOR">Verified author</option>
            <option value="PUBLISHER">Publisher</option>
          </select>
        </label>
        <label className="font-ui mb-4 block text-sm font-bold text-ink/70">
          Password
          <input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
        </label>
        {error ? <p className="font-ui mb-3 text-sm font-bold text-rose">{error}</p> : null}
        <button className="font-ui w-full rounded-md bg-ink px-4 py-3 font-bold text-parchment">Create account</button>
        <p className="font-ui mt-4 text-center text-sm text-ink/64">
          Already have one? <Link href="/login" className="font-bold text-moss">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
