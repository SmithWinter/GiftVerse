"use client";

import Galaxy from "@/components/Galaxy.jsx";

export function GalaxyBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Galaxy
        className="h-full w-full opacity-60"
        globalMouseInteraction
        starSpeed={0.15}
        density={0.6}
        speed={0.3}
        rotationSpeed={0.02}
        twinkleIntensity={0.1}
        glowIntensity={0.2}
      />
    </div>
  );
}
