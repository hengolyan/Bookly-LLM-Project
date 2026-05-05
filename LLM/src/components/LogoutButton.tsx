"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="font-ui rounded-md border border-ink/10 bg-white/55 px-3 py-2 text-sm font-bold text-ink"
    >
      Logout
    </button>
  );
}
