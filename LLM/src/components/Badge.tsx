const labels: Record<string, string> = {
  READER_WRITER: "Reader-writer",
  VERIFIED_AUTHOR: "Verified author",
  PUBLISHER: "Publisher",
  INDEPENDENT_AUTHOR: "Indie author",
  MODERATOR: "Moderator",
  ADMIN: "Admin"
};

export function Badge({ kind }: { kind: string }) {
  return (
    <span className="font-ui rounded bg-gold/20 px-2 py-1 text-xs font-bold text-ink">
      {labels[kind] ?? kind}
    </span>
  );
}
