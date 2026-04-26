import { PenLine, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Metric } from "@/components/Metric";
import { demoUser } from "@/lib/demo-data";

export default function ProfilePage() {
  return (
    <AppShell>
      <section>
        <div className="glass rounded-lg p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid h-24 w-24 place-items-center rounded-lg bg-moss text-4xl font-black text-white">M</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-ink">{demoUser.displayName}</h1>
                <Badge kind={demoUser.accountKind} />
              </div>
              <p className="font-ui mt-1 text-sm font-bold text-ink/52">@{demoUser.username}</p>
              <p className="mt-3 max-w-2xl text-ink/68">{demoUser.bio}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Metric label="Stories" value="7" />
            <Metric label="Followers" value="12.8k" />
            <Metric label="Reviews" value="41" />
            <Metric label="Lists" value="9" />
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="glass rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2 text-moss">
              <PenLine size={18} />
              <h2 className="text-2xl font-black text-ink">Published stories</h2>
            </div>
            {["The Lantern Archive", "Wildflower Oaths", "A Map of Sleeping Doors"].map((story) => (
              <div key={story} className="border-t border-ink/10 py-4">
                <h3 className="text-xl font-black text-ink">{story}</h3>
                <p className="text-ink/60">Chapters, comments, ratings, saves, and AI genre signals.</p>
              </div>
            ))}
          </article>
          <article className="glass rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2 text-rose">
              <Users size={18} />
              <h2 className="text-2xl font-black text-ink">Book blog</h2>
            </div>
            {["Books with secret libraries", "Five stories for rainy evenings", "Why I love gentle villains"].map((post) => (
              <div key={post} className="border-t border-ink/10 py-4">
                <h3 className="text-xl font-black text-ink">{post}</h3>
                <p className="text-ink/60">Recommendation post with images, tags, likes, comments, and saves.</p>
              </div>
            ))}
          </article>
        </div>
      </section>
    </AppShell>
  );
}
