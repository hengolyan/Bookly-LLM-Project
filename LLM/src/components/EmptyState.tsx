import Link from "next/link";

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="glass rounded-lg p-6">
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      <p className="mt-2 text-ink/68">{body}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="font-ui mt-4 inline-flex rounded-md bg-ink px-4 py-3 font-bold text-parchment">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
