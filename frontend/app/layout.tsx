import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { CardNavbar } from "@/components/CardNavbar";
import { Providers } from "@/components/Providers";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "GiftVerse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Providers>
          <div className="min-h-dvh">
            <GalaxyBackground />
            <CardNavbar />
            <div className="mx-auto max-w-5xl px-4 pb-10 pt-20">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
