import { redirect } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StoryEditor } from "@/components/StoryEditor";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <StoryEditor />

        <aside className="grid h-fit gap-4">
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
