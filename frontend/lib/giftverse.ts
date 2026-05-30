// Gift từ BE
export type Gift = {
  id: number;
  brand: string;
  value: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type GiftDraft = {
  generationMethod: "text" | "image" | "";
  imageCount: number;
  recipientContact: string;
  recipientName: string;
  occasion: string;
  giftId: string; // Thay thế voucherBrand/voucherValue
  message: string;
  mood: string;
  intent: string;
  detail: string;
  promptInput: string;
  promptFinal: string;
  selectedGift?: Gift; // Lưu trữ gift đã chọn để dùng cho format/buildPrompt
};

export type SentGift = GiftDraft & {
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

export function createGiftFromDraft(draft: GiftDraft): SentGift {
  const id = randomId();
  const redeemCode = `GV-${randomCode(8)}`;
  return {
    ...draft,
    id,
    redeemCode,
    createdAtIso: new Date().toISOString(),
  };
}

export function saveGift(gift: SentGift): void {
  if (typeof window === "undefined") return;
  const all = loadAllGifts();
  all[gift.id] = gift;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadGift(id: string): SentGift | null {
  if (typeof window === "undefined") return null;
  const all = loadAllGifts();
  return all[id] ?? null;
}

function loadAllGifts(): Record<string, SentGift> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, SentGift>;
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
