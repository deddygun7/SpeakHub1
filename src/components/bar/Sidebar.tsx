"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import { nameColor, type Dm, type Me, type OnlineUser, type Room } from "@/components/bar/core";

type Props = {
  me: Me;
  rooms: Room[];
  dms: Dm[];
  online: OnlineUser[];
  unread: Record<number, number>;
  currentId: number | null;
  dailyAvailable: boolean;
  connected: boolean;
  onOpen: (id: number) => void;
  onCreateRoom: () => void;
  onDaily: () => void;
  onSettings: () => void;
  onShop: () => void;
  onBoard: () => void;
  onAchievements: () => void;
  onPalette: () => void;
  onProfile: (userId: number) => void;
  onDm: (userId: number) => void;
  onLogout: () => void;
};

function Section({ title, count, children, defaultOpen = true, action }: { title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean; action?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.25em] text-muted hover:text-ink">
          <span className={`inline-block transition ${open ? "rotate-90" : ""}`}>▸</span>
          {title}
          {count !== undefined && <span className="text-acc/70">{count}</span>}
        </button>
        {action}
      </div>
      {open && <div className="mt-1.5 space-y-0.5">{children}</div>}
    </div>
  );
}

export default function Sidebar(p: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const humans = p.online.filter((u) => !u.isBot);
  const bot = p.online.find((u) => u.isBot);

  return (
    <div className="flex h-full flex-col border-r border-line bg-[var(--panel)]">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="hex flex h-8 w-8 items-center justify-center bg-gradient-to-br from-[#ffd27a] via-acc to-acc-2 text-base">🥃</span>
          <span className="font-display text-sm font-black tracking-[0.25em]">
            NEON<span className="neon-text">DRAM</span>
          </span>
        </Link>
        <button onClick={p.onPalette} className="kbd hover:text-ink" title="Командная палитра">
          ⌘K
        </button>
      </div>

      {/* Me card */}
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => p.onProfile(p.me.id)}>
            <Avatar username={p.me.username} displayName={p.me.displayName} color={p.me.nameColor} size={42} level={p.me.level} online />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold" style={{ color: nameColor(p.me.nameColor) }}>
              {p.me.displayName}
            </div>
            <div className="truncate text-[11px] text-muted">{p.me.title ? `«${p.me.title}» · ` : ""}{p.me.rank}</div>
          </div>
          <button onClick={() => setMenuOpen((o) => !o)} className="text-muted hover:text-ink" title="Меню">
            ⋯
          </button>
        </div>
        <div className="mt-2.5">
          <div className="flex items-center justify-between font-display text-[10px] uppercase tracking-widest text-muted">
            <span>ур. {p.me.level}</span>
            <span>
              {p.me.levelCurrent}/{p.me.levelNeeded} xp
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div className="liquid h-full rounded-full transition-all" style={{ width: `${Math.max(3, p.me.levelPct)}%` }} />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <button onClick={p.onShop} className="flex items-center gap-1 rounded-sm border border-line bg-black/30 px-2 py-1 font-display text-[11px] text-acc hover:border-acc/50" title="Магазин">
            🪙 {p.me.coins}
          </button>
          <button
            onClick={p.onDaily}
            disabled={!p.dailyAvailable}
            className={`flex-1 rounded-sm px-2 py-1 font-display text-[10px] font-bold uppercase tracking-widest transition ${
              p.dailyAvailable ? "bg-acc text-black shadow-[0_0_14px_rgba(var(--acc-rgb),0.5)] hover:brightness-110" : "border border-line text-muted"
            }`}
          >
            {p.dailyAvailable ? "🥃 Ежедневный дрэм" : `Серия ${p.me.dailyStreak} дн.`}
          </button>
        </div>
        {menuOpen && (
          <div className="pop-in mt-2 grid grid-cols-2 gap-1 text-xs">
            {[
              ["⚙️ Настройки", p.onSettings],
              ["🏆 Награды", p.onAchievements],
              ["📊 Доска почёта", p.onBoard],
              ["🛍️ Магазин", p.onShop],
            ].map(([label, fn]) => (
              <button
                key={label as string}
                onClick={() => {
                  setMenuOpen(false);
                  (fn as () => void)();
                }}
                className="nav-item !py-1.5 text-xs"
              >
                {label as string}
              </button>
            ))}
            <button onClick={p.onLogout} className="nav-item col-span-2 !py-1.5 text-xs text-red-300/80 hover:text-red-300">
              🚪 Выйти из бара
            </button>
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <Section
          title="Залы"
          count={p.rooms.length}
          action={
            <button onClick={p.onCreateRoom} className="text-muted hover:text-acc" title="Открыть зал">
              ＋
            </button>
          }
        >
          {p.rooms.map((r) => {
            const n = p.unread[r.id] ?? 0;
            return (
              <button key={r.id} onClick={() => p.onOpen(r.id)} className={`nav-item ${p.currentId === r.id ? "active" : ""}`}>
                <span className="text-base">{r.icon}</span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {r.name}
                  {r.isPrivate && <span className="ml-1 text-[10px] opacity-60">🔐</span>}
                </span>
                {n > 0 && r.id !== p.currentId ? (
                  <span className="rounded-sm bg-acc px-1.5 font-display text-[10px] font-bold text-black">{n > 99 ? "99+" : n}</span>
                ) : (
                  <span className="text-[10px] text-muted/70">{r.members}</span>
                )}
              </button>
            );
          })}
        </Section>

        <Section title="Личные" count={p.dms.length} defaultOpen>
          {p.dms.length === 0 && <div className="px-3 py-1 text-xs text-muted">Нажми на любого гостя — «написать».</div>}
          {p.dms.map((d) => {
            const n = p.unread[d.id] ?? 0;
            return (
              <button key={d.id} onClick={() => p.onOpen(d.id)} className={`nav-item ${p.currentId === d.id ? "active" : ""}`}>
                {d.partner ? <Avatar username={d.partner.username} displayName={d.partner.displayName} color={d.partner.nameColor} size={26} online={d.partner.online} /> : <span>🤫</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{d.partner?.displayName ?? "Призрак"}</span>
                  <span className="block truncate text-[11px] text-muted">{d.lastMessage || "…"}</span>
                </span>
                {n > 0 && d.id !== p.currentId && <span className="rounded-sm bg-magenta-neon px-1.5 font-display text-[10px] font-bold text-black">{n}</span>}
              </button>
            );
          })}
        </Section>

        <Section title="У стойки" count={humans.length}>
          {bot && (
            <div className="nav-item cursor-default">
              <Avatar username={bot.username} displayName={bot.displayName} color={bot.nameColor} size={26} isBot online />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-cyan-neon">{bot.displayName}</span>
                <span className="block truncate text-[11px] text-muted">{bot.status}</span>
              </span>
            </div>
          )}
          {humans.map((u) => (
            <div key={u.id} className="nav-item group !py-1">
              <button onClick={() => p.onProfile(u.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Avatar username={u.username} displayName={u.displayName} color={u.nameColor} size={26} online />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm" style={{ color: nameColor(u.nameColor) }}>
                    {u.displayName}
                    {u.id === p.me.id && <span className="ml-1 text-[10px] text-muted">(ты)</span>}
                  </span>
                  <span className="block truncate text-[11px] text-muted">{u.status || `${u.level} ур.`}</span>
                </span>
              </button>
              {u.id !== p.me.id && (
                <button onClick={() => p.onDm(u.id)} className="opacity-0 transition group-hover:opacity-100" title="Написать">
                  ✉️
                </button>
              )}
            </div>
          ))}
        </Section>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2 font-display text-[10px] uppercase tracking-widest text-muted">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${p.connected ? "online-dot" : "bg-red-500"}`} />
          {p.connected ? "в сети" : "нет связи"}
        </span>
        <button onClick={p.onSettings} className="hover:text-ink">
          ⚙ настройки
        </button>
      </div>
    </div>
  );
}
