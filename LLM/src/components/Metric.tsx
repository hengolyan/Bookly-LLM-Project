export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white/50 p-3">
      <div className="font-ui text-xs font-semibold uppercase text-ink/50">{label}</div>
      <div className="text-2xl font-black text-ink">{value}</div>
    </div>
  );
}
