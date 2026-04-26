import { BookMarked, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { currentRead, recommendations } from "@/lib/demo-data";

export default function LibraryPage() {
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-black text-ink">My Library</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[currentRead, ...recommendations.map((item) => ({ ...item, progress: 0, chapter: 1, cover: currentRead.cover }))].map((item) => (
            <article key={item.title} className="glass rounded-lg p-4">
              <div className="flex gap-4">
                <img src={item.cover} alt="" className="h-32 w-24 rounded-md object-cover" />
                <div>
                  <BookMarked className="mb-2 text-moss" size={20} />
                  <h2 className="text-xl font-black text-ink">{item.title}</h2>
                  <p className="text-ink/58">{item.author}</p>
                  <div className="mt-3 flex items-center gap-1 text-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} fill="currentColor" />
                    ))}
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
