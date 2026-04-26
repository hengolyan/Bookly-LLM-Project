import { Eye, Save, Send, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function WritePage() {
  return (
    <AppShell>
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-ink">Story Studio</h1>
              <p className="text-ink/62">Draft chapters, preview your book page, then publish when ready.</p>
            </div>
            <div className="flex gap-2">
              <button className="grid h-11 w-11 place-items-center rounded-md border border-ink/10 bg-white/60" title="Preview">
                <Eye size={18} />
              </button>
              <button className="grid h-11 w-11 place-items-center rounded-md border border-ink/10 bg-white/60" title="Save draft">
                <Save size={18} />
              </button>
              <button className="grid h-11 w-11 place-items-center rounded-md bg-ink text-parchment" title="Publish">
                <Send size={18} />
              </button>
            </div>
          </div>
          <input className="mb-3 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 text-2xl font-black outline-none" placeholder="Story title" />
          <input className="mb-3 w-full rounded-md border border-ink/10 bg-white/68 px-4 py-3 text-lg outline-none" placeholder="Chapter title" />
          <textarea
            className="min-h-[460px] w-full resize-y rounded-md border border-ink/10 bg-white/68 p-4 text-lg leading-8 outline-none"
            placeholder="Begin your chapter..."
          />
        </div>

        <aside className="grid gap-4">
          <div className="glass rounded-lg p-5">
            <div className="font-ui mb-3 flex items-center gap-2 text-sm font-bold uppercase text-moss">
              <WandSparkles size={16} />
              AI organization
            </div>
            <p className="text-ink/68">
              On publish, BOOKLY classifies genre, themes, mood, audience, moderation flags, and similar content.
            </p>
          </div>
          <div className="glass rounded-lg p-5">
            <h2 className="text-xl font-black text-ink">Publishing checklist</h2>
            {["Cover image", "Description", "At least one chapter", "Genre tags", "Author badge"].map((item) => (
              <label key={item} className="font-ui mt-3 flex items-center gap-2 text-sm font-bold text-ink/70">
                <input type="checkbox" className="h-4 w-4 accent-moss" />
                {item}
              </label>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
