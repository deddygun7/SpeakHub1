"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import {
  api,
  formatTime,
  nameColor,
  relTime,
  renderContent,
  sounds,
  type Achievement,
  type ChannelInfo,
  type Dm,
  type Me,
  type OnlineUser,
  type Profile,
  type Room,
  type WireMessage,
} from "@/components/bar/core";
import { ACHIEVEMENTS, NAME_COLORS, SHOP_TITLES, THEMES } from "@/lib/game";
import { COMMANDS } from "@/lib/bartender";

/* ---------- Modal shell ---------- */

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onClick={onClose}>
      <div className={`glass pop-in clip-corner relative max-h-[92vh] w-full overflow-y-auto p-6 ${wide ? "max-w-2xl" : "max-w-md"}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-acc">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Create room ---------- */

const ROOM_ICONS = ["🥃", "🍻", "🔥", "🌙", "👾", "🎷", "🎮", "📚", "🎬", "💼", "🧪", "🛸", "🃏", "🏙️", "🔐", "💀"];

export function CreateRoomModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: (id: number, unlocked: Achievement[]) => void; onError: (e: unknown) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🥃");
  const [isPrivate, setPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Открыть зал" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {ROOM_ICONS.map((i) => (
            <button key={i} onClick={() => setIcon(i)} className={`h-9 w-9 rounded-md border text-lg transition ${icon === i ? "border-acc bg-acc/20" : "border-line hover:border-acc/40"}`}>
              {i}
            </button>
          ))}
        </div>
        <input className="field" placeholder="Название зала" value={name} onChange={(e) => setName(e.target.value)} maxLength={48} />
        <input className="field" placeholder="Описание (о чём здесь говорят)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} className="accent-[var(--acc)]" />
          🔐 Закрытый зал (вход по паролю)
        </label>
        {isPrivate && <input className="field" placeholder="Пароль для входа" value={password} onChange={(e) => setPassword(e.target.value)} />}
        <button
          className="btn-neon w-full"
          disabled={busy || name.trim().length < 2}
          onClick={async () => {
            setBusy(true);
            try {
              const data = await api<{ channel: { id: number }; unlocked: Achievement[] }>("/api/channels", { method: "POST", json: { name, description, icon, isPrivate, password } });
              onCreated(data.channel.id, data.unlocked);
            } catch (e) {
              onError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Вешаем вывеску…" : "Открыть (+30 XP)"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Join private room ---------- */

export function JoinRoomModal({ room, onClose, onJoin }: { room: { id: number; name: string; icon: string }; onClose: () => void; onJoin: (pw: string) => Promise<boolean> }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Закрытый зал" onClose={onClose}>
      <div className="text-center">
        <div className="text-5xl">{room.icon}</div>
        <div className="mt-2 font-display text-lg font-bold">{room.name}</div>
        <p className="mt-1 text-sm text-muted">Вышибала ждёт пароль.</p>
      </div>
      <form
        className="mt-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onJoin(pw);
          setBusy(false);
        }}
      >
        <input className="field text-center font-display tracking-[0.3em]" placeholder="ПАРОЛЬ" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        <button className="btn-neon w-full" disabled={busy || !pw}>
          Войти
        </button>
      </form>
    </Modal>
  );
}

/* ---------- Settings ---------- */

export function SettingsModal({ me, onClose, onSaved, onError }: { me: Me; onClose: () => void; onSaved: (u: Me) => void; onError: (e: unknown) => void }) {
  const [displayName, setDisplayName] = useState(me.displayName);
  const [status, setStatus] = useState(me.status);
  const [bio, setBio] = useState(me.bio);
  const [favoriteWhisky, setFav] = useState(me.favoriteWhisky);
  const [theme, setTheme] = useState(typeof window !== "undefined" ? localStorage.getItem("nd_theme") ?? me.theme : me.theme);
  const [crt, setCrt] = useState(typeof window !== "undefined" && localStorage.getItem("nd_crt") === "1");
  const [sound, setSound] = useState(typeof window !== "undefined" && localStorage.getItem("nd_sound") !== "0");
  const [busy, setBusy] = useState(false);

  const applyTheme = (t: string) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("nd_theme", t);
    sounds.click();
  };
  const applyCrt = (v: boolean) => {
    setCrt(v);
    document.documentElement.classList.toggle("crt", v);
    localStorage.setItem("nd_crt", v ? "1" : "0");
  };
  const applySound = (v: boolean) => {
    setSound(v);
    localStorage.setItem("nd_sound", v ? "1" : "0");
    if (v) sounds.click();
  };

  return (
    <Modal title="Настройки" onClose={onClose} wide>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Профиль</div>
          <input className="field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Имя в баре" maxLength={48} />
          <input className="field" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Статус (напр. «пью и думаю»)" maxLength={80} />
          <input className="field" value={favoriteWhisky} onChange={(e) => setFav(e.target.value)} placeholder="Любимый виски" maxLength={80} />
          <textarea className="field" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="О себе" maxLength={240} />
          <button
            className="btn-neon w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const data = await api<{ user: Me }>("/api/me", { method: "PATCH", json: { displayName, status, bio, favoriteWhisky, theme } });
                onSaved(data.user);
              } catch (e) {
                onError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            Сохранить
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Неон</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className={`clip-corner-sm flex items-center gap-2 border px-3 py-2 text-left text-sm transition ${theme === t.id ? "border-acc bg-acc/10" : "border-line hover:border-acc/40"}`}
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: t.swatch, boxShadow: `0 0 10px ${t.swatch}` }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Toggle label="CRT-сканлайны" hint="Эффект старого монитора" value={crt} onChange={applyCrt} />
          <Toggle label="Звуки бара" hint="Синтезированные, без файлов" value={sound} onChange={applySound} />
          <div className="rounded-md border border-line bg-black/20 p-3 text-xs text-muted">
            <div className="font-display text-[10px] uppercase tracking-widest text-acc">Горячие клавиши</div>
            <div className="mt-1.5 space-y-1">
              <div>
                <span className="kbd">Ctrl+K</span> — командная палитра
              </div>
              <div>
                <span className="kbd">ПКМ</span> по сообщению — контекстное меню
              </div>
              <div>
                <span className="kbd">Esc</span> — закрыть всё
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-md border border-line px-3 py-2 text-left hover:border-acc/40">
      <span>
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span className={`relative h-5 w-9 rounded-full transition ${value ? "bg-acc" : "bg-zinc-700"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition ${value ? "left-4.5 translate-x-0.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/* ---------- Shop ---------- */

export function ShopModal({ me, onClose, onBought, onError }: { me: Me; onClose: () => void; onBought: (u: Me, msg: string, unlocked: Achievement[]) => void; onError: (e: unknown) => void }) {
  const [owned, setOwned] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    void api<{ owned: string[] }>("/api/me").then((d) => setOwned(d.owned)).catch(() => {});
  }, []);
  const buy = async (item: string) => {
    setBusy(item);
    try {
      const data = await api<{ user: Me; message: string; unlocked: Achievement[] }>("/api/me", { method: "POST", json: { action: "buy", item } });
      setOwned((o) => (o.includes(item) ? o : [...o, item]));
      sounds.unlock();
      onBought(data.user, data.message, data.unlocked);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  };
  const equip = async (patch: { nameColor?: string; title?: string }) => {
    try {
      const data = await api<{ user: Me }>("/api/me", { method: "PATCH", json: patch });
      onBought(data.user, "Надето", []);
    } catch (e) {
      onError(e);
    }
  };
  return (
    <Modal title="Магазин бара" onClose={onClose} wide>
      <div className="mb-4 flex items-center justify-between rounded-md border border-line bg-black/20 px-3 py-2">
        <span className="text-sm text-muted">Твой счёт</span>
        <span className="font-display text-lg text-acc">🪙 {me.coins} дрэмов</span>
      </div>
      <div className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Цвет ника</div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(NAME_COLORS).map(([key, c]) => {
          const has = c.price === 0 || owned.includes(`color:${key}`);
          const active = me.nameColor === key;
          return (
            <button
              key={key}
              disabled={busy !== null}
              onClick={() => (has ? equip({ nameColor: key }) : buy(`color:${key}`))}
              className={`clip-corner-sm flex items-center justify-between border px-3 py-2 text-left text-sm transition ${active ? "border-acc bg-acc/10" : "border-line hover:border-acc/40"}`}
            >
              <span className="font-semibold" style={{ color: c.css, textShadow: `0 0 8px ${c.css}88` }}>
                {c.label}
              </span>
              <span className="font-display text-[10px] text-muted">{active ? "надето" : has ? "надеть" : `${c.price} 🪙`}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 font-display text-[10px] uppercase tracking-[0.25em] text-muted">Титулы</div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SHOP_TITLES.map((t) => {
          const has = owned.includes(`title:${t.id}`);
          const active = me.title === t.id;
          return (
            <button
              key={t.id}
              disabled={busy !== null}
              onClick={() => (has ? equip({ title: t.id }) : buy(`title:${t.id}`))}
              className={`clip-corner-sm flex items-center justify-between border px-3 py-2 text-left text-sm transition ${active ? "border-acc bg-acc/10" : "border-line hover:border-acc/40"}`}
            >
              <span>«{t.label}»</span>
              <span className="font-display text-[10px] text-muted">{active ? "надето" : has ? "надеть" : `${t.price} 🪙`}</span>
            </button>
          );
        })}
        {me.title && (
          <button onClick={() => equip({ title: "" })} className="clip-corner-sm border border-line px-3 py-2 text-left text-sm text-muted hover:border-acc/40">
            Снять титул
          </button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">Дрэмы капают за сообщения (1 за каждые 10), ежедневный дрэм (10+) и когда тебя угощают через /cheers (3).</p>
    </Modal>
  );
}

/* ---------- Leaderboard ---------- */

type BoardRow = { id: number; username: string; displayName: string; nameColor: string; title: string; xp: number; level: number; rank: string; place: number; messagesCount: number; cheersReceived: number };

export function BoardModal({ meId, onClose, onProfile }: { meId: number; onClose: () => void; onProfile: (id: number) => void }) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  useEffect(() => {
    void api<{ leaderboard: BoardRow[] }>("/api/stats").then((d) => setRows(d.leaderboard)).catch(() => setRows([]));
  }, []);
  return (
    <Modal title="Доска почёта" onClose={onClose}>
      {!rows ? (
        <div className="text-center text-muted">…</div>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onProfile(r.id);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-acc/10 ${r.id === meId ? "bg-acc/5" : ""}`}
            >
              <span className={`w-7 font-display text-lg font-black ${r.place === 1 ? "neon-text" : r.place === 2 ? "neon-text-cyan" : r.place === 3 ? "neon-text-magenta" : "text-muted"}`}>{r.place}</span>
              <Avatar username={r.username} displayName={r.displayName} color={r.nameColor} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold" style={{ color: nameColor(r.nameColor) }}>
                  {r.displayName}
                </span>
                <span className="block text-[11px] text-muted">
                  {r.rank} · {r.level} ур. · {r.cheersReceived} 🍻
                </span>
              </span>
              <span className="font-display text-xs text-acc">{r.xp} XP</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ---------- Achievements ---------- */

export function AchievementsModal({ onClose }: { onClose: () => void }) {
  const [mine, setMine] = useState<Record<string, string>>({});
  useEffect(() => {
    void api<{ achievements: Array<Achievement & { unlockedAt: string }> }>("/api/me")
      .then((d) => setMine(Object.fromEntries(d.achievements.map((a) => [a.code, a.unlockedAt]))))
      .catch(() => {});
  }, []);
  const got = Object.keys(mine).length;
  return (
    <Modal title={`Награды · ${got}/${ACHIEVEMENTS.length}`} onClose={onClose} wide>
      <div className="grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const has = !!mine[a.code];
          return (
            <div key={a.code} className={`clip-corner-sm flex items-center gap-3 border p-3 ${has ? "border-acc/50 bg-acc/10" : "border-line opacity-60"}`}>
              <span className={`hex flex h-11 w-11 shrink-0 items-center justify-center text-2xl ${has ? "bg-acc/30" : "bg-black/40 grayscale"}`}>{a.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{a.title}</span>
                <span className="block text-xs text-muted">{a.description}</span>
                <span className="block text-[10px] text-acc/80">{has ? `открыто ${relTime(mine[a.code])}` : a.xp ? `+${a.xp} XP` : ""}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/* ---------- Daily result ---------- */

export function DailyModal({ result, onClose }: { result: { message: string; xpGain: number; coinGain: number; streak: number; whisky: { name: string; color: string } }; onClose: () => void }) {
  return (
    <Modal title="Ежедневный дрэм" onClose={onClose}>
      <div className="unlock-burst text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-6xl" style={{ background: `radial-gradient(circle, ${result.whisky.color}66, transparent 70%)` }}>
          🥃
        </div>
        <div className="mt-3 font-serif text-2xl font-semibold">{result.whisky.name}</div>
        <p className="mt-2 text-sm text-muted">{result.message}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["+" + result.xpGain, "XP"],
            ["+" + result.coinGain, "дрэмов"],
            [String(result.streak), "дн. серия"],
          ].map(([v, l]) => (
            <div key={l} className="panel clip-corner-sm py-2">
              <div className="font-display text-xl font-bold text-acc">{v}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">{l}</div>
            </div>
          ))}
        </div>
        <button className="btn-neon mt-5 w-full" onClick={onClose}>
          Slàinte!
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Search ---------- */

export function SearchModal({ channelId, onClose, onProfile }: { channelId: number; onClose: () => void; onProfile: (id: number) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<WireMessage[] | null>(null);
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      void api<{ results: WireMessage[] }>(`/api/search?channelId=${channelId}&q=${encodeURIComponent(q.trim())}`)
        .then((d) => setResults(d.results))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, channelId]);
  return (
    <Modal title="Поиск в зале" onClose={onClose} wide>
      <input className="field" autoFocus placeholder="Что ищем?" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
        {results?.length === 0 && <div className="py-6 text-center text-sm text-muted">Ничего. Даже бармен не помнит.</div>}
        {results?.map((m) => (
          <div key={m.id} className="rounded-md border border-line bg-black/20 p-3">
            <div className="flex items-center gap-2 text-xs">
              <button onClick={() => m.userId && onProfile(m.userId)} className="font-semibold" style={{ color: nameColor(m.nameColor) }}>
                {m.displayName}
              </button>
              <span className="text-muted">
                {relTime(m.createdAt)} · {formatTime(m.createdAt)}
              </span>
            </div>
            <div className="msg-content mt-1 text-sm" dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ---------- Command palette ---------- */

type PaletteItem = { id: string; icon: string; label: string; hint?: string; run: () => void };

export function CommandPalette({ rooms, dms, onClose, onOpen, onDm, onCommand }: { rooms: Room[]; dms: Dm[]; onClose: () => void; onOpen: (id: number) => void; onDm: (userId: number) => void; onCommand: (cmd: string) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [users, setUsers] = useState<Array<{ id: number; username: string; displayName: string; online: boolean }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    const t = setTimeout(() => {
      void api<{ users: typeof users }>(`/api/users?q=${encodeURIComponent(q)}`).then((d) => setUsers(d.users)).catch(() => {});
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const items = useMemo<PaletteItem[]>(() => {
    const ql = q.toLowerCase();
    const actions: PaletteItem[] = [
      { id: "a:daily", icon: "🥃", label: "Забрать ежедневный дрэм", run: () => onCommand("daily") },
      { id: "a:create", icon: "🏗️", label: "Открыть новый зал", run: () => onCommand("createRoom") },
      { id: "a:shop", icon: "🛍️", label: "Магазин бара", run: () => onCommand("shop") },
      { id: "a:board", icon: "📊", label: "Доска почёта", run: () => onCommand("board") },
      { id: "a:ach", icon: "🏆", label: "Мои награды", run: () => onCommand("achievements") },
      { id: "a:settings", icon: "⚙️", label: "Настройки и темы", run: () => onCommand("settings") },
      { id: "a:search", icon: "🔍", label: "Поиск в текущем зале", run: () => onCommand("search") },
    ];
    const roomItems: PaletteItem[] = rooms.map((r) => ({ id: `r:${r.id}`, icon: r.icon, label: r.name, hint: `зал · ${r.members} чел.`, run: () => onOpen(r.id) }));
    const dmItems: PaletteItem[] = dms.map((d) => ({ id: `d:${d.id}`, icon: "🤫", label: d.partner?.displayName ?? "Призрак", hint: "личный чат", run: () => onOpen(d.id) }));
    const userItems: PaletteItem[] = users.map((u) => ({ id: `u:${u.id}`, icon: u.online ? "🟢" : "⚪", label: u.displayName, hint: `@${u.username} · написать`, run: () => onDm(u.id) }));
    const cmdItems: PaletteItem[] = COMMANDS.map((c) => ({ id: `c:${c.cmd}`, icon: "🤖", label: c.cmd, hint: c.desc, run: () => onClose() }));
    const all = [...roomItems, ...dmItems, ...actions, ...userItems, ...(ql.startsWith("/") ? cmdItems : [])];
    if (!ql) return all.slice(0, 14);
    return all.filter((i) => i.label.toLowerCase().includes(ql) || i.hint?.toLowerCase().includes(ql)).slice(0, 14);
  }, [q, rooms, dms, users, onCommand, onOpen, onDm, onClose]);

  useEffect(() => setIdx(0), [items.length]);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="glass pop-in clip-corner w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="font-display text-xs text-acc">›_</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => (i + 1) % Math.max(1, items.length));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => (i - 1 + items.length) % Math.max(1, items.length));
              } else if (e.key === "Enter" && items[idx]) items[idx].run();
            }}
            placeholder="Зал, человек, действие или /команда…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted/60"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {items.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">Пусто. Бармен пожимает плечами.</div>}
          {items.map((it, i) => (
            <button key={it.id} onMouseEnter={() => setIdx(i)} onClick={it.run} className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${i === idx ? "bg-acc/15" : ""}`}>
              <span className="w-6 text-center">{it.icon}</span>
              <span className="flex-1 truncate">{it.label}</span>
              {it.hint && <span className="truncate text-xs text-muted">{it.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Profile panel ---------- */

export function ProfilePanel({ userId, meId, onClose, onDm, onCheers }: { userId: number; meId: number; onClose: () => void; onDm: (id: number) => void; onCheers: (username: string) => void }) {
  const [u, setU] = useState<Profile | null>(null);
  useEffect(() => {
    setU(null);
    void api<{ user: Profile }>(`/api/users/${userId}`).then((d) => setU(d.user)).catch(() => {});
  }, [userId]);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Профиль</span>
        <button onClick={onClose} className="text-muted hover:text-ink">
          ✕
        </button>
      </div>
      {!u ? (
        <div className="p-6 text-center text-muted">…</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative overflow-hidden rounded-md border border-line bg-black/20 p-4 text-center">
            <div className="absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full blur-3xl" style={{ background: `${nameColor(u.nameColor)}33` }} />
            <div className="relative">
              <Avatar username={u.username} displayName={u.displayName} color={u.nameColor} size={72} isBot={u.isBot} online={u.online} className="mx-auto" />
              <div className="mt-3 text-lg font-bold" style={{ color: nameColor(u.nameColor) }}>
                {u.displayName}
              </div>
              <div className="text-xs text-muted">@{u.username}</div>
              {u.title && <div className="mt-1 font-serif text-base italic text-ink/85">«{u.title}»</div>}
              {u.status && <div className="mt-2 text-sm text-ink/80">{u.status}</div>}
              <div className="mt-3 flex items-center justify-center gap-2 font-display text-[10px] uppercase tracking-widest">
                <span className="rounded-sm bg-acc/15 px-2 py-0.5 text-acc">
                  {u.level} ур. · {u.rank}
                </span>
              </div>
              <div className="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-black/40">
                <div className="liquid h-full" style={{ width: `${Math.max(3, u.levelPct)}%` }} />
              </div>
            </div>
          </div>
          {u.id !== meId && !u.isBot && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn-neon !py-2 !text-[10px]" onClick={() => onDm(u.id)}>
                ✉ Написать
              </button>
              <button className="btn-ghost !py-2 !text-[10px]" onClick={() => onCheers(u.username)}>
                🍻 Угостить
              </button>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              [u.messagesCount, "сообщ."],
              [u.cheersReceived, "🍻 получ."],
              [u.xp, "XP"],
            ].map(([v, l]) => (
              <div key={l as string} className="panel clip-corner-sm py-2">
                <div className="font-display text-base font-bold text-acc">{v}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted">{l}</div>
              </div>
            ))}
          </div>
          {(u.bio || u.favoriteWhisky) && (
            <div className="mt-4 space-y-2 text-sm">
              {u.bio && <p className="text-ink/85">{u.bio}</p>}
              {u.favoriteWhisky && (
                <p className="text-muted">
                  🥃 Любимый виски: <span className="text-ink">{u.favoriteWhisky}</span>
                </p>
              )}
            </div>
          )}
          <div className="mt-4">
            <div className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">
              Награды · {u.achievements.length}/{ACHIEVEMENTS.length}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {u.achievements.length === 0 && <span className="text-xs text-muted">Пока пусто — всё впереди.</span>}
              {u.achievements.map((a) => (
                <span key={a.code} title={`${a.title} — ${a.description}`} className="hex flex h-9 w-9 cursor-help items-center justify-center bg-acc/20 text-lg">
                  {a.icon}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 text-[11px] text-muted">
            В баре с {new Date(u.createdAt).toLocaleDateString("ru-RU")} · {u.online ? "сейчас у стойки" : `был(а) ${relTime(u.lastSeen)}`}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Channel info panel ---------- */

export function ChannelInfoPanel({ channel, members, pinned, meId, onClose, onProfile, onLeave, onUnpin }: { channel: ChannelInfo | null; members: OnlineUser[]; pinned: WireMessage[]; meId: number; onClose: () => void; onProfile: (id: number) => void; onLeave: (id: number) => void; onUnpin: (m: WireMessage) => void }) {
  const [tab, setTab] = useState<"pinned" | "members">(pinned.length ? "pinned" : "members");
  if (!channel) return null;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">{channel.type === "dm" ? "Личный чат" : "О зале"}</span>
        <button onClick={onClose} className="text-muted hover:text-ink">
          ✕
        </button>
      </div>
      <div className="border-b border-line p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{channel.type === "dm" ? "🤫" : channel.icon}</span>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold uppercase tracking-widest">{channel.name}</div>
            <div className="text-[11px] text-muted">с {new Date(channel.createdAt).toLocaleDateString("ru-RU")}</div>
          </div>
        </div>
        {channel.description && <p className="mt-3 text-sm text-ink/85">{channel.description}</p>}
        {channel.topic && (
          <p className="mt-2 text-xs text-muted">
            📝 Тема: <span className="text-ink/80">{channel.topic}</span>
          </p>
        )}
        {channel.type === "room" && channel.slug !== "lobby" && (
          <button onClick={() => onLeave(channel.id)} className="mt-3 text-xs text-red-300/80 hover:text-red-300">
            🚶 Выйти из зала
          </button>
        )}
      </div>
      <div className="flex border-b border-line">
        {(["pinned", "members"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-underline relative flex-1 py-2 font-display text-[10px] uppercase tracking-[0.2em] ${tab === t ? "active text-acc" : "text-muted"}`}>
            {t === "pinned" ? `📌 Стена (${pinned.length})` : `👥 Гости (${members.length})`}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "pinned" &&
          (pinned.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">На стене пусто. ПКМ по сообщению → «Закрепить».</div>
          ) : (
            <div className="space-y-2">
              {pinned.map((m) => (
                <div key={m.id} className="rounded-md border border-line bg-black/20 p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold" style={{ color: nameColor(m.nameColor) }}>
                      {m.displayName}
                    </span>
                    <button onClick={() => onUnpin(m)} className="text-muted hover:text-ink" title="Открепить">
                      ✕
                    </button>
                  </div>
                  <div className="msg-content mt-1 text-sm" dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
                </div>
              ))}
            </div>
          ))}
        {tab === "members" && (
          <div className="space-y-0.5">
            {members.map((u) => (
              <button key={u.id} onClick={() => onProfile(u.id)} className="nav-item !py-1">
                <Avatar username={u.username} displayName={u.displayName} color={u.nameColor} size={26} online={u.online} isBot={u.isBot} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm" style={{ color: nameColor(u.nameColor) }}>
                    {u.displayName}
                    {u.id === meId && <span className="ml-1 text-[10px] text-muted">(ты)</span>}
                  </span>
                  <span className="block truncate text-[11px] text-muted">{u.title ? `«${u.title}» · ` : ""}{u.level} ур.</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */

export type Toast = { id: number; kind: "info" | "error" | "unlock"; title: string; text?: string; icon?: string };

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`toast-in pointer-events-auto clip-corner-sm flex items-start gap-3 border p-3 text-left shadow-2xl ${
            t.kind === "unlock" ? "neon-border bg-[var(--panel)]" : t.kind === "error" ? "border-red-500/50 bg-[#1a0a0a]" : "border-line bg-[var(--panel)]"
          }`}
        >
          {t.kind === "unlock" && <span className="unlock-burst hex flex h-10 w-10 shrink-0 items-center justify-center bg-acc/30 text-xl">{t.icon}</span>}
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${t.kind === "error" ? "text-red-300" : t.kind === "unlock" ? "neon-text" : "text-ink"}`}>{t.title}</span>
            {t.text && <span className="block text-xs text-muted">{t.text}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
