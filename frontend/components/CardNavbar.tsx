"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export function CardNavbar() {
  const { user, logout } = useAuth();

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/app-logo.png" alt="GiftVerse" className="h-16 w-auto" />
          </Link>

          {/* Middle: Navigation Links */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/giver"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Create
            </Link>
            <Link
              href="/gift/demo"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/how-to-use"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              How to use
            </Link>
          </nav>

          {/* Right: CTA & Account */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  Hi, {user.fullName}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-semibold text-muted-foreground hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-giftverse-gradient px-5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
