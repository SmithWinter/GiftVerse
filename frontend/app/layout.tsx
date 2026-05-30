import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GiftVerse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50 antialiased">
        <div className="min-h-dvh">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/60 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <a href="/" className="text-sm font-semibold tracking-tight">
                GiftVerse
              </a>
              <nav className="flex items-center gap-3 text-sm text-zinc-300">
                <a href="/giver" className="hover:text-white">
                  Create
                </a>
                <a href="/gift/demo" className="hover:text-white">
                  Receiver demo
                </a>
              </nav>
            </div>
          </header>
          <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
