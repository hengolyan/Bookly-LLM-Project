import Link from "next/link";
import { Bookmark, MessageCircle, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { CommentForm, LikeButton } from "@/components/PostActions";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackImage = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80";

export default async function FeedPage() {
  const user = await getCurrentUser();
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { displayName: true, username: true, accountKind: true } },
      book: { select: { id: true, title: true, authorName: true, coverUrl: true } },
      likes: { select: { userId: true } },
      comments: { include: { author: { select: { displayName: true, username: true } } }, orderBy: { createdAt: "desc" }, take: 3 }
    },
    take: 20
  });

  return (
    <AppShell>
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-ink">Recommendation Feed</h1>
            <p className="mt-1 text-ink/64">Reviews, quotes, discussions, and reading updates from the BOOKLY community.</p>
          </div>
          <Link href="/posts/create" className="font-ui inline-flex items-center gap-2 rounded-md bg-rose px-4 py-3 font-bold text-white">
            <Plus size={18} />
            New post
          </Link>
        </div>

        <div className="grid gap-5">
          {posts.map((post) => {
            const liked = Boolean(user && post.likes.some((like) => like.userId === user.id));
            return (
              <article key={post.id} className="glass overflow-hidden rounded-lg">
                <div className="grid md:grid-cols-[260px_1fr]">
                  <img src={post.imageUrl ?? post.book?.coverUrl ?? fallbackImage} alt="" className="h-64 w-full object-cover md:h-full" />
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Link href={`/profile/${post.author.username}`} className="font-ui text-sm font-black text-ink">{post.author.displayName}</Link>
                      <Badge kind={post.author.accountKind} />
                      <span className="font-ui text-xs font-bold uppercase text-ink/46">{post.kind.replace("_", " ")}</span>
                    </div>
                    <h2 className="text-2xl font-black text-ink">{post.title}</h2>
                    {post.book ? (
                      <Link href={`/books/${post.book.id}`} className="font-ui mt-2 inline-block text-sm font-bold text-moss">
                        About {post.book.title} by {post.book.authorName}
                      </Link>
                    ) : null}
                    <p className="mt-3 text-lg leading-8 text-ink/70">{post.body}</p>
                    <div className="mt-6 flex items-center gap-2">
                      <LikeButton postId={post.id} initialLikes={post.likes.length} initialLiked={liked} />
                      <div className="font-ui flex h-10 items-center gap-2 rounded-md border border-ink/10 bg-white/55 px-3 text-sm font-bold">
                        <MessageCircle size={18} />
                        {post.comments.length}
                      </div>
                      <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/55" title="Save">
                        <Bookmark size={18} />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="rounded-md bg-white/45 p-3">
                          <p className="font-ui text-xs font-bold text-ink/54">@{comment.author.username}</p>
                          <p className="text-ink/72">{comment.body}</p>
                        </div>
                      ))}
                    </div>
                    <CommentForm postId={post.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
