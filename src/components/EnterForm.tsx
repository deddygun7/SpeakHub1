"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, sounds } from "@/components/bar/core";

export default function EnterForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(params.get("mode") === "register" ? "register" : "login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api(`/api/auth/${mode}`, { method: "POST", json: { username, password, displayName } });
      sounds.pour();
      router.push("/bar");
      router.refresh();
    } catch (err) {
      sounds.error();
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
      setBusy(false);
    }
  }

  return (
    <div className="pop-in">
      <Link href="/" className="mb-6 flex items-center gap-3 lg:hidden">
        <span className="hex flex h-9 w-9 items-center justify-center bg-gradient-to-br from-[#ffd27a] via-acc to-acc-2 text-lg">🥃</span>
        <span className="font-display text-base font-black tracking-[0.25em]">
          NEON<span className="neon-text">DRAM</span>
        </span>
      </Link>
      <div className="flex border-b border-line">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`tab-underline relative flex-1 pb-3 font-display text-xs font-bold uppercase tracking-[0.25em] transition ${mode === m ? "active text-acc" : "text-muted hover:text-ink"}`}
          >
            {m === "login" ? "Вход" : "Новый гость"}
          </button>
        ))}
      </div>

      <h1 className="mt-7 font-display text-2xl font-black leading-tight">
        {mode === "login" ? (
          <>
            С возвращением, <span className="neon-text">гость</span>
          </>
        ) : (
          <>
            Занять стул <span className="neon-text">у стойки</span>
          </>
        )}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "login" ? "Бармен помнит твой стакан. Назови ник и пароль." : "Ник — латиницей, пароль — от 6 символов. Имя можно любое, хоть неоновое."}
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block">
          <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Ник</span>
          <input
            className="field mt-1.5 font-display tracking-wider"
            placeholder="neon_runner"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            autoComplete="username"
            required
            maxLength={20}
          />
        </label>
        {mode === "register" && (
          <label className="block">
            <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Имя в баре</span>
            <input className="field mt-1.5" placeholder="Как тебя называть?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={48} />
          </label>
        )}
        <label className="block">
          <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">Пароль</span>
          <input
            className="field mt-1.5"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </label>
        {error && <div className="clip-corner-sm border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
        <button className="btn-neon w-full text-sm" disabled={busy}>
          {busy ? "Наливаем…" : mode === "login" ? "Войти в бар" : "Зарегистрироваться"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-muted">
        {mode === "login" ? (
          <>
            Впервые здесь?{" "}
            <button className="text-acc hover:underline" onClick={() => setMode("register")}>
              Занять стул
            </button>
          </>
        ) : (
          <>
            Уже есть стул?{" "}
            <button className="text-acc hover:underline" onClick={() => setMode("login")}>
              Войти
            </button>
          </>
        )}
      </p>
    </div>
  );
}
