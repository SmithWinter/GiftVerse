"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function Home() {
  const { user } = useAuth();
  const createHref = user ? "/giver" : "/signin";

  return (
    <div className="grid gap-10" id="flow">
      <section className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur">
        <div className="max-w-2xl">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-giftverse-gradient">
            Send a gift voucher with a 15s personalized video
          </h1>
          <p className="mt-3 text-muted-foreground">
            MVP flow: Create → Generate → Send. Receiver gets a trust gate, a
            user-gesture "Open gift", then a 15s experience. The redeem code
            shows after the video finishes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl bg-giftverse-gradient px-4 text-sm font-semibold text-white hover:opacity-90"
              href="/giver"
            >
              Start creating
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border/60 bg-background/30 px-4 text-sm font-semibold text-foreground hover:bg-muted/40"
              href="/gift/demo"
            >
              View receiver demo
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border/60 bg-background/30 px-4 text-sm font-semibold text-foreground hover:bg-muted/40"
              href="/how-to-use"
            >
              How to use
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur">
          <div className="text-sm font-semibold text-giftverse-gradient">Giver flow</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Recipient → Gift selection → Message → Director mode → Preflight →
            Prompt review → Generate & send.
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur">
          <div className="text-sm font-semibold text-giftverse-gradient">Receiver flow</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Trust gate → Open gift → Watch 15s → Redeem code screen.
          </div>
        </div>
      </section>
    </div>
  );
}
