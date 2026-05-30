export type GiftDraft = {
  generationMethod: "text" | "image" | "";
  imageCount: number;
  recipientContact: string;
  recipientName: string;
  occasion: string;
  voucherBrand: string;
  voucherValue: string;
  message: string;
  mood: string;
  intent: string;
  detail: string;
  promptInput: string;
  promptFinal: string;
};

export type Gift = GiftDraft & {
  id: string;
  redeemCode: string;
  createdAtIso: string;
};

const STORAGE_KEY = "giftverse:gifts:v1";

export function maskContact(contact: string): string {
  const trimmed = contact.trim();
  if (!trimmed) return "****";

  if (trimmed.includes("@")) {
    const [name, domain] = trimmed.split("@");
    const safeName = name ?? "";
    const safeDomain = domain ?? "";
    if (!safeDomain) return "****";
    const head = safeName.slice(0, Math.min(1, safeName.length));
    return `${head}***@${safeDomain}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 4) return `****${digits.slice(-4)}`;
  return "****";
}

export function createGiftFromDraft(draft: GiftDraft): Gift {
  const id = randomId();
  const redeemCode = `GV-${randomCode(8)}`;
  return {
    ...draft,
    id,
    redeemCode,
    createdAtIso: new Date().toISOString(),
  };
}

export function saveGift(gift: Gift): void {
  if (typeof window === "undefined") return;
  const all = loadAllGifts();
  all[gift.id] = gift;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadGift(id: string): Gift | null {
  if (typeof window === "undefined") return null;
  const all = loadAllGifts();
  return all[id] ?? null;
}

export function demoGift(): Gift {
  return {
    id: "demo",
    redeemCode: "GV-DEMO-2026",
    createdAtIso: new Date().toISOString(),
    generationMethod: "text",
    imageCount: 2,
    recipientContact: "someone@example.com",
    recipientName: "Alex",
    occasion: "Birthday",
    voucherBrand: "GiftVerse",
    voucherValue: "$50",
    message: "Wishing you a year full of small wins and big smiles.",
    mood: "Warm cinematic",
    intent: "Make them feel celebrated",
    detail: "A short personal moment: “Thanks for always being there.”",
    promptInput: "Soft lighting, warm colors, subtle film grain.",
    promptFinal:
      "Create a 15s vertical cinematic gift video.\n\nStructure:\n- 0–2s: Title card (To Alex • Birthday)\n- 2–9s: Mood sequence (Warm cinematic)\n- 9–13s: Message highlight (Wishing you a year full of small wins and big smiles.)\n- 13–15s: End-card QR reserved (do not add extra text over QR)\n\nVisual direction:\n- Use uploaded images as visual reference.\n- Soft lighting, warm colors, subtle film grain.\n\nConstraints:\n- Keep typography readable.\n- Avoid cringe / over-sentimental tone.\n- Maintain high contrast for the end-card.",
  };
}

function loadAllGifts(): Record<string, Gift> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, Gift>;
  } catch {
    return {};
  }
}

function randomId(): string {
  const base = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return base.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 32);
}

function randomCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[bytes[i] % chars.length];
  return out;
}
