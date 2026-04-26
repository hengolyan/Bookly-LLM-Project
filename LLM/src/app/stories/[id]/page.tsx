import { Bookmark, MessageCircle, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { currentRead } from "@/lib/demo-data";

export default function StoryReaderPage() {
  return (
    <AppShell>
      <article className="glass rounded-lg p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-ui text-sm font-bold uppercase text-moss">Chapter {currentRead.chapter}</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-ink">The Door Beneath the Lanterns</h1>
          <p className="mt-2 text-ink/60">from {currentRead.title}</p>
          <div className="mt-5 flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/60" title="Bookmark">
              <Bookmark size={18} />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/60" title="Comment on book">
              <MessageCircle size={18} />
            </button>
            <button className="font-ui flex h-10 items-center gap-1 rounded-md border border-ink/10 bg-white/60 px-3 text-sm font-bold" title="Rate">
              <Star size={16} fill="currentColor" />
              4.8
            </button>
          </div>
          <div className="mt-8 space-y-6 text-xl leading-9 text-ink/78">
            <p>
              The library woke only after sunset, when every brass lantern leaned toward the shelves as if listening.
              Mira pressed her palm to the locked archive door and felt a heartbeat answer from the other side.
            </p>
            <p>
              Someone had written her name in gold dust across the threshold. Beneath it waited a map, folded into the
              shape of a moth, its wings trembling with directions no ordinary road could hold.
            </p>
            <p>
              She should have called for the keeper. She should have stepped away. Instead, she opened the map and let
              the first impossible street unfold at her feet.
            </p>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
