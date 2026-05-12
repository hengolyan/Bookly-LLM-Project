import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Feather, ImageIcon, Plus, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StoryEditor } from "@/components/StoryEditor";
import { getCurrentUser } from "@/lib/auth";
import { logServerError } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WritePage({
  searchParams
}: {
  searchParams?: { storyId?: string; new?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const selectedStoryId = searchParams?.storyId;
  const wantsNew = searchParams?.new === "1";
  let stories: any[] = [];
  let selectedStory: any = null;
  let databaseError = "";

  try {
    stories = await prisma.story.findMany({
      where: { authorId: user.id },
      include: {
        chapters: { select: { id: true, number: true, title: true }, orderBy: { number: "asc" } },
        aiAnalysis: true
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });

    selectedStory = selectedStoryId
      ? stories.find((story) => story.id === selectedStoryId) ??
        (await prisma.story.findFirst({
          where: { id: selectedStoryId, authorId: user.id },
          include: { chapters: { select: { id: true, number: true, title: true }, orderBy: { number: "asc" } } }
        }))
      : null;
  } catch (error) {
    logServerError("write", error);
    databaseError = "Could not load your writing desk. Check the database connection and try again.";
  }

  if (databaseError) {
    return (
      <AppShell>
        <EmptyState title="Writing desk is temporarily unavailable" body={databaseError} actionHref="/" actionLabel="Back Home" />
      </AppShell>
    );
  }

  if (!wantsNew && !selectedStoryId) {
    return (
      <AppShell>
        <section className="grid gap-6">
          <div className="glass rounded-lg p-6">
            <p className="font-ui text-xs font-black uppercase tracking-[0.22em] text-moss">Writing desk</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-ink">Your BOOKLY stories</h1>
                <p className="mt-2 text-ink/64">Continue a draft, manage chapters, or begin a new book.</p>
              </div>
              <Link href="/write?new=1" className="font-ui inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 font-black text-parchment">
                <Plus size={18} />
                Start New Book
              </Link>
            </div>
          </div>

          {!stories.length ? (
            <EmptyState title="No stories yet" body="Start your first BOOKLY book, add a cover, and save it as a draft before publishing." actionHref="/write?new=1" actionLabel="Start New Book" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stories.map((story) => (
                <article key={story.id} className="glass overflow-hidden rounded-lg">
                  {story.coverUrl ? (
                    <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${story.coverUrl})` }} />
                  ) : (
                    <div className="grid h-44 place-items-center bg-ink/10 text-ink/40">
                      <ImageIcon size={44} />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="font-ui mb-3 flex items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.14em]">
                      <span className={story.status === "PUBLISHED" ? "text-moss" : "text-rose"}>{story.status === "PUBLISHED" ? "Published" : "Draft"}</span>
                      <span className="text-ink/48">{story.chapters.length} chapters</span>
                    </div>
                    <h2 className="text-2xl font-black text-ink">{story.title}</h2>
                    <p className="font-ui mt-3 line-clamp-3 text-sm leading-6 text-ink/65">{story.aiAnalysis?.summary ?? story.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href={`/write?storyId=${story.id}`} className="font-ui inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-black text-parchment">
                        <Feather size={15} />
                        Continue
                      </Link>
                      {story.status === "PUBLISHED" ? (
                        <Link href={`/stories/${story.id}`} className="font-ui inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white/60 px-3 py-2 text-sm font-black text-ink">
                          <BookOpen size={15} />
                          Read
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <StoryEditor story={selectedStory} />

        <aside className="grid h-fit gap-4">
          <Link href="/write" className="font-ui rounded-md border border-ink/10 bg-white/60 px-4 py-3 text-center font-black text-ink">
            Back to my stories
          </Link>
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
            {["Description", "At least one chapter", "Genre analysis", "Author profile"].map((item) => (
              <div key={item} className="font-ui mt-3 flex items-center gap-2 text-sm font-bold text-ink/70">
                <span className="h-2 w-2 rounded-full bg-moss" />
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
