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

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/feed", label: "Feed", icon: Sparkles },
  { href: "/write", label: "Write", icon: Feather },
  { href: "/library", label: "Library", icon: Library }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-parchment/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-parchment shadow-glow">
              <BookMarked size={22} />
            </span>
            <span>
              <span className="block text-xl font-black tracking-normal text-ink">BOOKLY</span>
              <span className="font-ui text-xs text-ink/60">write, read, recommend</span>
            </span>
          </Link>

          <nav className="hidden items-center rounded-md border border-ink/10 bg-white/45 p-1 md:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-ui flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold text-ink/74 transition hover:bg-white/70 hover:text-ink"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/55 text-ink" title="Search">
              <Search size={18} />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/55 text-ink" title="Notifications">
              <Bell size={18} />
            </button>
            <Link
              href="/profile/maya_pages"
              className="grid h-10 w-10 place-items-center rounded-md bg-moss text-white"
              title="Profile"
            >
              <UserRound size={18} />
            </Link>
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
        {children}
      </div>
    </main>
  );
}
