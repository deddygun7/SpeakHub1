"use client";

import { hueFor, nameColor } from "@/components/bar/core";

type Props = {
  username: string;
  displayName?: string;
  size?: number;
  color?: string;
  online?: boolean;
  isBot?: boolean;
  className?: string;
  level?: number;
};

export default function Avatar({ username, displayName, size = 36, color = "amber", online, isBot, className = "", level }: Props) {
  const hue = hueFor(username);
  const initials = (displayName || username).slice(0, 2).toUpperCase();
  const ring = nameColor(color);
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <span
        className="hex absolute inset-0 flex items-center justify-center font-display font-bold text-black/90"
        style={{
          background: isBot
            ? "linear-gradient(135deg, #dff6ff, #22e5ff 60%, #0ea5e9)"
            : `linear-gradient(135deg, hsl(${hue} 80% 65%), hsl(${(hue + 40) % 360} 75% 45%))`,
          fontSize: size * 0.36,
          letterSpacing: "0.02em",
        }}
      >
        {isBot ? "🥃" : initials}
      </span>
      <span className="hex pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 0 2px ${ring}55` }} />
      {online !== undefined && (
        <span
          className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border border-black ${online ? "online-dot" : "bg-zinc-600"}`}
        />
      )}
      {level !== undefined && level > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-black px-0.5 font-display text-[9px] font-bold text-acc"
          style={{ boxShadow: "0 0 6px rgba(var(--acc-rgb),0.6)", border: "1px solid rgba(var(--acc-rgb),0.5)" }}
        >
          {level}
        </span>
      )}
    </span>
  );
}
