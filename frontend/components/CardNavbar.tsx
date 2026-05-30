"use client";

import CardNav from "@/components/CardNav.jsx";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

type NavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: Array<{ label: string; href: string; ariaLabel?: string }>;
};

export function CardNavbar() {
  const { user, logout } = useAuth();
  const ctaHref = user ? "/giver" : "/signin";
  
  let items: NavItem[] = [
    {
      label: "Create",
      bgColor: "rgba(255, 255, 255, 0.06)",
      textColor: "rgba(255, 255, 255, 0.92)",
      links: [
        { label: "Giver flow", href: "/giver", ariaLabel: "Go to giver flow" },
        { label: "Home", href: "/", ariaLabel: "Go to home" },
      ],
    },
    {
      label: "Receiver",
      bgColor: "rgba(255, 255, 255, 0.08)",
      textColor: "rgba(255, 255, 255, 0.92)",
      links: [
        { label: "Demo gift", href: "/gift/demo", ariaLabel: "Open receiver demo gift" },
        { label: "Trust gate", href: "/gift/demo", ariaLabel: "Open trust gate demo" },
      ],
    },
    {
      label: "Project",
      bgColor: "rgba(255, 255, 255, 0.06)",
      textColor: "rgba(255, 255, 255, 0.92)",
      links: [
        { label: "How to use", href: "/how-to-use", ariaLabel: "Go to how to use page" },
        { label: "Flow spec", href: "/#flow", ariaLabel: "View flow spec section" },
      ],
    },
  ];

  if (user) {
    items.push({
      label: user.fullName,
      bgColor: "rgba(255, 255, 255, 0.07)",
      textColor: "rgba(255, 255, 255, 0.92)",
      links: [
        { label: "Logout", href: "#", ariaLabel: "Logout" },
      ],
    });
  } else {
    items.push({
      label: "Account",
      bgColor: "rgba(255, 255, 255, 0.07)",
      textColor: "rgba(255, 255, 255, 0.92)",
      links: [
        { label: "Sign In", href: "/signin", ariaLabel: "Sign In" },
        { label: "Sign Up", href: "/signup", ariaLabel: "Sign Up" },
      ],
    });
  }

  return (
    <div>
      <CardNav
        logo="/app-logo.png"
        logoAlt="GiftVerse"
        logoText="GiftVerse"
        items={items}
        baseColor="rgba(10, 10, 12, 0.85)"
        menuColor="rgba(255, 255, 255, 0.92)"
        buttonBgColor="rgba(255, 255, 255, 0.92)"
        buttonTextColor="rgba(10, 10, 12, 1)"
        ctaLabel={user ? "Create" : "Get Started"}
        ctaHref={ctaHref}
      />
      {user && (
        <div className="fixed top-0 right-0 z-50 p-4">
          <button
            onClick={logout}
            className="text-sm font-semibold text-foreground hover:text-muted-foreground"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
