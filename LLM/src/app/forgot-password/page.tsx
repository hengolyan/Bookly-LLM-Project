"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BookMarked, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Could not send reset email.");
      return;
    }
    setMessage(data.message ?? "Check your email for reset instructions.");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-lg p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment">
            <BookMarked size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-black text-ink">Reset password</h1>
            <p className="font-ui text-sm text-ink/58">BOOKLY will email you a secure reset link.</p>
          </div>
        </div>
        <label className="font-ui mb-4 block text-sm font-bold text-ink/70">
          Email
          <div className="mt-1 flex items-center gap-2 rounded-md border border-ink/10 bg-white/70 px-3">
            <Mail size={16} />
            <input name="email" type="email" required className="w-full bg-transparent py-3 outline-none" />
          </div>
        </label>
        {error ? <p className="font-ui mb-3 text-sm font-bold text-rose">{error}</p> : null}
        {message ? <p className="font-ui mb-3 text-sm font-bold text-moss">{message}</p> : null}
        <button className="font-ui w-full rounded-md bg-ink px-4 py-3 font-bold text-parchment">Send reset email</button>
        <p className="font-ui mt-4 text-center text-sm text-ink/64">
          Remembered it? <Link href="/login" className="font-bold text-moss">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
