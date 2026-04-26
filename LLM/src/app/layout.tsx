import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOOKLY",
  description: "A magical reading, writing, and book recommendation platform."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
