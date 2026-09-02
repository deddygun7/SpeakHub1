import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";

type Msg = {
  id: number;
  user: string;
  color: string;
  text: string;
};

const USERS = [
  { user: "Юзер", color: "text-ember-400" },
  { user: "МамкаЮзера", color: "text-pink-400" },
  { user: "admin_LFU", color: "text-yellow-400" },
  { user: "OG_2007", color: "text-emerald-400" },
  { user: "sigma_boy", color: "text-sky-400" },
  { user: "Тарас228", color: "text-orange-300" },
  { user: "mariana_UwU", color: "text-fuchsia-400" },
  { user: "LFU_chief", color: "text-red-400" },
  { user: "anonim", color: "text-zinc-300" },
  { user: "Козак", color: "text-amber-300" },
];

const LINES = [
  "соре це топ 🔥",
  "норм відео",
  "LFU назавжди 💀",
  "ну і мамка...",
  "це база 😎",
  "репорт пішов модерам 😂",
  "ору в голос",
  "+rep автору",
  "це треба мемом робити",
  "круть, додай в закладки",
  "ВІТАЮ з чату LFU 🍊",
  "10/10 глянув би ще",
  "ну ти зрозумів 👁️",
  "найкращий кліп чату",
  "🔥🔥🔥 unglaublich",
  "стоп, це шедевр",
  "LFU > all",
  "respect++ ✊",
  "ну ви даєте пацани",
  "🖤🧡 по темі",
];

function makeMsg(id: number): Msg {
  const u = USERS[Math.floor(Math.random() * USERS.length)];
  const t = LINES[Math.floor(Math.random() * LINES.length)];
  return { id, user: u.user, color: u.color, text: t };
}

export default function ChatFeed() {
  const [msgs, setMsgs] = useState<Msg[]>(() =>
    Array.from({ length: 7 }).map((_, i) => makeMsg(i))
  );
  const idRef = useRef(100);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMsgs((prev) => [...prev.slice(-40), makeMsg(idRef.current++)]);
    }, 1600);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ember-600/40 bg-black/50 backdrop-blur">
      <div className="flex items-center justify-between border-b border-ember-600/30 bg-gradient-to-r from-ember-600/20 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-extrabold tracking-tight text-white">
            чат <span className="text-ember-500">LFU</span>
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          live
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3"
        style={{ scrollBehavior: "smooth" }}
      >
        {msgs.map((m) => (
          <div
            key={m.id}
            className="animate-pop rounded-xl bg-white/[0.03] px-3 py-2 text-sm leading-snug ring-1 ring-white/5"
          >
            <span className={cn("font-bold", m.color)}>{m.user}</span>
            <span className="text-zinc-400">: </span>
            <span className="text-zinc-100">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-ember-600/30 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-500">
          <span>✍️</span>
          <span className="flex-1">повідомлення вимкнені модератором 🔨</span>
        </div>
      </div>
    </div>
  );
}
