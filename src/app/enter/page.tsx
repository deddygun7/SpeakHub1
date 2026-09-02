import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import EnterForm from "@/components/EnterForm";
import { whiskyOfTheDay } from "@/lib/bartender";
import { GlassIcon } from "@/components/Landing";

export const dynamic = "force-dynamic";

export default async function EnterPage() {
  const me = await getCurrentUser();
  if (me) redirect("/bar");
  const w = whiskyOfTheDay();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="smoke" />
      <div className="scan-beam" />
      <div className="grid-floor absolute inset-x-[-20%] bottom-[-10%] h-[50%]" />
      <div className="relative grid w-full max-w-4xl overflow-hidden lg:grid-cols-[1fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between border border-line bg-black/40 p-8 lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <span className="hex flex h-10 w-10 items-center justify-center bg-gradient-to-br from-[#ffd27a] via-acc to-acc-2 text-xl">🥃</span>
            <span className="font-display text-lg font-black tracking-[0.25em]">
              NEON<span className="neon-text">DRAM</span>
            </span>
          </Link>
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted">Сегодня наливаем</div>
            <div className="mt-3 flex items-center gap-4">
              <GlassIcon color={w.color} size={64} />
              <div>
                <div className="font-serif text-2xl font-semibold">{w.name}</div>
                <div className="text-sm text-muted">{w.region}</div>
              </div>
            </div>
            <p className="mt-8 font-serif text-xl italic leading-snug text-ink/85">
              «Хороший бар — это не про алкоголь. Это про то, что тебя здесь помнят.»
            </p>
            <p className="mt-2 font-display text-[10px] uppercase tracking-[0.25em] text-muted">— Бармен</p>
          </div>
          <ul className="space-y-1.5 text-sm text-muted">
            <li>· без почты и подтверждений</li>
            <li>· первый дрэм — за счёт заведения</li>
            <li>· VIP-лаунж открывается паролем «neon»</li>
          </ul>
        </aside>
        <section className="glass clip-corner p-8 sm:p-10">
          <Suspense fallback={null}>
            <EnterForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
