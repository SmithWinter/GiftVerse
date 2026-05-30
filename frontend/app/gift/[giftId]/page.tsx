"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { demoGift, loadGift, maskContact, type Gift } from "@/lib/giftverse";

type Screen = "trust" | "not-you" | "open" | "watch" | "post";

export default function GiftReceiverPage() {
  const params = useParams<{ giftId: string }>();
  const giftId = typeof params?.giftId === "string" ? params.giftId : "";

  const [gift, setGift] = useState<Gift | null>(null);
  const [screen, setScreen] = useState<Screen>("trust");

  useEffect(() => {
    if (!giftId) return;
    if (giftId === "demo") {
      setGift(demoGift());
      return;
    }
    const loaded = loadGift(giftId);
    setGift(loaded ?? demoGift());
  }, [giftId]);

  const masked = useMemo(
    () => maskContact(gift?.recipientContact ?? ""),
    [gift?.recipientContact],
  );

  if (!gift) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm text-zinc-300">Loading…</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Receiver
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">You received a gift</h1>
        <div className="text-sm text-zinc-300">
          Gift for <span className="text-white">{masked}</span>
        </div>
      </header>

      {screen === "trust" && (
        <Card>
          <div className="text-sm font-semibold">Trust gate</div>
          <div className="mt-2 text-sm text-zinc-300">
            This gift was sent to <span className="text-white">{masked}</span>. Is that you?
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              onClick={() => setScreen("open")}
            >
              Yes, that’s me
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => setScreen("not-you")}
            >
              Not me
            </button>
          </div>
        </Card>
      )}

      {screen === "not-you" && (
        <Card>
          <div className="text-sm font-semibold">Protected</div>
          <div className="mt-2 text-sm text-zinc-300">
            For your safety, we can’t show the video or redeem QR unless you confirm you’re the intended recipient.
          </div>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              onClick={() => setScreen("trust")}
            >
              Back to trust gate
            </button>
          </div>
        </Card>
      )}

      {screen === "open" && (
        <div className="grid gap-4">
          <Card>
            <div className="text-sm font-semibold">Gift preview</div>
            <div className="mt-3 grid gap-2 text-sm text-zinc-300">
              <Row label="Occasion">{gift.occasion || "—"}</Row>
              <Row label="Voucher">{formatGift(gift)}</Row>
              <Row label="Mood">{gift.mood || "—"}</Row>
              <Row label="Message">
                <span className="text-white">{gift.message || "—"}</span>
              </Row>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Open gift</div>
            <div className="mt-2 text-sm text-zinc-300">
              Tap to start the 15s video. The redeem QR will appear after the video finishes.
            </div>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                onClick={() => {
                  setScreen("watch");
                }}
              >
                Open gift
              </button>
            </div>
          </Card>
        </div>
      )}

      {screen === "watch" && (
        <VideoStage
          gift={gift}
          initialMs={0}
          onDone={() => setScreen("post")}
          onExit={() => setScreen("open")}
        />
      )}

      {screen === "post" && (
        <div className="grid gap-4">
          <Card>
            <div className="text-sm font-semibold">Redeem</div>
            <div className="mt-2 text-sm text-zinc-300">
              Scan the QR or use the code below.
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <QrCard code={gift.redeemCode} />
              <div className="grid gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(gift.redeemCode);
                    } catch {
                      window.prompt("Copy this code:", gift.redeemCode);
                    }
                  }}
                >
                  Copy redeem code
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    setScreen("watch");
                  }}
                >
                  Replay full video
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => window.alert("Thanks sent (mock).")}
                >
                  Send thank you (mock)
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Back</div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                href="/giver"
              >
                Create your own
              </a>
              <a
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                href="/"
              >
                Home
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function VideoStage({
  gift,
  initialMs,
  onDone,
  onExit,
}: {
  gift: Gift;
  initialMs: number;
  onDone: () => void;
  onExit: () => void;
}) {
  const durationMs = 15_000;
  const [ms, setMs] = useState(() => clamp(initialMs, 0, durationMs));
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    setMs(clamp(initialMs, 0, durationMs));
    setPlaying(true);
  }, [initialMs]);

  useEffect(() => {
    if (!playing) return;
    const startedAt = Date.now() - ms;
    const id = window.setInterval(() => {
      const nextMs = Date.now() - startedAt;
      if (nextMs >= durationMs) {
        setMs(durationMs);
        setPlaying(false);
        window.clearInterval(id);
        onDone();
        return;
      }
      setMs(nextMs);
    }, 50);
    return () => window.clearInterval(id);
  }, [ms, onDone, playing]);

  const segment = getSegment(ms);

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold">15s video</div>
          <div className="text-xs text-zinc-400">{formatTime(ms)} / 15s</div>
        </div>
        <div className="mt-3">
          <Progress value={(ms / durationMs) * 100} />
        </div>
      </Card>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-black/40">
        <div className="grid min-h-[440px] content-between p-6 sm:min-h-[520px]">
          <div className="grid gap-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {segment.label}
            </div>
            <div className="text-2xl font-semibold tracking-tight">{segment.title}</div>
            {segment.subtitle ? <div className="text-sm text-zinc-300">{segment.subtitle}</div> : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200">
            <div className="grid gap-1">
              <div className="text-xs text-zinc-400">Message highlight</div>
              <div className="text-white">{gift.message}</div>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
            onClick={onExit}
          >
            Exit
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
            onClick={() => {
              setMs(0);
              setPlaying(true);
            }}
          >
            Restart
          </button>
        </div>
      </Card>
    </div>
  );
}

function getSegment(ms: number): { label: string; title: string; subtitle: string } {
  if (ms < 2_000) return { label: "0–2s", title: "To you", subtitle: "A small cinematic intro" };
  if (ms < 9_000) return { label: "2–9s", title: "Mood sequence", subtitle: "Visual rhythm matches the mood" };
  if (ms < 13_000) return { label: "9–13s", title: "Message highlight", subtitle: "Short, meaningful, readable" };
  return { label: "13–15s", title: "Closing", subtitle: "A clean ending before redeem" };
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-white transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const tenth = Math.floor((ms % 1000) / 100);
  return `${seconds}.${tenth}s`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-6">{children}</div>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-zinc-400">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function formatGift(gift: Gift): string {
  const parts = [gift.voucherBrand, gift.voucherValue].filter(Boolean);
  return parts.join(" • ") || "—";
}

function QrCard({ code }: { code: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        QR
      </div>
      <div className="mt-3 flex items-center justify-center">
        <Qr code={code} />
      </div>
      <div className="mt-4 text-center font-mono text-sm text-white">{code}</div>
    </div>
  );
}

function Qr({ code }: { code: string }) {
  const cells = useMemo(() => makePseudoQr(code), [code]);
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(21, 8px)" }}>
        {cells.map((on, i) => (
          <div
            key={i}
            className={on ? "size-[8px] bg-zinc-950" : "size-[8px] bg-white"}
          />
        ))}
      </div>
    </div>
  );
}

function makePseudoQr(input: string): boolean[] {
  const size = 21;
  const total = size * size;
  const out = new Array<boolean>(total);
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < total; i += 1) {
    h ^= i + 0x9e3779b9;
    h = Math.imul(h, 2654435761);
    const bit = (h >>> 0) % 7;
    out[i] = bit <= 2;
  }
  addFinder(out, size, 0, 0);
  addFinder(out, size, size - 7, 0);
  addFinder(out, size, 0, size - 7);
  return out;
}

function addFinder(grid: boolean[], size: number, x0: number, y0: number) {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const xx = x0 + x;
      const yy = y0 + y;
      const idx = yy * size + xx;
      const border = x === 0 || y === 0 || x === 6 || y === 6;
      const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      grid[idx] = border || inner;
    }
  }
}
