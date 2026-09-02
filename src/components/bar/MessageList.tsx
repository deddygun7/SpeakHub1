"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { formatDay, formatTime, nameColor, renderContent, type ChannelInfo, type Me, type WireMessage } from "@/components/bar/core";
import { QUICK_EMOJI } from "@/lib/game";

type Props = {
  me: Me;
  messages: WireMessage[];
  loading: boolean;
  hasMore: boolean;
  typing: string[];
  channel: ChannelInfo | null;
  lockedRoom: { id: number; name: string; icon: string } | null;
  onLoadOlder: () => void;
  onReact: (m: WireMessage, emoji: string) => void;
  onReply: (m: WireMessage) => void;
  onEdit: (m: WireMessage) => void;
  onDelete: (m: WireMessage) => void;
  onPin: (m: WireMessage) => void;
  onProfile: (userId: number) => void;
  onUnlock: () => void;
};

type Ctx = { x: number; y: number; msg: WireMessage } | null;

export default function MessageList(p: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<Ctx>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [stick, setStick] = useState(true);
  const prevCount = useRef(0);
  const prevFirstId = useRef<number | null>(null);
  const prevHeight = useRef(0);

  // Keep scroll pinned to bottom when new messages arrive (if user is near bottom)
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const first = p.messages[0]?.id ?? null;
    if (prevFirstId.current !== null && first !== null && first < prevFirstId.current) {
      // older messages prepended -> keep viewport position
      el.scrollTop += el.scrollHeight - prevHeight.current;
    } else if (stick || prevCount.current === 0) {
      el.scrollTop = el.scrollHeight;
    }
    prevCount.current = p.messages.length;
    prevFirstId.current = first;
    prevHeight.current = el.scrollHeight;
  }, [p.messages, stick, p.typing.length]);

  useEffect(() => {
    const close = () => {
      setCtx(null);
      setPickerFor(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, []);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStick(nearBottom);
    if (el.scrollTop < 40 && p.hasMore && !p.loading) p.onLoadOlder();
  };

  const groups = useMemo(() => {
    const out: Array<{ day: string; items: Array<{ m: WireMessage; cont: boolean }> }> = [];
    let lastDay = "";
    let lastUser: number | null | undefined = undefined;
    let lastTime = 0;
    for (const m of p.messages) {
      const day = formatDay(m.createdAt);
      if (day !== lastDay) {
        out.push({ day, items: [] });
        lastDay = day;
        lastUser = undefined;
      }
      const t = new Date(m.createdAt).getTime();
      const special = m.kind !== "text";
      const cont = !special && lastUser === m.userId && t - lastTime < 5 * 60_000;
      out[out.length - 1].items.push({ m, cont });
      lastUser = special ? undefined : m.userId;
      lastTime = t;
    }
    return out;
  }, [p.messages]);

  if (p.lockedRoom && !p.channel) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-6xl">🔐</div>
        <h2 className="font-display text-lg font-bold uppercase tracking-[0.2em]">{p.lockedRoom.name}</h2>
        <p className="max-w-sm text-muted">Закрытый зал. Вышибала смотрит выжидающе — нужен пароль.</p>
        <button className="btn-neon" onClick={p.onUnlock}>
          Назвать пароль
        </button>
      </div>
    );
  }

  return (
    <div ref={scroller} onScroll={onScroll} className="relative flex-1 overflow-y-auto px-3 py-4 sm:px-5">
      {p.loading && p.messages.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="font-display text-xs uppercase tracking-[0.3em] text-muted flicker">наливаем…</div>
        </div>
      )}
      {!p.loading && p.messages.length === 0 && p.channel && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div className="text-5xl">{p.channel.type === "dm" ? "🤫" : p.channel.icon}</div>
          <div className="font-display text-sm uppercase tracking-[0.2em]">Тихо, как перед первым тостом</div>
          <p className="max-w-sm text-sm text-muted">Скажи что-нибудь первым. Или позови бармена — напиши /help.</p>
        </div>
      )}
      {p.hasMore && p.messages.length > 0 && (
        <div className="mb-3 text-center">
          <button onClick={p.onLoadOlder} className="btn-ghost !py-1 !text-[10px]">
            ↑ раньше
          </button>
        </div>
      )}
      {groups.map((g) => (
        <div key={g.day}>
          <div className="day-sep my-4">{g.day}</div>
          {g.items.map(({ m, cont }) => (
            <MessageRow
              key={m.id}
              m={m}
              cont={cont}
              me={p.me}
              canDelete={m.userId === p.me.id || p.channel?.createdBy === p.me.id}
              onContext={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPickerFor(null);
                setCtx({ x: Math.min(e.clientX, window.innerWidth - 230), y: Math.min(e.clientY, window.innerHeight - 320), msg: m });
              }}
              pickerOpen={pickerFor === m.id}
              onTogglePicker={(e) => {
                e.stopPropagation();
                setCtx(null);
                setPickerFor((cur) => (cur === m.id ? null : m.id));
              }}
              onReact={(emoji) => {
                setPickerFor(null);
                p.onReact(m, emoji);
              }}
              onReply={() => p.onReply(m)}
              onProfile={p.onProfile}
            />
          ))}
        </div>
      ))}
      {p.typing.length > 0 && (
        <div className="pop-in mt-2 flex items-center gap-2 px-2 text-xs text-muted">
          <span className="flex gap-0.5">
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-acc" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-acc" style={{ animationDelay: "0.15s" }} />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-acc" style={{ animationDelay: "0.3s" }} />
          </span>
          {p.typing.slice(0, 3).join(", ")} {p.typing.length === 1 ? "печатает" : "печатают"}…
        </div>
      )}
      {!stick && (
        <button
          onClick={() => {
            const el = scroller.current;
            if (el) el.scrollTop = el.scrollHeight;
            setStick(true);
          }}
          className="btn-neon fixed bottom-24 right-6 z-20 !px-3 !py-2 !text-[10px]"
        >
          ↓ к свежему
        </button>
      )}

      {ctx && (
        <div className="glass pop-in fixed z-50 w-56 overflow-hidden rounded-md py-1 text-sm shadow-2xl" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1 px-2 py-1.5">
            {QUICK_EMOJI.slice(0, 6).map((e) => (
              <button
                key={e}
                onClick={() => {
                  p.onReact(ctx.msg, e);
                  setCtx(null);
                }}
                className="rounded px-1 text-lg hover:bg-acc/20"
              >
                {e}
              </button>
            ))}
          </div>
          <CtxItem
            icon="↩"
            label="Ответить"
            onClick={() => {
              p.onReply(ctx.msg);
              setCtx(null);
            }}
          />
          <CtxItem
            icon="📋"
            label="Копировать текст"
            onClick={() => {
              void navigator.clipboard?.writeText(ctx.msg.content);
              setCtx(null);
            }}
          />
          <CtxItem
            icon="📌"
            label={ctx.msg.isPinned ? "Открепить" : "Закрепить на стене"}
            onClick={() => {
              p.onPin(ctx.msg);
              setCtx(null);
            }}
          />
          {ctx.msg.userId && ctx.msg.userId !== p.me.id && (
            <CtxItem
              icon="👤"
              label="Профиль"
              onClick={() => {
                p.onProfile(ctx.msg.userId!);
                setCtx(null);
              }}
            />
          )}
          {ctx.msg.userId === p.me.id && !ctx.msg.deletedAt && ctx.msg.kind === "text" && (
            <CtxItem
              icon="✏️"
              label="Редактировать"
              onClick={() => {
                p.onEdit(ctx.msg);
                setCtx(null);
              }}
            />
          )}
          {(ctx.msg.userId === p.me.id || p.channel?.createdBy === p.me.id) && !ctx.msg.deletedAt && (
            <CtxItem
              icon="🗑"
              label="Удалить"
              danger
              onClick={() => {
                p.onDelete(ctx.msg);
                setCtx(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CtxItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-acc/15 ${danger ? "text-red-300" : ""}`}>
      <span className="w-5 text-center">{icon}</span>
      {label}
    </button>
  );
}

function MessageRow({
  m,
  cont,
  me,
  onContext,
  pickerOpen,
  onTogglePicker,
  onReact,
  onReply,
  onProfile,
}: {
  m: WireMessage;
  cont: boolean;
  me: Me;
  canDelete: boolean;
  onContext: (e: React.MouseEvent) => void;
  pickerOpen: boolean;
  onTogglePicker: (e: React.MouseEvent) => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onProfile: (id: number) => void;
}) {
  const mine = m.userId === me.id;
  const isBot = m.kind === "bot";
  const isSystem = m.kind === "system";
  const isMe = m.kind === "me";
  const mentioned = new RegExp(`@${me.username}\\b`, "i").test(m.content);

  if (isSystem) {
    return (
      <div className="my-1.5 text-center text-xs text-muted" onContextMenu={onContext}>
        <span className="rounded-sm border border-line bg-black/20 px-2 py-0.5">{m.content}</span>
      </div>
    );
  }

  return (
    <div
      onContextMenu={onContext}
      className={`msg-row group relative -mx-2 flex gap-3 rounded-md px-2 ${cont ? "py-0.5" : "mt-2 py-1"} hover:bg-white/[0.025] ${mentioned ? "bg-acc/[0.06] border-l-2 border-acc" : ""} ${m.isPinned ? "bg-cyan-neon/[0.04]" : ""}`}
    >
      <div className="w-9 shrink-0">
        {!cont ? (
          <button onClick={() => m.userId && onProfile(m.userId)} title={`@${m.username}`}>
            <Avatar username={m.username} displayName={m.displayName} color={m.nameColor} size={36} isBot={isBot} />
          </button>
        ) : (
          <span className="block pt-1 text-right font-mono text-[10px] text-muted opacity-0 group-hover:opacity-100">{formatTime(m.createdAt)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!cont && (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <button onClick={() => m.userId && onProfile(m.userId)} className={`font-semibold hover:underline ${isBot ? "neon-text-cyan" : ""}`} style={isBot ? undefined : { color: nameColor(m.nameColor) }}>
              {m.displayName}
            </button>
            {m.title && <span className="text-[11px] text-muted">«{m.title}»</span>}
            {!isBot && <span className="rounded-sm border border-line px-1 font-display text-[9px] text-muted">{m.level} ур.</span>}
            {isBot && <span className="rounded-sm bg-cyan-neon/15 px-1 font-display text-[9px] uppercase tracking-widest text-cyan-neon">бот</span>}
            <span className="font-mono text-[10px] text-muted">{formatTime(m.createdAt)}</span>
            {m.isPinned && <span className="text-[10px]">📌</span>}
          </div>
        )}
        {m.replyTo && (
          <div className="mt-0.5 mb-1 flex items-center gap-1.5 border-l-2 border-acc/50 pl-2 text-xs text-muted">
            <span className="text-acc">@{m.replyTo.username}</span>
            <span className="truncate">{m.replyTo.content}</span>
          </div>
        )}
        {m.deletedAt ? (
          <div className="text-sm italic text-muted/70">— сообщение растворилось в дыму —</div>
        ) : isMe ? (
          <div className="text-[15px] italic text-ink/85">
            <span style={{ color: nameColor(m.nameColor) }}>* {m.displayName}</span> <span dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
          </div>
        ) : (
          <div
            className={`msg-content break-words text-[15px] leading-relaxed ${isBot ? "rounded-md border border-cyan-neon/20 bg-cyan-neon/[0.05] px-3 py-2 whitespace-pre-wrap" : "text-ink/95"}`}
            dangerouslySetInnerHTML={{ __html: renderContent(m.content) }}
          />
        )}
        {m.editedAt && !m.deletedAt && <span className="ml-1 text-[10px] text-muted">(изменено)</span>}
        {m.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(r.emoji)}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${r.mine ? "border-acc/60 bg-acc/15 text-ink" : "border-line bg-black/20 text-muted hover:border-acc/40"}`}
              >
                <span>{r.emoji}</span>
                <span className="font-display">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!m.deletedAt && (
        <div className="msg-actions absolute -top-3 right-2 flex items-center gap-0.5 rounded-md border border-line bg-[var(--panel-2)] px-1 py-0.5 shadow-lg">
          {QUICK_EMOJI.slice(0, 3).map((e) => (
            <button key={e} onClick={() => onReact(e)} className="rounded px-1 text-sm hover:bg-acc/20">
              {e}
            </button>
          ))}
          <button onClick={onTogglePicker} className="rounded px-1.5 text-xs text-muted hover:bg-acc/20 hover:text-ink" title="Ещё реакции">
            ＋
          </button>
          <button onClick={onReply} className="rounded px-1.5 text-xs text-muted hover:bg-acc/20 hover:text-ink" title="Ответить">
            ↩
          </button>
          <button onClick={onContext} className="rounded px-1.5 text-xs text-muted hover:bg-acc/20 hover:text-ink" title="Ещё">
            ⋯
          </button>
          {pickerOpen && (
            <div className="glass pop-in absolute right-0 top-7 z-30 grid w-64 grid-cols-8 gap-0.5 rounded-md p-2" onClick={(e) => e.stopPropagation()}>
              {QUICK_EMOJI.concat(["🎉", "🤣", "😢", "🙏", "🫶", "🍷", "🧊", "🌙", "😈", "🤖", "💣", "🎲"]).map((e) => (
                <button key={e} onClick={() => onReact(e)} className="rounded p-1 text-lg hover:bg-acc/20">
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {mine && <span className="sr-only">твоё сообщение</span>}
    </div>
  );
}
