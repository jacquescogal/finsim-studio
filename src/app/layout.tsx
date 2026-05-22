import type { Metadata, Route } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Storyboards",
  description: "Facilitator-led financial literacy scenarios"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-background">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold">Financial Storyboards</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/">Library</Link>
              <Link href={"/studio" as Route}>Studio</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
