"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BookMarked, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    setAccessToken(hash.get("access_token") ?? query.get("access_token") ?? "");
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!accessToken) {
      setError("Reset link is missing or expired. Request a new reset email.");
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Could not reset password.");
      return;
    }
    setMessage(data.message ?? "Password updated.");
    setTimeout(() => router.replace("/login"), 1200);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-lg p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment">
            <BookMarked size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-black text-ink">Choose new password</h1>
            <p className="font-ui text-sm text-ink/58">Create a new BOOKLY password.</p>
          </div>
        </div>
        <label className="font-ui mb-3 block text-sm font-bold text-ink/70">
          New password
          <div className="mt-1 flex items-center gap-2 rounded-md border border-ink/10 bg-white/70 px-3">
            <KeyRound size={16} />
            <input name="password" type="password" minLength={8} required className="w-full bg-transparent py-3 outline-none" />
          </div>
        </label>
        <label className="font-ui mb-4 block text-sm font-bold text-ink/70">
          Confirm password
          <input name="confirm" type="password" minLength={8} required className="mt-1 w-full rounded-md border border-ink/10 bg-white/70 px-3 py-3 outline-none" />
        </label>
        {error ? <p className="font-ui mb-3 text-sm font-bold text-rose">{error}</p> : null}
        {message ? <p className="font-ui mb-3 text-sm font-bold text-moss">{message}</p> : null}
        <button className="font-ui w-full rounded-md bg-ink px-4 py-3 font-bold text-parchment">Update password</button>
        <p className="font-ui mt-4 text-center text-sm text-ink/64">
          Need a new link? <Link href="/forgot-password" className="font-bold text-moss">Send reset email</Link>
        </p>
      </form>
    </main>
  );
}
