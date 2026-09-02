import { useState, useCallback } from "react";

type Floater = { id: number; emoji: string; x: number };

const QUICK = ["🔥", "😂", "💀", "🍊", "🧡", "👁️", "😎", "👅"];

export default function ReactionsBar() {
  const [likes, setLikes] = useState(1337);
  const [liked, setLiked] = useState(false);
  const [shares, setShares] = useState(228);
  const [saves, setSaves] = useState(420);
  const [saved, setSaved] = useState(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const fid = useState({ n: 0 })[0];

  const spawn = useCallback(
    (emoji: string, x: number) => {
      const id = fid.n++;
      setFloaters((prev) => [...prev, { id, emoji, x }]);
      window.setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 1100);
    },
    [fid]
  );

  const onLike = () => {
    setLiked((l) => {
      setLikes((n) => n + (l ? -1 : 1));
      if (!l) spawn("🧡", 30);
      return !l;
    });
  };

  return (
    <div className="relative rounded-2xl border border-ember-600/40 bg-black/40 p-3 backdrop-blur sm:p-4">
      {/* floating reactions layer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 overflow-hidden">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-2 text-3xl"
            style={{
              left: `${f.x}%`,
              animation: "float-up 1.1s ease-out forwards",
            }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={onLike}
          className={
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition active:scale-95 " +
            (liked
              ? "border-ember-500 bg-ember-500/20 text-ember-300 shadow-[0_0_18px_-4px_rgba(249,115,22,0.8)]"
              : "border-white/10 bg-white/5 text-white/80 hover:border-ember-500/60 hover:text-ember-300")
          }
        >
          <span className={liked ? "animate-pop" : ""}>{liked ? "❤️" : "🤍"}</span>
          <span className="tabular-nums">{likes.toLocaleString()}</span>
        </button>

        <button
          onClick={() => {
            setShares((s) => s + 1);
            spawn("📨", 50);
          }}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-ember-500/60 hover:text-ember-300 active:scale-95"
        >
          <span>📤</span>
          <span className="tabular-nums">{shares.toLocaleString()}</span>
        </button>

        <button
          onClick={() => {
            setSaved((s) => !s);
            setSaves((n) => n + (saved ? -1 : 1));
            if (!saved) spawn("⭐", 70);
          }}
          className={
            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition active:scale-95 " +
            (saved
              ? "border-ember-500 bg-ember-500/20 text-ember-300"
              : "border-white/10 bg-white/5 text-white/80 hover:border-ember-500/60 hover:text-ember-300")
          }
        >
          <span>{saved ? "⭐" : "☆"}</span>
          <span className="tabular-nums">{saves.toLocaleString()}</span>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {QUICK.map((e, i) => (
            <button
              key={e}
              onClick={() => spawn(e, 18 + i * 9)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-lg transition hover:scale-125 hover:bg-ember-500/20 active:scale-90"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
