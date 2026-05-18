import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLine, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import { Metric } from "@/components/Metric";
import { getCurrentUser } from "@/lib/auth";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const user = await getCurrentUser();
  let profile: any = null;
  let databaseError = "";
  let isFollowing = false;

  try {
    profile = await prisma.user.findUnique({
      where: { username: params.username },
      include: {
        stories: { orderBy: { updatedAt: "desc" }, take: 6 },
        posts: { orderBy: { createdAt: "desc" }, include: { book: true }, take: 6 },
        followers: { select: { id: true } },
        following: { select: { id: true } },
        savedItems: { select: { id: true } }
      }
    });
    isFollowing = Boolean(
      user && profile && user.id !== profile.id
        ? await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: user.id, followingId: profile.id } },
            select: { id: true }
          })
        : false
    );
  } catch (error) {
    logServerError("profile", error);
    databaseError = databaseUnavailableMessage();
  }

  if (databaseError) {
    return (
      <AppShell>
        <EmptyState title="Profile is temporarily unavailable" body={databaseError} />
      </AppShell>
    );
  }

  if (!profile) notFound();

  return (
    <AppShell>
      <section>
        <div className="glass rounded-lg p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid h-24 w-24 place-items-center rounded-lg bg-moss text-4xl font-black text-white">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-ink">{profile.displayName}</h1>
                <Badge kind={profile.accountKind} />
              </div>
              <p className="font-ui mt-1 text-sm font-bold text-ink/52">@{profile.username}</p>
              <p className="mt-3 max-w-2xl text-ink/68">{profile.bio || "BOOKLY reader, writer, and recommender."}</p>
            </div>
            {user?.id !== profile.id ? (
              user ? (
                <FollowButton userId={profile.id} initialFollowing={isFollowing} />
              ) : (
                <Link href="/login" className="font-ui rounded-md bg-moss px-4 py-3 text-sm font-black text-white">
                  Log in to follow
                </Link>
              )
            ) : null}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Metric label="Stories" value={profile.stories.length} />
            <Metric label="Followers" value={profile.followers.length} />
            <Metric label="Posts" value={profile.posts.length} />
            <Metric label="Saved" value={profile.savedItems.length} />
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="glass rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2 text-moss">
              <PenLine size={18} />
              <h2 className="text-2xl font-black text-ink">Published stories</h2>
            </div>
            {profile.stories.map((story: any) => (
              <Link key={story.id} href={`/stories/${story.id}`} className="block border-t border-ink/10 py-4">
                <h3 className="text-xl font-black text-ink">{story.title}</h3>
                <p className="text-ink/60">{story.description}</p>
              </Link>
            ))}
          </article>
          <article className="glass rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2 text-rose">
              <Users size={18} />
              <h2 className="text-2xl font-black text-ink">Book blog</h2>
            </div>
            {profile.posts.map((post: any) => (
              <Link key={post.id} href="/feed" className="block border-t border-ink/10 py-4">
                <h3 className="text-xl font-black text-ink">{post.title}</h3>
                <p className="text-ink/60">{post.book ? `About ${post.book.title}` : post.kind.replace("_", " ")}</p>
              </Link>
            ))}
          </article>
        </div>
      </section>
    </AppShell>
  );
}
