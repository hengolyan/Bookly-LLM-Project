import { redirect } from "next/navigation";

export default function LegacyGoogleBookPage({ params }: { params: { id: string } }) {
  redirect(`/books/external/google_books/${encodeURIComponent(params.id)}`);
}
