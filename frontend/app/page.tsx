"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Video, Shield, Film, Gift } from "lucide-react";

const features = [
  {
    title: "Personalized 15s videos",
    description: "Create cinematic, mood-driven videos that make your gift feel truly special.",
    icon: Video,
  },
  {
    title: "Trust-first experience",
    description: "Recipients confirm their identity before accessing the gift, preventing accidental opens.",
    icon: Shield,
  },
  {
    title: "Director control",
    description: "Choose the mood, intent, and style—no need to write complicated prompts.",
    icon: Film,
  },
  {
    title: "Clear redeem path",
    description: "QR and redeem code appear right after the video—no confusion, no friction.",
    icon: Gift,
  },
];

const steps = [
  {
    step: "01",
    title: "Choose method & recipient",
    description: "Pick between text-to-video or image-to-video, then enter who you're sending to.",
  },
  {
    step: "02",
    title: "Pick gift & occasion",
    description: "Select your voucher brand and the occasion to set the perfect tone.",
  },
  {
    step: "03",
    title: "Write your message",
    description: "Add a short, personal note that becomes the heart of the video.",
  },
  {
    step: "04",
    title: "Set the mood & generate",
    description: "Choose a mood, review the prompt, and send your gift in seconds.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const createHref = user ? "/giver" : "/signin";

  return (
    <div className="grid gap-16">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border/50 bg-card/40 p-8 md:p-12 backdrop-blur">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-muted-foreground">
            New • GIFTVerse MVP
          </div>
          <h1 className="mt-6 text-balance text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
            Send a gift voucher with a <span className="text-giftverse-gradient">personalized 15s video</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Turn ordinary gift cards into unforgettable moments. GIFTVerse helps you create cinematic, mood-driven
            videos that make your gift feel truly special—with a trust-first experience for recipients.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl bg-giftverse-gradient px-6 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              href={createHref}
            >
              Start creating
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border/60 bg-background/30 px-6 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
              href="/gift/demo"
            >
              View receiver demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="mb-8 grid gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Why GIFTVerse?</h2>
          <p className="text-muted-foreground">
            Everything you need to make gift-giving feel more personal and thoughtful.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur"
            >
              <div className="text-giftverse-gradient">
                <feature.icon className="size-9" />
              </div>
              <div className="mt-4 text-lg font-semibold">{feature.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="flow">
        <div className="mb-8 grid gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="text-muted-foreground">
            A simple, 4-step process to create and send your personalized gift video.
          </p>
        </div>
        <div className="grid gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur flex gap-4 items-start"
            >
              <div className="text-2xl font-bold text-giftverse-gradient min-w-[40px]">{step.step}</div>
              <div className="grid gap-1">
                <div className="text-lg font-semibold">{step.title}</div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

       
    </div>
  );
}
