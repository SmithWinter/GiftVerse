"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function AdminGiftsPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    brand: "",
    value: "",
    description: "",
    imageUrl: "",
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hiển thị preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Upload lên BE
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gifts/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, imageUrl: data.secure_url }));
      } else {
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value),
        }),
      });

      if (response.ok) {
        alert("Gift created successfully!");
        setFormData({ brand: "", value: "", description: "", imageUrl: "" });
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to create gift"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create gift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Back to Home</Link>
            <h1 className="text-3xl font-bold mt-2">Create Gift</h1>
            <p className="text-zinc-400 mt-1">Add a new gift voucher to the database (Demo Admin)</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Brand *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm focus:border-white/30 focus:outline-none"
                placeholder="e.g. CGV, Phuc Long"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Value (VND) *</label>
              <input
                type="number"
                required
                min="1000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm focus:border-white/30 focus:outline-none"
                placeholder="e.g. 500000"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm focus:border-white/30 focus:outline-none"
                placeholder="e.g. Voucher xem phim CGV 2D"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Gift Image (Upload to Cloudinary)</label>
              <div className="grid gap-3">
                {imagePreview && (
                  <div className="w-40 h-40 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground file:text-sm file:font-semibold hover:file:bg-primary/90"
                />
                {uploading && <div className="text-sm text-zinc-400">Uploading...</div>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Gift"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
