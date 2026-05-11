import { runDiagnostics } from "@/lib/runtime-diagnostics";

export const dynamic = "force-dynamic";

function badge(status: string) {
  if (status === "pass") return "bg-moss text-white";
  if (status === "warn") return "bg-gold text-ink";
  return "bg-rose text-white";
}

export default async function DiagnosticsPage() {
  const diagnostics = await runDiagnostics();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="glass rounded-lg p-6">
        <p className="font-ui text-sm font-bold uppercase tracking-[0.25em] text-gold">BOOKLY runtime</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Diagnostics</h1>
        <p className="mt-3 text-ink/68">
          This page checks the deployed environment without showing secret values. Failed rows include sanitized real error details.
        </p>
        <div className="mt-5 rounded-md border border-ink/10 bg-white/55 p-4">
          <p className="font-ui text-sm font-bold text-ink/64">Checked at</p>
          <p className="font-ui break-words text-sm text-ink">{diagnostics.checkedAt}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        {diagnostics.checks.map((check) => (
          <article key={check.name} className="glass flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-ui text-lg font-black text-ink">{check.name}</h2>
              <p className="mt-1 break-words text-sm text-ink/70">{check.message}</p>
            </div>
            <span className={`font-ui w-fit rounded-md px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${badge(check.status)}`}>
              {check.status}
            </span>
          </article>
        ))}
      </section>
    </main>
  );
}
