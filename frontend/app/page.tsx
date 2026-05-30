export default function Home() {
  return (
    <div className="grid gap-10">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="max-w-2xl">
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight">
            Send a gift voucher with a 15s personalized video
          </h1>
          <p className="mt-3 text-zinc-300">
            MVP flow: Create → Generate → Send. Receiver gets a trust gate, a
            user-gesture “Open gift”, then a 15s experience. The redeem code
            shows after the video finishes.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              href="/giver"
            >
              Start creating
            </a>
            <a
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
              href="/gift/demo"
            >
              View receiver demo
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold">Giver flow</div>
          <div className="mt-2 text-sm text-zinc-300">
            Recipient → Gift selection → Message → Director mode → Preflight →
            Prompt review → Generate & send.
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold">Receiver flow</div>
          <div className="mt-2 text-sm text-zinc-300">
            Trust gate → Open gift → Watch 15s → Redeem code screen.
          </div>
        </div>
      </section>
    </div>
  );
}
