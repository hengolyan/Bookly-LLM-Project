import Link from "next/link";
import {
  Bell,
  BookMarked,
  Compass,
  Feather,
  Home,
  Library,
  Search,
  Sparkles,
  UserRound
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { MoodToggle } from "@/components/MoodToggle";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/feed", label: "Feed", icon: Sparkles },
  { href: "/posts/create", label: "Create Post", icon: Feather },
  { href: "/write", label: "Write", icon: Feather },
  { href: "/library", label: "Library", icon: Library }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-gold/25 bg-midnight/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-ink text-parchment shadow-glow sm:h-10 sm:w-10">
              <BookMarked size={22} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-black tracking-normal text-gold sm:text-xl">BOOKLY</span>
              <span className="font-ui hidden text-xs text-parchment/70 sm:block">write, read, recommend</span>
            </span>
          </Link>

          <nav className="hidden items-center rounded-md border border-gold/20 bg-black/20 p-1 md:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-ui flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-parchment/76 transition hover:bg-gold/15 hover:text-gold"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/discover" className="grid h-9 w-9 place-items-center rounded-md border border-gold/20 bg-black/20 text-parchment sm:h-10 sm:w-10" title="Search">
              <Search size={18} />
            </Link>
            <MoodToggle />
            <button className="hidden h-10 w-10 place-items-center rounded-md border border-gold/20 bg-black/20 text-parchment sm:grid" title="Notifications">
              <Bell size={18} />
            </button>
            {user ? (
              <>
                <Link
                  href={`/profile/${user.username}`}
                  className="grid h-10 w-10 place-items-center rounded-md bg-moss text-white"
                  title="Profile"
                >
                  <UserRound size={18} />
                </Link>
                <LogoutButton />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="font-ui rounded-md border border-gold/20 bg-black/20 px-2.5 py-2 text-sm font-bold text-parchment sm:px-3">
                  Login
                </Link>
                <Link href="/register" className="font-ui hidden rounded-md bg-gold px-3 py-2 text-sm font-bold text-midnight sm:inline-flex">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <div className="glass sticky top-24 rounded-lg p-3">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-ui mb-1 flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-ink/76 hover:bg-white/55"
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}
