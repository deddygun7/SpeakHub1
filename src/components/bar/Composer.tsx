"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { type ChannelInfo, type OnlineUser, type WireMessage } from "@/components/bar/core";
import { COMMANDS } from "@/lib/bartender";
import { EMOJI_SET } from "@/lib/game";

type Props = {
  channel: ChannelInfo;
  replyTo: WireMessage | null;
  editing: WireMessage | null;
  members: OnlineUser[];
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onTyping: () => void;
  onSend: (content: string) => Promise<boolean>;
};

export default function Composer(p: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState(0);
  const ta = useRef<HTMLTextAreaElement>(null);
  const draftKey = `nd_draft_${p.channel.id}`;

  useEffect(() => {
    const d = localStorage.getItem(draftKey);
    if (d) setText(d);
    ta.current?.focus();
  }, [draftKey]);

  useEffect(() => {
    if (p.editing) {
      setText(p.editing.content);
      ta.current?.focus();
    }
  }, [p.editing]);

  useEffect(() => {
    if (p.replyTo) ta.current?.focus();
  }, [p.replyTo]);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [text]);

  // suggestions: slash commands or @mentions
  const suggestions = useMemo(() => {
    if (text.startsWith("/") && !text.includes(" ")) {
      return COMMANDS.filter((c) => c.cmd.startsWith(text.toLowerCase())).map((c) => ({ key: c.cmd, label: `${c.cmd}${c.args ? " " + c.args : ""}`, hint: c.desc, insert: c.cmd + " " }));
    }
    const m = /(^|\s)@([a-z0-9_]*)$/i.exec(text);
    if (m) {
      const q = m[2].toLowerCase();
      return p.members
        .filter((u) => u.username.includes(q) || u.displayName.toLowerCase().includes(q))
        .slice(0, 6)
        .map((u) => ({ key: u.username, label: `@${u.username}`, hint: u.displayName, insert: text.slice(0, text.length - m[2].length) + u.username + " " }));
    }
    return [];
  }, [text, p.members]);

  useEffect(() => setSuggestIdx(0), [suggestions.length]);

  const applySuggestion = (s: { insert: string; key: string }) => {
    setText(s.insert.startsWith("/") || !s.insert.includes("@") ? s.insert : s.insert);
    ta.current?.focus();
  };

  const submit = async () => {
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    const ok = await p.onSend(content);
    setBusy(false);
    if (ok) {
      setText("");
      localStorage.removeItem(draftKey);
      setEmojiOpen(false);
      ta.current?.focus();
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && text.startsWith("/") && !text.includes(" "))) {
        e.preventDefault();
        applySuggestion(suggestions[suggestIdx]);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
    if (e.key === "Escape") {
      if (p.editing) p.onCancelEdit();
      if (p.replyTo) p.onCancelReply();
      setEmojiOpen(false);
    }
  };

  const onChange = (v: string) => {
    setText(v);
    p.onTyping();
    if (!p.editing) {
      if (v) localStorage.setItem(draftKey, v);
      else localStorage.removeItem(draftKey);
    }
  };

  return (
    <div className="relative border-t border-line bg-[var(--panel)] px-3 py-3 sm:px-5">
      {(p.replyTo || p.editing) && (
        <div className="pop-in mb-2 flex items-center gap-2 border-l-2 border-acc bg-acc/5 px-3 py-1.5 text-xs">
          <span className="text-acc">{p.editing ? "✏️ Редактирование" : `↩ Ответ @${p.replyTo?.username}`}</span>
          {p.replyTo && <span className="truncate text-muted">{p.replyTo.content.slice(0, 100)}</span>}
          <button className="ml-auto text-muted hover:text-ink" onClick={p.editing ? p.onCancelEdit : p.onCancelReply}>
            ✕
          </button>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="glass pop-in absolute bottom-full left-3 right-3 z-30 mb-1 max-h-64 overflow-y-auto rounded-md py-1 sm:left-5 sm:right-auto sm:w-96">
          {suggestions.map((s, i) => (
            <button
              key={s.key}
              onMouseEnter={() => setSuggestIdx(i)}
              onClick={() => applySuggestion(s)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm ${i === suggestIdx ? "bg-acc/15" : ""}`}
            >
              <span className="font-display text-xs text-acc">{s.label}</span>
              <span className="truncate text-xs text-muted">{s.hint}</span>
            </button>
          ))}
        </div>
      )}

      {emojiOpen && (
        <div className="glass pop-in absolute bottom-full right-3 z-30 mb-1 grid w-80 grid-cols-10 gap-0.5 rounded-md p-2 sm:right-5">
          {EMOJI_SET.map((e) => (
            <button
              key={e}
              onClick={() => {
                onChange(text + e);
                ta.current?.focus();
              }}
              className="rounded p-1 text-lg hover:bg-acc/20"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setEmojiOpen((o) => !o)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line text-lg transition hover:border-acc/50 ${emojiOpen ? "bg-acc/15" : "bg-black/30"}`}
          title="Эмодзи"
        >
          😎
        </button>
        <textarea
          ref={ta}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder={p.channel.type === "dm" ? "Шепни что-нибудь…" : `Написать в «${p.channel.name}»… (/ — команды, @ — упомянуть)`}
          className="field min-h-10 flex-1 resize-none !py-2.5"
          maxLength={2000}
        />
        <button onClick={() => void submit()} disabled={busy || !text.trim()} className="btn-neon h-10 !px-4 !py-0 text-xs">
          {busy ? "…" : p.editing ? "Сохранить" : "Отправить"}
        </button>
      </div>
      <div className="mt-1.5 hidden items-center gap-3 font-display text-[9px] uppercase tracking-widest text-muted sm:flex">
        <span>
          <span className="kbd">Enter</span> отправить
        </span>
        <span>
          <span className="kbd">Shift+Enter</span> новая строка
        </span>
        <span>
          <span className="kbd">/</span> команды бармена
        </span>
        <span>
          <span className="kbd">Ctrl+K</span> палитра
        </span>
        <span className="ml-auto">{text.length}/2000</span>
      </div>
    </div>
  );
}
