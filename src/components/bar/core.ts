import type { Me } from "@/lib/auth";
import type { WireMessage } from "@/lib/server";
import type { Achievement } from "@/lib/game";

export type { Me, WireMessage, Achievement };

export type Room = {
  id: number;
  slug: string | null;
  name: string;
  icon: string;
  description: string;
  topic: string;
  isPrivate: boolean;
  createdBy: number | null;
  members: number;
  joined: boolean;
  unread: number;
};

export type Partner = {
  id: number;
  username: string;
  displayName: string;
  nameColor: string;
  status: string;
  title: string;
  level: number;
  online: boolean;
};

export type Dm = { id: number; partner: Partner | null; lastMessage: string; lastAt: string; unread: number };

export type OnlineUser = {
  id: number;
  username: string;
  displayName: string;
  nameColor: string;
  status: string;
  title: string;
  level: number;
  isBot?: boolean;
  online: boolean;
};

export type ChannelInfo = {
  id: number;
  type: string;
  slug: string | null;
  name: string;
  icon: string;
  description: string;
  topic: string;
  isPrivate: boolean;
  createdBy: number | null;
  createdAt: string;
};

export type Profile = {
  id: number;
  username: string;
  displayName: string;
  bio: string;
  status: string;
  favoriteWhisky: string;
  title: string;
  nameColor: string;
  xp: number;
  level: number;
  levelPct: number;
  rank: string;
  messagesCount: number;
  cheersReceived: number;
  cheersGiven: number;
  dailyStreak: number;
  isBot: boolean;
  online: boolean;
  lastSeen: string;
  createdAt: string;
  achievements: Array<Achievement & { unlockedAt: string }>;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  let body = init?.body;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const res = await fetch(url, { ...init, headers, body, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(data.error ?? `Ошибка ${res.status}`, res.status);
  return data;
}

// ---------- Sounds (synthesized, no assets) ----------

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.05) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.02);
}

export const sounds = {
  enabled: (): boolean => typeof window !== "undefined" && localStorage.getItem("nd_sound") !== "0",
  send() {
    if (!this.enabled()) return;
    tone(880, 0, 0.08, "triangle", 0.04);
    tone(1320, 0.05, 0.1, "triangle", 0.03);
  },
  receive() {
    if (!this.enabled()) return;
    tone(520, 0, 0.09, "sine", 0.05);
    tone(780, 0.08, 0.14, "sine", 0.04);
  },
  unlock() {
    if (!this.enabled()) return;
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.25, "triangle", 0.05));
  },
  click() {
    if (!this.enabled()) return;
    tone(1800, 0, 0.03, "square", 0.015);
  },
  error() {
    if (!this.enabled()) return;
    tone(220, 0, 0.15, "sawtooth", 0.03);
    tone(180, 0.1, 0.2, "sawtooth", 0.03);
  },
  pour() {
    if (!this.enabled()) return;
    for (let i = 0; i < 8; i++) tone(300 + Math.random() * 500, i * 0.05, 0.08, "sine", 0.02);
  },
};

// ---------- Formatting ----------

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Сегодня";
  if (same(d, yesterday)) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Minimal safe markdown: **bold**, `code`, links, @mentions, newlines */
export function renderContent(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/(^|\s)@([a-z0-9_]{3,20})/gi, '$1<span class="mention">@$2</span>');
  s = s.replace(/\n/g, "<br/>");
  return s;
}

export const NAME_CSS: Record<string, string> = {
  amber: "#f5a623",
  cyan: "#22e5ff",
  magenta: "#ff3ad6",
  lime: "#a8ff3e",
  violet: "#a78bfa",
  ember: "#ff5e3a",
  ice: "#dff6ff",
};

export function nameColor(key: string): string {
  return NAME_CSS[key] ?? NAME_CSS.amber;
}

export function hueFor(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}
