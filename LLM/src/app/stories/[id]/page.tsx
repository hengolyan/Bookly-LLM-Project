import { notFound } from "next/navigation";
import { Bookmark, MessageCircle, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { databaseUnavailableMessage, logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StoryReaderPage({ params }: { params: { id: string } }) {
  let story: any = null;
  let databaseError = "";

  try {
    story = await prisma.story.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { displayName: true, username: true } },
        chapters: { orderBy: { number: "asc" } },
        comments: { include: { author: { select: { displayName: true, username: true } } }, orderBy: { createdAt: "desc" } },
        aiAnalysis: true
      }
    });
  } catch (error) {
    logServerError("storyReader", error);
    databaseError = databaseUnavailableMessage();
  }

  if (databaseError) {
    return (
      <AppShell>
        <EmptyState title="Story is temporarily unavailable" body={databaseError} actionHref="/discover" actionLabel="Back To Discover" />
      </AppShell>
    );
  }

  if (!story) notFound();
  const chapter = story.chapters[0];

  return (
    <AppShell>
      <article className="glass rounded-lg p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <p className="font-ui text-sm font-bold uppercase text-moss">Chapter {chapter?.number ?? 1}</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-ink">{chapter?.title ?? story.title}</h1>
          <p className="mt-2 text-ink/60">
            from {story.title} by {story.author.displayName}
          </p>
          <div className="mt-5 flex gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/60" title="Bookmark">
              <Bookmark size={18} />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white/60" title="Comments">
              <MessageCircle size={18} />
            </button>
            <button className="font-ui flex h-10 items-center gap-1 rounded-md border border-ink/10 bg-white/60 px-3 text-sm font-bold" title="Rating">
              <Star size={16} fill="currentColor" />
              {story.averageRating.toFixed(1)}
            </button>
          </div>
          <div className="mt-8 space-y-6 text-xl leading-9 text-ink/78">
            {(chapter?.body ?? story.description).split("\n").filter(Boolean).map((paragraph: string, index: number) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {story.aiAnalysis ? (
            <div className="mt-8 rounded-md bg-white/45 p-4">
              <p className="font-ui text-xs font-bold uppercase text-moss">AI summary</p>
              <p className="mt-2 text-ink/68">{story.aiAnalysis.summary}</p>
            </div>
          ) : null}
        </div>
      </article>
    </AppShell>
  );
}
