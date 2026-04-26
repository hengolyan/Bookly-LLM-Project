import { MessageCircle, Repeat2, ThumbsUp, Bookmark, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { feedPosts } from "@/lib/demo-data";

export default function FeedPage() {
  return (
    <AppShell>
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-ink">Recommendation Feed</h1>
            <p className="mt-1 text-ink/64">Reviews, quotes, discussions, and reading updates from the BOOKLY community.</p>
          </div>
          <button className="font-ui inline-flex items-center gap-2 rounded-md bg-rose px-4 py-3 font-bold text-white">
            <Plus size={18} />
            New post
          </button>
        </div>

        <div className="grid gap-5">
          {feedPosts.map((post) => (
            <article key={post.title} className="glass overflow-hidden rounded-lg">
              <div className="grid md:grid-cols-[260px_1fr]">
                <img src={post.image} alt="" className="h-64 w-full object-cover md:h-full" />
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="font-ui text-sm font-black text-ink">{post.author}</span>
                    <Badge kind={post.badge} />
                    <span className="font-ui text-xs font-bold uppercase text-ink/46">{post.kind}</span>
                  </div>
                  <h2 className="text-2xl font-black text-ink">{post.title}</h2>
                  <p className="mt-3 text-lg leading-8 text-ink/70">{post.body}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      ["Magical realism", "genre"],
                      ["Book club", "topic"],
                      ["AI sorted", "system"]
                    ].map(([label, type]) => (
                      <span key={label} className="font-ui rounded bg-white/60 px-2 py-1 text-xs font-bold text-ink/62">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/55" title="Like">
                      <ThumbsUp size={18} />
                    </button>
                    <button className="font-ui flex h-10 items-center gap-2 rounded-md border border-ink/10 bg-white/55 px-3 text-sm font-bold">
                      <MessageCircle size={18} />
                      {post.comments}
                    </button>
                    <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/55" title="Repost">
                      <Repeat2 size={18} />
                    </button>
                    <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/55" title="Save">
                      <Bookmark size={18} />
                    </button>
                    <span className="font-ui ml-auto text-sm font-bold text-ink/58">{post.likes} likes</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
