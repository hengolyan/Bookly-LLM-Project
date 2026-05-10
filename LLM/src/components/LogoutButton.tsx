"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="font-ui rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-sm font-bold text-gold"
    >
      Logout
    </button>
  );
}
