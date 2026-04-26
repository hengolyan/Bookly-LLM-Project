import Link from "next/link";
import type { CSSProperties } from "react";
import { BookOpen, ChevronRight, Clock, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Metric } from "@/components/Metric";
import { currentRead, demoUser, recommendations } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass overflow-hidden rounded-lg">
          <div className="grid min-h-[360px] md:grid-cols-[0.8fr_1.2fr]">
            <div
              className="book-cover min-h-[280px]"
              style={{ "--cover-url": `url(${currentRead.cover})` } as CSSProperties}
            />
            <div className="flex flex-col justify-between p-6">
              <div>
                <div className="font-ui mb-4 flex items-center gap-2 text-sm font-bold uppercase text-moss">
                  <Clock size={16} />
                  Continue reading
                </div>
                <h1 className="text-4xl font-black leading-tight text-ink">{currentRead.title}</h1>
                <p className="mt-2 text-lg text-ink/68">by {currentRead.author}</p>
                <div className="mt-6">
                  <div className="mb-2 flex justify-between font-ui text-sm font-bold text-ink/62">
                    <span>Chapter {currentRead.chapter}</span>
                    <span>{currentRead.progress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-ink/10">
                    <div className="h-3 rounded-full bg-moss" style={{ width: `${currentRead.progress}%` }} />
                  </div>
                </div>
              </div>
              <Link
                href="/stories/the-lantern-archive"
                className="font-ui mt-8 inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 font-bold text-parchment"
              >
                Open where I stopped
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="glass rounded-lg p-5">
            <div className="font-ui mb-3 flex items-center gap-2 text-sm font-bold uppercase text-rose">
              <WandSparkles size={16} />
              Your reading taste
            </div>
            <h2 className="text-2xl font-black text-ink">Cozy magic, dangerous bargains, found families.</h2>
            <p className="mt-3 text-ink/68">
              BOOKLY uses story text, posts, tags, saves, and progress signals to connect you to stories and published books.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Saved" value="42" />
            <Metric label="Drafts" value="5" />
            <Metric label="Reviews" value="18" />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-ink">Recommended for {demoUser.displayName}</h2>
            <Link href="/discover" className="font-ui text-sm font-bold text-moss">
              View all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendations.map((item) => (
              <article key={item.title} className="glass rounded-lg p-5">
                <div className="font-ui mb-4 inline-flex items-center gap-2 rounded bg-moss/12 px-2 py-1 text-xs font-bold text-moss">
                  <BookOpen size={14} />
                  {item.tag}
                </div>
                <h3 className="text-xl font-black text-ink">{item.title}</h3>
                <p className="mt-1 text-ink/58">{item.author}</p>
                <p className="font-ui mt-4 text-sm leading-6 text-ink/68">{item.reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
