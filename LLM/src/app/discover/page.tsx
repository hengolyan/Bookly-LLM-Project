import { Filter, Search, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { recommendations } from "@/lib/demo-data";

export default function DiscoverPage() {
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-black text-ink">Discover</h1>
        <div className="glass mt-4 flex flex-wrap items-center gap-3 rounded-lg p-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md bg-white/65 px-3 py-3">
            <Search size={18} />
            <input className="font-ui w-full bg-transparent text-sm outline-none" placeholder="Search stories, books, authors, publishers" />
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment" title="Filters">
            <Filter size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {recommendations.concat(recommendations).map((item, index) => (
            <article key={`${item.title}-${index}`} className="glass rounded-lg p-5">
              <div className="font-ui mb-3 inline-flex items-center gap-2 rounded bg-rose/12 px-2 py-1 text-xs font-bold text-rose">
                <WandSparkles size={14} />
                AI explanation
              </div>
              <h2 className="text-xl font-black text-ink">{item.title}</h2>
              <p className="mt-1 text-ink/58">by {item.author}</p>
              <p className="font-ui mt-4 text-sm leading-6 text-ink/68">{item.reason}</p>
              <button className="font-ui mt-5 rounded-md bg-moss px-4 py-2 text-sm font-bold text-white">Save</button>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
