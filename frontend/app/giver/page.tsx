"use client";

import { useEffect, useMemo, useState } from "react";
import { createGiftFromDraft, maskContact, saveGift, type GiftDraft } from "@/lib/giftverse";

type StepId =
  | "recipient"
  | "gift"
  | "message"
  | "director"
  | "preflight"
  | "prompt"
  | "generate";

const steps: Array<{ id: StepId; title: string; subtitle: string }> = [
  { id: "recipient", title: "Recipient", subtitle: "Delivery identity" },
  { id: "gift", title: "Gift", subtitle: "Voucher + occasion" },
  { id: "message", title: "Message", subtitle: "1–2 lines" },
  { id: "director", title: "Director", subtitle: "Mood + intent" },
  { id: "preflight", title: "Preflight", subtitle: "Confirm 15s plan" },
  { id: "prompt", title: "Prompt", subtitle: "Review the final prompt" },
  { id: "generate", title: "Generate & send", subtitle: "Mock delivery" },
];

export default function GiverPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<GiftDraft>(() => ({
    generationMethod: "",
    imageCount: 0,
    recipientContact: "",
    recipientName: "",
    occasion: "",
    voucherBrand: "",
    voucherValue: "",
    message: "",
    mood: "",
    intent: "",
    detail: "",
    promptInput: "",
    promptFinal: "",
  }));

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [promptEdited, setPromptEdited] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdGiftId, setCreatedGiftId] = useState<string | null>(null);
  const [createdRedeemCode, setCreatedRedeemCode] = useState<string | null>(null);

  const step = steps[stepIndex] ?? steps[0];

  const errors = useMemo(() => validateDraft(draft, step.id), [draft, step.id]);

  const canGoNext = errors.length === 0 && !isGenerating;

  useEffect(() => {
    setDraft((prev) => ({ ...prev, imageCount: images.length }));
  }, [images.length]);

  useEffect(() => {
    const next = images.map((f) => URL.createObjectURL(f));
    setImageUrls(next);
    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  useEffect(() => {
    if (step.id !== "prompt") return;
    if (draft.promptFinal.trim()) return;
    if (promptEdited) return;
    setDraft((prev) => ({ ...prev, promptFinal: buildPrompt(prev, images.length) }));
  }, [draft.promptFinal, images.length, promptEdited, step.id]);

  function update<K extends keyof GiftDraft>(key: K, value: GiftDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function back() {
    setCreatedGiftId(null);
    setCreatedRedeemCode(null);
    setIsGenerating(false);
    setProgress(0);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }

  async function generateAndSend() {
    if (isGenerating) return;
    const allErrors = validateDraft(draft, "generate");
    if (allErrors.length > 0) return;

    setIsGenerating(true);
    setProgress(0);
    setCreatedGiftId(null);
    setCreatedRedeemCode(null);

    const start = Date.now();
    const durationMs = 2200;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / durationMs);
      setProgress(Math.round(p * 100));
      if (p < 1) {
        window.setTimeout(tick, 60);
      } else {
        const gift = createGiftFromDraft(draft);
        saveGift(gift);
        setCreatedGiftId(gift.id);
        setCreatedRedeemCode(gift.redeemCode);
        setIsGenerating(false);
      }
    };
    tick();
  }

  const shareUrl =
    typeof window !== "undefined" && createdGiftId
      ? `${window.location.origin}/gift/${createdGiftId}`
      : createdGiftId
        ? `/gift/${createdGiftId}`
        : null;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          MVP
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Create a GiftVerse</h1>
        <p className="text-sm text-zinc-300">
          Build the gift first. Generation and delivery are mocked for now.
        </p>
      </header>

      <div className="grid gap-4">
        <Stepper currentIndex={stepIndex} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold">{step.title}</div>
            <div className="text-sm text-zinc-300">{step.subtitle}</div>
          </div>

          <div className="mt-6">
            {step.id === "recipient" && (
              <div className="grid gap-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">Video generation method</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MethodCard
                        title="Text → video"
                        description="Generate from a structured prompt. Optionally add reference images."
                        selected={draft.generationMethod === "text"}
                        onSelect={() => update("generationMethod", "text")}
                      />
                      <MethodCard
                        title="Image → video"
                        description="Generate from uploaded images. Prompt is optional but recommended."
                        selected={draft.generationMethod === "image"}
                        onSelect={() => update("generationMethod", "image")}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold">
                        Upload images{" "}
                        {draft.generationMethod === "image" ? (
                          <span className="text-amber-200">*</span>
                        ) : null}
                      </div>
                      {images.length > 0 ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-zinc-300 hover:text-white"
                          onClick={() => setImages([])}
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-zinc-300">
                      {draft.generationMethod === "image"
                        ? "At least 1 image required."
                        : "Optional. If provided, the generator will use them as visual reference."}
                    </div>
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 hover:file:bg-zinc-200"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          setImages(files);
                        }}
                      />
                    </div>

                    {imageUrls.length > 0 ? (
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {imageUrls.map((u) => (
                          <div
                            key={u}
                            className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40"
                          >
                            <img src={u} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <Field label="Extra prompt (optional)">
                    <TextArea
                      value={draft.promptInput}
                      onChange={(v) => update("promptInput", v)}
                      placeholder="Optional extra guidance. Example: soft lighting, slow camera push, subtle film grain."
                    />
                  </Field>
                </div>

                <Field label="Recipient email or phone" required>
                  <Input
                    value={draft.recipientContact}
                    onChange={(v) => update("recipientContact", v)}
                    placeholder="e.g. alex@email.com or +1 555 123 4567"
                  />
                  <div className="mt-2 text-xs text-zinc-400">
                    Trust gate will show: {maskContact(draft.recipientContact || "****")}
                  </div>
                </Field>
                <Field label="Recipient name">
                  <Input
                    value={draft.recipientName}
                    onChange={(v) => update("recipientName", v)}
                    placeholder="Optional"
                  />
                </Field>
              </div>
            )}

            {step.id === "gift" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Voucher brand" required>
                  <Input
                    value={draft.voucherBrand}
                    onChange={(v) => update("voucherBrand", v)}
                    placeholder="e.g. Amazon"
                  />
                </Field>
                <Field label="Voucher value" required>
                  <Input
                    value={draft.voucherValue}
                    onChange={(v) => update("voucherValue", v)}
                    placeholder="e.g. $50"
                  />
                </Field>
                <Field label="Occasion" required>
                  <Select
                    value={draft.occasion}
                    onChange={(v) => update("occasion", v)}
                    options={["Birthday", "Anniversary", "Thank you", "Congrats", "Just because"]}
                    placeholder="Pick an occasion"
                  />
                </Field>
              </div>
            )}

            {step.id === "message" && (
              <div className="grid gap-4">
                <Field label="Short message" required>
                  <TextArea
                    value={draft.message}
                    onChange={(v) => update("message", v)}
                    placeholder="1–2 lines. This becomes the highlight around 9–13s."
                  />
                  <div className="mt-2 text-xs text-zinc-400">
                    {draft.message.trim().length}/180
                  </div>
                </Field>
              </div>
            )}

            {step.id === "director" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mood (required)" required>
                  <Select
                    value={draft.mood}
                    onChange={(v) => update("mood", v)}
                    options={["Warm cinematic", "Playful upbeat", "Elegant minimal", "Dreamy soft", "Bold energetic"]}
                    placeholder="Pick a mood"
                  />
                </Field>
                <Field label="Intent">
                  <Input
                    value={draft.intent}
                    onChange={(v) => update("intent", v)}
                    placeholder="e.g. Make them feel celebrated"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Extra detail">
                    <TextArea
                      value={draft.detail}
                      onChange={(v) => update("detail", v)}
                      placeholder="Optional. One specific detail that makes it personal."
                    />
                  </Field>
                </div>
              </div>
            )}

            {step.id === "preflight" && (
              <div className="grid gap-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold">15s structure</div>
                  <div className="mt-2 grid gap-2 text-sm text-zinc-300">
                    <Row label="Trust gate shows">{maskContact(draft.recipientContact)}</Row>
                    <Row label="Voucher">{formatGift(draft)}</Row>
                    <Row label="Method">
                      {draft.generationMethod === "text"
                        ? "Text → video"
                        : draft.generationMethod === "image"
                          ? "Image → video"
                          : "—"}
                    </Row>
                    <Row label="Images">{draft.imageCount > 0 ? `${draft.imageCount}` : "0"}</Row>
                    <Row label="Mood / Intent">
                      {draft.mood || "—"} {draft.intent ? `• ${draft.intent}` : ""}
                    </Row>
                    <Row label="Timeline">
                      <span className="text-zinc-200">0–13s</span> content •{" "}
                      <span className="text-zinc-200">13–15s</span> closing •{" "}
                      <span className="text-zinc-200">after video</span> redeem code
                    </Row>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-sm font-semibold">Message highlight (9–13s)</div>
                  <div className="mt-2 text-sm text-zinc-200">{draft.message || "—"}</div>
                </div>
              </div>
            )}

            {step.id === "prompt" && (
              <div className="grid gap-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold">Final prompt</div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50"
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, promptFinal: buildPrompt(prev, images.length) }));
                        setPromptEdited(false);
                      }}
                      disabled={isGenerating}
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-zinc-300">
                    Review and edit the exact prompt used for video generation.
                  </div>
                  <div className="mt-4">
                    <TextArea
                      value={draft.promptFinal}
                      onChange={(v) => {
                        update("promptFinal", v);
                        setPromptEdited(true);
                      }}
                      placeholder="Final prompt will appear here."
                    />
                    <div className="mt-2 text-xs text-zinc-400">
                      {draft.promptFinal.trim().length} chars • {draft.imageCount} image(s)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step.id === "generate" && (
              <div className="grid gap-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold">Generate video</div>
                    <div className="text-xs text-zinc-400">Target: 15–60s</div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">
                    {draft.generationMethod === "image" ? "Image → video" : "Text → video"} •{" "}
                    {draft.imageCount} image(s)
                  </div>
                  <div className="mt-3">
                    <Progress value={isGenerating ? progress : createdGiftId ? 100 : 0} />
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">
                    {isGenerating
                      ? "Generating…"
                      : createdGiftId
                        ? "Ready"
                        : "Not started"}
                  </div>
                </div>

                {createdGiftId && createdRedeemCode && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-sm font-semibold">Send link (mock)</div>
                    <div className="mt-2 grid gap-2 text-sm text-zinc-300">
                      <Row label="To">{maskContact(draft.recipientContact)}</Row>
                      <Row label="Redeem code">{createdRedeemCode}</Row>
                      <Row label="Gift link">
                        <span className="break-all text-zinc-200">{shareUrl}</span>
                      </Row>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                        onClick={async () => {
                          if (!shareUrl) return;
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                          } catch {
                            window.prompt("Copy this link:", shareUrl);
                          }
                        }}
                      >
                        Copy link
                      </button>
                      <a
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
                        href={createdGiftId ? `/gift/${createdGiftId}` : "/gift/demo"}
                      >
                        Open receiver view
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              <div className="font-semibold">Fix before continuing</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
              onClick={back}
              disabled={stepIndex === 0 || isGenerating}
            >
              Back
            </button>

            {step.id === "generate" ? (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
                onClick={generateAndSend}
                disabled={isGenerating || createdGiftId !== null || validateDraft(draft, "generate").length > 0}
              >
                {isGenerating ? `Generating ${progress}%` : createdGiftId ? "Generated" : "Generate & send"}
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
                onClick={next}
                disabled={!canGoNext}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function validateDraft(draft: GiftDraft, step: StepId): string[] {
  const out: string[] = [];

  if (
    step === "recipient" ||
    step === "gift" ||
    step === "message" ||
    step === "director" ||
    step === "preflight" ||
    step === "prompt" ||
    step === "generate"
  ) {
    if (!draft.generationMethod) out.push("Select a generation method.");
    if (draft.generationMethod === "image" && draft.imageCount < 1) {
      out.push("Upload at least 1 image for Image → video.");
    }
  }

  if (step === "recipient" || step === "preflight" || step === "prompt" || step === "generate") {
    if (!draft.recipientContact.trim()) out.push("Recipient email/phone is required.");
  }

  if (step === "gift" || step === "preflight" || step === "prompt" || step === "generate") {
    if (!draft.voucherBrand.trim()) out.push("Voucher brand is required.");
    if (!draft.voucherValue.trim()) out.push("Voucher value is required.");
    if (!draft.occasion.trim()) out.push("Occasion is required.");
  }

  if (step === "message" || step === "preflight" || step === "prompt" || step === "generate") {
    const msg = draft.message.trim();
    if (!msg) out.push("Message is required.");
    if (msg.length > 180) out.push("Message must be 180 characters or less.");
  }

  if (step === "director" || step === "preflight" || step === "prompt" || step === "generate") {
    if (!draft.mood.trim()) out.push("Mood is required.");
  }

  if (step === "prompt" || step === "generate") {
    if (!draft.promptFinal.trim()) out.push("Final prompt is required.");
  }

  return out;
}

function formatGift(draft: GiftDraft): string {
  const parts = [draft.voucherBrand, draft.voucherValue].filter(Boolean);
  const core = parts.join(" • ");
  return `${core || "—"}${draft.occasion ? ` • ${draft.occasion}` : ""}`;
}

function buildPrompt(draft: GiftDraft, imageCount: number): string {
  const toLine = draft.recipientName.trim()
    ? `To ${draft.recipientName.trim()}`
    : `To ${maskContact(draft.recipientContact)}`;
  const occasion = draft.occasion.trim();
  const voucher = [draft.voucherBrand.trim(), draft.voucherValue.trim()].filter(Boolean).join(" • ");
  const mood = draft.mood.trim();
  const intent = draft.intent.trim();
  const detail = draft.detail.trim();
  const extraPrompt = draft.promptInput.trim();

  const intro = [
    "Create a 15s vertical cinematic gift video.",
    "",
    "Structure:",
    `- 0–2s: Title card (${toLine}${occasion ? ` • ${occasion}` : ""})`,
    `- 2–9s: Mood sequence (${mood || "mood-driven"})`,
    `- 9–13s: Message highlight (${draft.message.trim() || "short message"})`,
    "- 13–15s: Clean closing (no QR inside the video)",
    "- After video: show redeem QR/code screen (high contrast, scan-friendly)",
  ].join("\n");

  const contextParts = [
    voucher ? `Voucher: ${voucher}` : "",
    occasion ? `Occasion: ${occasion}` : "",
    intent ? `Intent: ${intent}` : "",
    detail ? `Personal detail: ${detail}` : "",
  ].filter(Boolean);

  const visualParts = [
    draft.generationMethod === "image"
      ? `Use the uploaded images as the primary visual source (${imageCount} image${imageCount === 1 ? "" : "s"}).`
      : imageCount > 0
        ? `Use the uploaded images as visual reference (${imageCount} image${imageCount === 1 ? "" : "s"}).`
        : "No images provided; generate visuals purely from the prompt.",
    extraPrompt ? `Extra prompt: ${extraPrompt}` : "",
  ].filter(Boolean);

  const constraints = [
    "Constraints:",
    "- Keep typography readable (mobile-first).",
    "- Avoid cringe / overly sentimental tone.",
    "- Maintain clean transitions into the end-card.",
  ].join("\n");

  const blocks = [intro];
  if (contextParts.length > 0) blocks.push(["", "Context:", ...contextParts.map((p) => `- ${p}`)].join("\n"));
  if (visualParts.length > 0) blocks.push(["", "Visual direction:", ...visualParts.map((p) => `- ${p}`)].join("\n"));
  blocks.push(["", constraints].join("\n"));

  return blocks.join("\n");
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              i === currentIndex
                ? "border-white/20 bg-white/10 text-white"
                : i < currentIndex
                  ? "border-white/10 bg-white/5 text-zinc-200"
                  : "border-white/10 bg-black/20 text-zinc-400",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex size-5 items-center justify-center rounded-full text-[11px]",
                i <= currentIndex ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300",
              ].join(" ")}
            >
              {i + 1}
            </span>
            {s.title}
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "rounded-2xl border p-4 text-left transition-colors",
        selected
          ? "border-white/20 bg-white/10"
          : "border-white/10 bg-black/20 hover:bg-white/5",
      ].join(" ")}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-zinc-300">{description}</div>
    </button>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold">
          {label} {required ? <span className="text-amber-200">*</span> : null}
        </div>
      </div>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      className={[
        "h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm focus:border-white/20 focus:outline-none",
        value ? "text-white" : "text-zinc-500",
      ].join(" ")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="text-zinc-950">
          {opt}
        </option>
      ))}
    </select>
  );
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-zinc-400">{label}</div>
      <div>{children}</div>
    </div>
  );
}
