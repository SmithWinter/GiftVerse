"use client";

import { useEffect, useMemo, useState } from "react";
import { createGiftFromDraft, maskContact, saveGift, type GiftDraft, type Gift } from "@/lib/giftverse";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { createVideoJob, getVideoJob, uploadToCloudinary } from "@/lib/api";

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
  { id: "generate", title: "Generate & send", subtitle: "Create video" },
];

const HARDCODED_OCCASIONS = ["Birthday", "Anniversary", "Thank you", "Congrats", "Just because"];

type VideoJob = {
  id: string;
  status: "QUEUED" | "GENERATING" | "UPLOADING" | "SUCCEEDED" | "FAILED" | string;
  progress: number;
  outputUrl?: string;
  error?: string;
};

type GiftFromApi = {
  id: number;
  brand: string;
  value: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function GiverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stepIndex, setStepIndex] = useState(0);
  const [gifts, setGifts] = useState<GiftFromApi[]>([]);
  const [giftsLoading, setGiftsLoading] = useState<boolean>(true);
  const [draft, setDraft] = useState<GiftDraft>(() => ({
    generationMethod: "",
    imageCount: 0,
    recipientContact: "",
    recipientName: "",
    occasion: "",
    giftId: "",
    message: "",
    mood: "",
    intent: "",
    detail: "",
    promptInput: "",
    promptFinal: "",
  }));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gifts`);
        const data = await response.json();
        const giftsWithNumbers = Array.isArray(data) ? data.map((g: any) => ({
          ...g,
          value: typeof g.value === 'string' ? parseFloat(g.value) : g.value,
        })) : [];
        setGifts(giftsWithNumbers);
      } catch (error) {
        console.error("Failed to fetch gifts:", error);
      } finally {
        setGiftsLoading(false);
      }
    };
    fetchGifts();
  }, []);

  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [cloudinaryUrls, setCloudinaryUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [promptEdited, setPromptEdited] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdGiftId, setCreatedGiftId] = useState<string | null>(null);
  const [createdRedeemCode, setCreatedRedeemCode] = useState<string | null>(null);
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const step = steps[stepIndex] ?? steps[0];

  const errors = useMemo(() => validateDraft(draft, step.id), [draft, step.id]);

  const canGoNext = errors.length === 0 && !isGenerating && !uploadingImages;

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
    const uploadImages = async () => {
      if (images.length === 0) {
        setCloudinaryUrls([]);
        return;
      }

      setUploadingImages(true);
      try {
        const urls = await Promise.all(
          images.map((file) => uploadToCloudinary(file))
        );
        setCloudinaryUrls(urls);
      } catch (error) {
        console.error("Failed to upload images:", error);
        alert("Không thể upload ảnh. Vui lòng thử lại.");
      } finally {
        setUploadingImages(false);
      }
    };

    uploadImages();
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
    if (isGenerating || uploadingImages) return;
    const allErrors = validateDraft(draft, "generate");
    if (allErrors.length > 0) return;
    if (images.length > 0 && cloudinaryUrls.length !== images.length) {
      alert("Vui lòng đợi upload ảnh hoàn tất");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCreatedGiftId(null);
    setCreatedRedeemCode(null);
    setVideoJob(null);
    setVideoUrl(null);

    try {
      // Step 1: Create video job
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: draft.promptFinal,
          userId: user?.id,
          ratio: '9:16',
          durationSeconds: 15,
          imageUrl: cloudinaryUrls.length > 0 ? cloudinaryUrls[0] : undefined,
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(errorText || 'Failed to create video job');
      }

      const { jobId, status } = await createResponse.json();
      
      // Step 2: Poll for job status
      let currentJob: VideoJob | null = { id: jobId, status, progress: 0 };
      setVideoJob(currentJob);

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video-processor/${jobId}`);
          if (!statusResponse.ok) {
            throw new Error('Failed to check job status');
          }

          currentJob = await statusResponse.json();
          setVideoJob(currentJob);
          setProgress(currentJob.progress || 0);

          if (currentJob.status === 'SUCCEEDED') {
            clearInterval(pollInterval);
            const finalVideoUrl = currentJob.outputUrl || currentJob.downloadUrl;
            if (finalVideoUrl) {
              setVideoUrl(finalVideoUrl);
            }
            const gift = createGiftFromDraft(draft, finalVideoUrl);
            saveGift(gift);
            setCreatedGiftId(gift.id);
            setCreatedRedeemCode(gift.redeemCode);
            setIsGenerating(false);
          } else if (currentJob.status === 'FAILED') {
            clearInterval(pollInterval);
            throw new Error(currentJob.error || 'Video generation failed');
          }
        } catch (err) {
          clearInterval(pollInterval);
          console.error(err);
        }
      }, 3000); // Poll mỗi 3 giây để giảm tải server

    } catch (error) {
      console.error('Error generating video:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
      setIsGenerating(false);
    }
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
        <p className="text-sm text-muted-foreground">
          Build the gift first. Generation and delivery are mocked for now.
        </p>
      </header>

      <div className="grid gap-4">
        <Stepper currentIndex={stepIndex} />

        <div className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold">{step.title}</div>
            <div className="text-sm text-muted-foreground">{step.subtitle}</div>
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

                  <div className="rounded-xl border border-border/60 bg-background/30 p-4">
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
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                          onClick={() => setImages([])}
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
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

                    {uploadingImages && (
                      <div className="mt-4 text-sm text-amber-200">
                        Đang upload ảnh lên Cloudinary...
                      </div>
                    )}

                    {imageUrls.length > 0 ? (
                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {imageUrls.map((u, i) => (
                          <div
                            key={u}
                            className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-background/30 relative"
                          >
                            <img src={u} alt="" className="h-full w-full object-cover" />
                            {cloudinaryUrls[i] && (
                              <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                                ✓
                              </div>
                            )}
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
              <div className="grid gap-4">
                <Field label="Chọn quà tặng" required>
                  {giftsLoading ? (
                    <div className="text-sm text-zinc-300">Loading gifts...</div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {gifts.map((gift) => (
                        <button
                          key={gift.id}
                          type="button"
                          onClick={() => {
                            update("giftId", String(gift.id));
                            setDraft((prev) => ({ ...prev, selectedGift: gift }));
                          }}
                          className={[
                            "rounded-2xl border p-4 text-left transition-colors overflow-hidden",
                            draft.giftId === String(gift.id)
                              ? "border-white/20 bg-white/10"
                              : "border-white/10 bg-black/20 hover:bg-white/5",
                          ].join(" ")}
                        >
                          {gift.imageUrl && (
                            <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-white/10">
                              <img
                                src={gift.imageUrl}
                                alt={gift.brand}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="text-sm font-semibold">{gift.brand}</div>
                          <div className="mt-1 text-sm text-zinc-300">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
}).format(gift.value)}
                          </div>
                          {gift.description && (
                            <div className="mt-2 text-xs text-zinc-400">{gift.description}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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
                <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                  <div className="text-sm font-semibold">15s structure</div>
                  <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
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
                      <span className="text-foreground">0–13s</span> content •{" "}
                      <span className="text-foreground">13–15s</span> closing •{" "}
                      <span className="text-foreground">after video</span> redeem code
                    </Row>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                  <div className="text-sm font-semibold">Message highlight (9–13s)</div>
                  <div className="mt-2 text-sm text-foreground">{draft.message || "—"}</div>
                </div>
              </div>
            )}

            {step.id === "prompt" && (
              <div className="grid gap-4">
                <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold">Final prompt</div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => {
                        setDraft((prev) => ({ ...prev, promptFinal: buildPrompt(prev, images.length) }));
                        setPromptEdited(false);
                      }}
                      disabled={isGenerating}
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
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
                    <div className="mt-2 text-xs text-muted-foreground">
                      {draft.promptFinal.trim().length} chars • {draft.imageCount} image(s)
                    </div>
                  </div>
                </div>
</div>
            )}

            {step.id === "generate" && (
              <div className="grid gap-4">
                <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-giftverse-gradient">Generate video</div>
                    <div className="text-xs text-muted-foreground">Target: 15–60s</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {draft.generationMethod === "image" ? "Image → video" : "Text → video"} •{" "}
                    {draft.imageCount} image(s)
                  </div>
                  {videoJob && (
                    <div className="mt-2 text-sm">
                      <div className="text-muted-foreground">Status: <span className="text-white">{videoJob.status}</span></div>
                    </div>
                  )}
                  <div className="mt-3">
                    <Progress value={isGenerating ? progress : createdGiftId ? 100 : 0} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {isGenerating
                      ? "Generating… (this may take 2-5 minutes)"
                      : createdGiftId
                        ? "Ready"
                        : "Not started"}
                  </div>
                </div>

                {videoUrl && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-sm font-semibold text-giftverse-gradient">Your video</div>
                    <video
                      src={videoUrl}
                      controls
                      className="mt-3 w-full rounded-lg"
                    />
                  </div>
                )}

                {createdGiftId && createdRedeemCode && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-sm font-semibold text-giftverse-gradient">Send link (mock)</div>
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
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-giftverse-gradient px-4 text-sm font-semibold text-white hover:opacity-90"
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

                {videoJob?.error && (
                  <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
                    <div className="text-sm font-semibold text-red-400">Error</div>
                    <div className="mt-2 text-sm text-red-200">{videoJob.error}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              <div className="font-semibold text-giftverse-gradient">Fix before continuing</div>
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
                className="inline-flex h-11 items-center justify-center rounded-xl bg-giftverse-gradient px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                onClick={generateAndSend}
                disabled={isGenerating || createdGiftId !== null || validateDraft(draft, "generate").length > 0}
              >
                {isGenerating ? `Generating ${progress}%` : createdGiftId ? "Generated" : "Generate & send"}
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-giftverse-gradient px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
    if (!draft.giftId) out.push("Voucher is required.");
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
  const gift = draft.selectedGift;
  if (!gift) return "—";
  const formattedValue = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(gift.value);
  const parts = [gift.brand, formattedValue].filter(Boolean);
  const core = parts.join(" • ");
  return `${core || "—"}${(draft.occasion || "") ? ` • ${draft.occasion}` : ""}`;
}

function buildPrompt(draft: GiftDraft, imageCount: number): string {
  const occasion = (draft.occasion || "").trim();
  const mood = (draft.mood || "").trim();
  
  let prompt = `${mood || "Cinematic"} gift video`;
  if (occasion) prompt += ` for ${occasion}`;
  if (draft.message.trim()) prompt += `. Message: ${draft.message.trim()}`;
  
  // Giới hạn độ dài và loại ký tự đặc biệt
  prompt = prompt
    .replace(/[\n\r\t\"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  return prompt;
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
                i <= currentIndex ? "bg-giftverse-gradient text-white" : "bg-white/10 text-zinc-300",
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
        "rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-white/30 bg-white/10"
          : "border-white/10 bg-black/20 hover:bg-white/5",
      ].join(" ")}
    >
      <div className={["text-sm font-semibold", selected ? "text-giftverse-gradient" : "text-white"].join(" ")}>{title}</div>
      <div className="mt-1 text-sm text-zinc-300">{description}</div>
      {selected && <div className="mt-2 h-1 w-full rounded-full bg-giftverse-gradient" />}
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
          {label} {required ? <span className="text-giftverse-gradient">*</span> : null}
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
className="h-11 w-full rounded-xl border border-white/10 bg-background/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
      className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
        "h-11 w-full rounded-xl border border-white/10 bg-background/40 px-3 text-sm focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30",
        value ? "text-foreground" : "text-muted-foreground",
      ].join(" ")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
      <div
        className="h-full rounded-full bg-giftverse-gradient transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
