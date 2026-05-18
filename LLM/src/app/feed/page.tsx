import Link from "next/link";
import { Bookmark, BookOpen, MessageCircle, PenLine, Plus, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { CommentForm, LikeButton } from "@/components/PostActions";
import { getCurrentUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const fallbackImage = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80";

function FeedTabs({ active }: { active: "for-you" | "following" }) {
  const tabs = [
    { href: "/feed", label: "For You", icon: Sparkles, active: active === "for-you" },
    { href: "/feed?tab=following", label: "Following", icon: Users, active: active === "following" }
  ];

  return (
    <div className="font-ui inline-flex rounded-md border border-gold/20 bg-black/10 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-black transition ${
              tab.active ? "bg-gold text-midnight" : "text-ink/68 hover:bg-white/35 hover:text-ink"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function FeedPage({ searchParams }: { searchParams?: { tab?: string } }) {
  const user = await getCurrentUser();
  let posts: any[] = [];
  let suggestedUsers: any[] = [];
  let suggestedStories: any[] = [];
  let followingCount = 0;
  let databaseError = "";
  const activeTab = searchParams?.tab === "following" ? "following" : "for-you";

  try {
    const followedIds = user
      ? (
          await prisma.follow.findMany({
            where: { followerId: user.id },
            select: { followingId: true }
          })
        ).map((follow) => follow.followingId)
      : [];
    followingCount = followedIds.length;

    const likedPosts = user
      ? await prisma.like.findMany({
          where: { userId: user.id },
          select: { post: { select: { aiAnalysis: { select: { genres: true, themes: true } }, book: { select: { aiAnalysis: { select: { genres: true, themes: true } } } } } } },
          take: 20
        })
      : [];
    const tasteTerms = Array.from(
      new Set(
        likedPosts.flatMap((like) => [
          ...(like.post.aiAnalysis?.genres ?? []),
          ...(like.post.aiAnalysis?.themes ?? []),
          ...(like.post.book?.aiAnalysis?.genres ?? []),
          ...(like.post.book?.aiAnalysis?.themes ?? [])
        ])
      )
    );

    posts = await prisma.post.findMany({
      where:
        activeTab === "following"
          ? user && followedIds.length
            ? { authorId: { in: followedIds } }
            : { id: "__none__" }
          : tasteTerms.length
            ? {
                OR: [
                  { aiAnalysis: { OR: [{ genres: { hasSome: tasteTerms } }, { themes: { hasSome: tasteTerms } }] } },
                  { book: { aiAnalysis: { OR: [{ genres: { hasSome: tasteTerms } }, { themes: { hasSome: tasteTerms } }] } } },
                  { authorId: { in: followedIds } }
                ]
              }
            : {},
      orderBy:
        activeTab === "for-you"
          ? [{ likes: { _count: "desc" } }, { comments: { _count: "desc" } }, { createdAt: "desc" }]
          : { createdAt: "desc" },
      include: {
        author: { select: { id: true, displayName: true, username: true, accountKind: true } },
        book: { select: { id: true, title: true, authorName: true, coverUrl: true, aiAnalysis: true } },
        likes: { select: { userId: true } },
        comments: { include: { author: { select: { displayName: true, username: true } } }, orderBy: { createdAt: "desc" }, take: 3 },
        aiAnalysis: true
      },
      take: 24
    });

    suggestedUsers = await prisma.user.findMany({
      where: user ? { id: { notIn: [user.id, ...followedIds] } } : {},
      orderBy: [{ followers: { _count: "desc" } }, { posts: { _count: "desc" } }],
      select: { id: true, displayName: true, username: true, accountKind: true, bio: true, _count: { select: { followers: true, posts: true } } },
      take: 4
    });

    suggestedStories = await prisma.story.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ averageRating: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, description: true, author: { select: { displayName: true, username: true } }, aiAnalysis: true },
      take: 3
    });
  } catch (error) {
    logServerError("feed", error);
    databaseError = databaseUnavailableMessage();
  }

  return (
    <AppShell>
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-ink">Recommendation Feed</h1>
            <p className="mt-1 text-ink/64">Reviews, quotes, story updates, and book discoveries from the BOOKLY community.</p>
          </div>
          <Link href="/posts/create" className="font-ui inline-flex items-center gap-2 rounded-md bg-rose px-4 py-3 font-bold text-white">
            <Plus size={18} />
            New post
          </Link>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <FeedTabs active={activeTab} />
          {user ? (
            <p className="font-ui text-sm font-bold text-ink/54">
              Following {followingCount} {followingCount === 1 ? "reader" : "readers"}
            </p>
          ) : (
            <Link href="/login" className="font-ui text-sm font-black text-moss">
              Log in to personalize your feed
            </Link>
          )}
        </div>

        <div className="grid gap-5">
          {databaseError ? <EmptyState title="Feed is temporarily unavailable" body={databaseError} /> : null}
          {!databaseError && !posts.length && activeTab === "for-you" ? (
            <EmptyState title="No posts yet" body="Create the first recommendation or review post." actionHref="/posts/create" actionLabel="Create Post" />
          ) : null}
          {!databaseError && !posts.length && activeTab === "following" ? (
            <div className="grid gap-5">
              <EmptyState
                title={user ? "Your following feed is waiting" : "Log in to see your following feed"}
                body={user ? "Follow readers and writers to build a personal timeline." : "Create an account or log in, then follow people whose taste you love."}
                actionHref="/discover"
                actionLabel="Explore BOOKLY"
              />
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <article className="glass rounded-lg p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-ink">
                    <Users size={20} className="text-moss" />
                    Suggested Readers
                  </h2>
                  <div className="grid gap-3">
                    {suggestedUsers.map((suggested) => (
                      <Link key={suggested.id} href={`/profile/${suggested.username}`} className="rounded-md border border-ink/10 bg-white/45 p-4">
                        <p className="font-ui text-sm font-black text-ink">{suggested.displayName}</p>
                        <p className="font-ui text-xs font-bold text-ink/50">@{suggested.username}</p>
                        <p className="mt-2 text-sm text-ink/64">{suggested.bio || `${suggested._count.posts} posts · ${suggested._count.followers} followers`}</p>
                      </Link>
                    ))}
                  </div>
                </article>
                <article className="glass rounded-lg p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-ink">
                    <PenLine size={20} className="text-rose" />
                    Stories To Explore
                  </h2>
                  <div className="grid gap-3">
                    {suggestedStories.map((story) => (
                      <Link key={story.id} href={`/stories/${story.id}`} className="rounded-md border border-ink/10 bg-white/45 p-4">
                        <p className="font-ui text-xs font-bold uppercase text-moss">{story.aiAnalysis?.genres?.[0] ?? "Story"}</p>
                        <h3 className="mt-1 text-lg font-black text-ink">{story.title}</h3>
                        <p className="text-sm text-ink/58">by {story.author.displayName}</p>
                      </Link>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          ) : null}
          {posts.map((post: any) => {
            const liked = Boolean(user && post.likes.some((like: any) => like.userId === user.id));
            return (
              <article key={post.id} className="glass overflow-hidden rounded-lg">
                <div className="grid md:grid-cols-[260px_1fr]">
                  <img src={post.imageUrl ?? post.book?.coverUrl ?? fallbackImage} alt="" className="h-64 w-full object-cover md:h-full" />
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Link href={`/profile/${post.author.username}`} className="font-ui text-sm font-black text-ink">{post.author.displayName}</Link>
                      <Badge kind={post.author.accountKind} />
                      <span className="font-ui text-xs font-bold uppercase text-ink/46">{post.kind.replace("_", " ")}</span>
                      {activeTab === "for-you" && user && post.author.id !== user.id ? (
                        <span className="font-ui rounded bg-gold/15 px-2 py-1 text-xs font-black text-ink/58">
                          {post.likes.length + post.comments.length > 0 ? "Popular with readers" : "Fresh discovery"}
                        </span>
                      ) : null}
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
                      {post.book ? (
                        <Link href={`/books/${post.book.id}`} className="font-ui flex h-10 items-center gap-2 rounded-md border border-ink/10 bg-white/55 px-3 text-sm font-bold">
                          <BookOpen size={18} />
                          Book
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-2">
                      {post.comments.map((comment: any) => (
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
