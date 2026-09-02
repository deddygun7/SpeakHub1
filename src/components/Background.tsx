import { useMemo } from "react";

const FLOATERS = ["🔥", "🍊", "💀", "⚡", "🧡", "👅", "😂", "👁️", "🍊", "🔥", "🤙", "💨"];

export default function Background() {
  const floaters = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        emoji: FLOATERS[i % FLOATERS.length],
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 18 + Math.random() * 34,
        delay: Math.random() * 8,
        duration: 7 + Math.random() * 8,
        opacity: 0.08 + Math.random() * 0.16,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_0%,#1a0d04_0%,#0a0604_45%,#000_100%)]" />

      {/* orange glow orbs */}
      <div className="animate-float-slow absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-ember-600/25 blur-[120px]" />
      <div
        className="animate-float-slow absolute -right-24 top-1/3 h-[32rem] w-[32rem] rounded-full bg-ember-500/20 blur-[140px]"
        style={{ animationDelay: "2.5s" }}
      />
      <div
        className="animate-float-slow absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-orange-700/20 blur-[130px]"
        style={{ animationDelay: "4s" }}
      />

      {/* grid lines */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(249,115,22,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(circle at 50% 40%, black, transparent 80%)",
        }}
      />

      {/* floating emoji */}
      {floaters.map((f) => (
        <span
          key={f.id}
          className="animate-float-slow absolute select-none"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            fontSize: `${f.size}px`,
            opacity: f.opacity,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        >
          {f.emoji}
        </span>
      ))}

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}
