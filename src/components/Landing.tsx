"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Whisky } from "@/lib/bartender";
import { nameColor } from "@/components/bar/core";
import Avatar from "@/components/Avatar";

/* ---------- Nav ---------- */

export function LandingNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { href: "#perks", label: "Плюшки" },
    { href: "#menu", label: "Меню бара" },
    { href: "#live", label: "Живой эфир" },
    { href: "#board", label: "Доска почёта" },
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "glass py-2" : "py-4"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-3">
          <span className="hex flex h-10 w-10 items-center justify-center bg-gradient-to-br from-[#ffd27a] via-acc to-acc-2 text-xl">🥃</span>
          <span className="font-display text-lg font-black tracking-[0.25em] text-ink">
            NEON<span className="neon-text">DRAM</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="tab-underline relative py-1 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-muted hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {loggedIn ? (
            <Link href="/bar" className="btn-neon">
              В бар →
            </Link>
          ) : (
            <>
              <Link href="/enter" className="btn-ghost">
                Войти
              </Link>
              <Link href="/enter?mode=register" className="btn-neon">
                Занять стул
              </Link>
            </>
          )}
        </div>
        <button aria-label="Меню" className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden" onClick={() => setOpen((o) => !o)}>
          <span className={`h-0.5 w-6 bg-acc transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-acc transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-acc transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="glass pop-in mx-4 mt-2 flex flex-col gap-1 rounded-lg p-3 md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="nav-item font-display text-xs uppercase tracking-[0.2em]">
              {l.label}
            </a>
          ))}
          <Link href={loggedIn ? "/bar" : "/enter"} className="btn-neon mt-2">
            {loggedIn ? "В бар →" : "Войти в бар"}
          </Link>
        </div>
      )}
    </header>
  );
}

/* ---------- Animated counter ---------- */

export function Counter({ value, label, accent }: { value: number; label: string; accent?: "cyan" | "magenta" }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  const cls = accent === "cyan" ? "neon-text-cyan" : accent === "magenta" ? "neon-text-magenta" : "neon-text";
  return (
    <div ref={ref} className="panel clip-corner-sm px-5 py-4 text-center">
      <div className={`font-display text-3xl font-black tabular-nums ${cls}`}>{n.toLocaleString("ru-RU")}</div>
      <div className="mt-1 font-display text-[10px] uppercase tracking-[0.25em] text-muted">{label}</div>
    </div>
  );
}

/* ---------- Live ticker ---------- */

export type TickerItem = { text: string; kind: string; name: string; nameColor: string; at: string };

export function LiveTicker({ items }: { items: TickerItem[] }) {
  const doubled = useMemo(() => (items.length ? [...items, ...items] : []), [items]);
  if (!items.length) return null;
  return (
    <div className="relative overflow-hidden border-y border-line bg-black/30 py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent" />
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-2 text-sm">
            <span className="font-display text-[10px] uppercase tracking-widest text-muted">LIVE</span>
            <span className="font-semibold" style={{ color: nameColor(t.nameColor) }}>
              {t.name}:
            </span>
            <span className="text-ink/80">{t.kind === "me" ? `*${t.text}*` : t.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Whisky menu (interactive tabs) ---------- */

const TYPES: Array<{ id: Whisky["type"] | "all"; label: string }> = [
  { id: "all", label: "Всё" },
  { id: "Scotch", label: "Скотч" },
  { id: "Bourbon", label: "Бурбон" },
  { id: "Rye", label: "Рожь" },
  { id: "Japanese", label: "Япония" },
  { id: "Irish", label: "Ирландия" },
];

export function WhiskyMenu({ items, today }: { items: Whisky[]; today: string }) {
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("all");
  const [active, setActive] = useState<Whisky | null>(null);
  const list = type === "all" ? items : items.filter((w) => w.type === type);
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`clip-corner-sm px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
              type === t.id ? "bg-acc text-black shadow-[0_0_18px_rgba(var(--acc-rgb),0.5)]" : "border border-line text-muted hover:border-acc/50 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((w) => (
          <button
            key={w.name}
            onClick={() => setActive(w)}
            className="panel card-tilt clip-corner group relative overflow-hidden p-5 text-left"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60" style={{ background: w.color }} />
            {w.name === today && (
              <span className="absolute right-3 top-3 rounded-sm bg-acc px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest text-black">
                дрэм дня
              </span>
            )}
            <div className="flex items-end gap-3">
              <GlassIcon color={w.color} />
              <div className="min-w-0">
                <div className="truncate font-serif text-xl font-semibold text-ink">{w.name}</div>
                <div className="truncate text-xs text-muted">{w.region}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {w.notes.slice(0, 3).map((n) => (
                <span key={n} className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] text-muted">
                  {n}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between font-display text-[11px] tracking-widest">
              <span className="text-muted">{w.abv}% · {w.age}</span>
              <span className="neon-text">{w.price}¢</span>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setActive(null)}>
          <div className="glass pop-in clip-corner relative w-full max-w-lg p-7" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-4 top-3 text-muted hover:text-ink" onClick={() => setActive(null)}>
              ✕
            </button>
            <div className="flex items-center gap-5">
              <GlassIcon color={active.color} size={72} />
              <div>
                <div className="font-serif text-3xl font-semibold text-ink">{active.name}</div>
                <div className="text-sm text-muted">
                  {active.region} · {active.type}
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                ["Крепость", `${active.abv}%`],
                ["Выдержка", active.age],
                ["Цена", `${active.price}¢`],
              ].map(([k, v]) => (
                <div key={k} className="panel clip-corner-sm py-3">
                  <div className="font-display text-lg font-bold text-acc">{v}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted">{k}</div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Ноты</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {active.notes.map((n) => (
                  <span key={n} className="rounded-sm bg-acc/10 px-2 py-1 text-sm text-ink">
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm text-muted">
              Хочешь обсудить? В баре напиши <code className="rounded bg-black/40 px-1 text-acc">/pour</code> — и бармен нальёт этот дрэм тебе или другу.
            </p>
            <Link href="/enter" className="btn-neon mt-5 w-full">
              Заказать в баре
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function GlassIcon({ color, size = 44 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="shrink-0 drop-shadow-[0_0_8px_rgba(var(--acc-rgb),0.4)]">
      <path d="M10 6h28l-3 34a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4L10 6z" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path className="glass-fill" d="M13.5 26h21l-1.6 14a2 2 0 0 1-2 2H17.1a2 2 0 0 1-2-2L13.5 26z" fill={color} opacity="0.9" />
      <rect x="18" y="22" width="6" height="7" rx="1" fill="rgba(255,255,255,0.35)" transform="rotate(-12 21 25)" />
      <path d="M13 12h22" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  );
}

/* ---------- Leaderboard preview ---------- */

export type BoardRow = { id: number; username: string; displayName: string; nameColor: string; title: string; xp: number; level: number; rank: string; place: number; messagesCount: number; cheersReceived: number };

export function BoardPreview({ rows }: { rows: BoardRow[] }) {
  if (!rows.length)
    return (
      <div className="panel clip-corner p-8 text-center text-muted">
        Доска почёта пуста. Первый, кто зайдёт, станет легендой автоматически.
      </div>
    );
  return (
    <div className="panel clip-corner overflow-hidden">
      {rows.slice(0, 5).map((r) => (
        <div key={r.id} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-b-0 hover:bg-acc/5">
          <span className={`w-8 font-display text-xl font-black ${r.place === 1 ? "neon-text" : r.place === 2 ? "neon-text-cyan" : r.place === 3 ? "neon-text-magenta" : "text-muted"}`}>
            {r.place}
          </span>
          <Avatar username={r.username} displayName={r.displayName} color={r.nameColor} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold" style={{ color: nameColor(r.nameColor) }}>
              {r.displayName}
              {r.title && <span className="ml-2 text-xs text-muted">«{r.title}»</span>}
            </div>
            <div className="text-xs text-muted">
              {r.rank} · {r.level} ур. · {r.messagesCount} сообщ. · {r.cheersReceived} 🍻
            </div>
          </div>
          <div className="font-display text-sm text-acc">{r.xp} XP</div>
        </div>
      ))}
    </div>
  );
}
