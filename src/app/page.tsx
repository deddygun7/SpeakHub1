import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPublicStats } from "@/lib/stats";
import { WHISKIES, WHISKY_FACTS, whiskyOfTheDay } from "@/lib/bartender";
import { BoardPreview, Counter, GlassIcon, LandingNav, LiveTicker, WhiskyMenu } from "@/components/Landing";

export const dynamic = "force-dynamic";

const PERKS = [
  { icon: "🤖", title: "Бармен-бот", text: "Живёт за стойкой. /pour, /cheers, /roll, /8ball, /hack и ещё дюжина команд. Отвечает, если позвать по имени." },
  { icon: "🎖️", title: "Уровни и ранги", text: "XP за каждое сообщение. От «Новичка» до «Нетраннер-Мастера». Прогресс виден всем — как янтарь в стакане." },
  { icon: "🏆", title: "16 достижений", text: "Ночная сова, Хозяин заведения, Шёпот в неоне… Открываются сами, всплывают с фанфарами." },
  { icon: "🥃", title: "Ежедневный дрэм", text: "Заходи каждый день — бармен наливает XP и дрэмы. Серия растёт, бонус растёт." },
  { icon: "🛍️", title: "Магазин бара", text: "Трать дрэмы на неоновые цвета ника и титулы: «Бутлегер», «Босс бара», «Призрак сети»." },
  { icon: "🔐", title: "Закрытые залы", text: "Свои комнаты с паролем. VIP-лаунж уже ждёт — пароль подскажет описание." },
  { icon: "🤫", title: "Личные сообщения", text: "Шёпот в неоне: приватные диалоги, непрочитанные, статус онлайн." },
  { icon: "⚡", title: "Реакции и ответы", text: "Эмодзи-реакции, цитирование, закреплённые сообщения, редактирование, поиск по залу." },
  { icon: "⌘", title: "Командная палитра", text: "Ctrl+K — и весь бар под пальцами: залы, люди, команды. Как в хорошем терминале." },
  { icon: "🎨", title: "4 неоновые темы", text: "Янтарный виски, Неоновый лёд, Ночной клуб, Матрица. Плюс CRT-сканлайны и синтезированные звуки." },
  { icon: "👀", title: "Кто у стойки", text: "Список онлайн, индикатор «печатает…», профили с достижениями по клику на любого." },
  { icon: "🍻", title: "Карма-угощения", text: "/cheers @ник — угости, подари XP и дрэмы. Самых щедрых и популярных видно на доске почёта." },
];

export default async function HomePage() {
  const [me, stats] = await Promise.all([getCurrentUser(), getPublicStats()]);
  const today = whiskyOfTheDay();
  const fact = WHISKY_FACTS[Math.floor(Date.now() / 86_400_000) % WHISKY_FACTS.length];

  return (
    <main className="relative overflow-x-hidden">
      <LandingNav loggedIn={!!me} />

      {/* HERO */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-24">
        <div className="smoke" />
        <div className="scan-beam" />
        <div className="grid-floor absolute inset-x-[-20%] bottom-[-10%] h-[55%]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 lg:grid-cols-[1.2fr_1fr]">
          <div className="slide-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-sm border border-line bg-black/30 px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.3em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full online-dot" />
              {stats.online > 0 ? `${stats.online} у стойки прямо сейчас` : "бар открыт · вход свободный"}
            </div>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5.6rem)] font-black leading-[0.95] tracking-tight">
              <span className="glitch block text-ink" data-text="NEON">
                NEON
              </span>
              <span className="glitch neon-text block flicker" data-text="DRAM">
                DRAM
              </span>
            </h1>
            <p className="mt-6 max-w-xl font-serif text-2xl italic leading-snug text-ink/90">
              Виски-бар в неоновой сети. Место, где янтарь в стакане встречается с холодным светом вывесок — и где всегда есть с кем поговорить.
            </p>
            <p className="mt-4 max-w-xl text-base text-muted">
              Залы по интересам, личные сообщения, бармен-бот с командами, уровни, достижения, закрытые комнаты и магазин неоновых ников. Всё, что должно быть у хорошего чата — и немного больше.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={me ? "/bar" : "/enter?mode=register"} className="btn-neon text-sm">
                {me ? "Вернуться к стойке" : "Занять стул у стойки"}
              </Link>
              <a href="#perks" className="btn-ghost">
                Что тут есть
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              <Counter value={stats.members} label="гостей" />
              <Counter value={stats.total} label="сообщений" accent="cyan" />
              <Counter value={stats.rooms} label="залов" accent="magenta" />
              <Counter value={stats.today} label="за сутки" />
            </div>
          </div>

          {/* Whisky of the day card */}
          <div className="slide-up relative" style={{ animationDelay: "0.15s" }}>
            <div className="absolute -inset-6 rounded-full bg-acc/10 blur-3xl" />
            <div className="glass clip-corner float relative p-7">
              <div className="flex items-center justify-between">
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-muted">Дрэм дня</span>
                <span className="rounded-sm bg-acc px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-black">
                  {today.price}¢
                </span>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <GlassIcon color={today.color} size={84} />
                <div>
                  <div className="font-serif text-3xl font-semibold leading-tight text-ink">{today.name}</div>
                  <div className="mt-1 text-sm text-muted">{today.region}</div>
                  <div className="mt-1 font-display text-xs tracking-widest text-acc">
                    {today.abv}% · {today.age}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {today.notes.map((n) => (
                  <span key={n} className="rounded-sm border border-line bg-black/30 px-2 py-1 text-xs text-ink/80">
                    {n}
                  </span>
                ))}
              </div>
              <div className="mt-6 border-t border-line pt-4">
                <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted">Бармен говорит</div>
                <p className="mt-2 font-serif text-lg italic leading-snug text-ink/90">«{fact}»</p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center font-display text-[10px] uppercase tracking-widest text-muted">
                <div className="panel clip-corner-sm py-2">
                  <div className="text-base text-acc">+50</div>XP в день
                </div>
                <div className="panel clip-corner-sm py-2">
                  <div className="text-base neon-text-cyan">16</div>наград
                </div>
                <div className="panel clip-corner-sm py-2">
                  <div className="text-base neon-text-magenta">15</div>команд
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE TICKER */}
      <section id="live">
        <LiveTicker items={stats.ticker} />
      </section>

      {/* PERKS */}
      <section id="perks" className="mx-auto max-w-7xl px-5 py-24">
        <SectionTitle kicker="Полный фарш" title="Плюшки, ради которых остаются" sub="Не просто чат. Бар с характером: механики, которые затягивают, и мелочи, которые радуют." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p, i) => (
            <div key={p.title} className="panel card-tilt clip-corner group relative overflow-hidden p-6" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-acc/10 blur-2xl transition group-hover:bg-acc/25" />
              <div className="flex items-center gap-3">
                <span className="hex flex h-11 w-11 items-center justify-center bg-gradient-to-br from-acc/30 to-acc/5 text-2xl">{p.icon}</span>
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-ink">{p.title}</h3>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-line bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-3">
          {[
            { n: "01", t: "Занимаешь стул", d: "Ник, пароль, 20 секунд. Никаких почт и подтверждений — бар не спрашивает документы." },
            { n: "02", t: "Выбираешь зал", d: "Главный зал, Торф и дым, Нетраннеры, Джаз-подвал, Ночная смена. Или открываешь свой — хоть с паролем." },
            { n: "03", t: "Наливаешь и общаешься", d: "Пиши, реагируй, угощай, зови бармена. XP капает, достижения открываются, ник становится неоновым." },
          ].map((s) => (
            <div key={s.n} className="relative pl-16">
              <span className="absolute left-0 top-0 font-display text-5xl font-black text-acc/20">{s.n}</span>
              <h3 className="font-display text-base font-bold uppercase tracking-[0.15em] text-ink">{s.t}</h3>
              <p className="mt-3 text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="mx-auto max-w-7xl px-5 py-24">
        <SectionTitle kicker="Меню бара" title="Что сегодня наливаем" sub="Интерактивная карта: выбирай регион, нажимай на бутылку — узнаешь ноты, крепость и как заказать в чате." />
        <div className="mt-12">
          <WhiskyMenu items={WHISKIES} today={today.name} />
        </div>
      </section>

      {/* BOARD */}
      <section id="board" className="mx-auto max-w-7xl px-5 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <SectionTitle kicker="Доска почёта" title="Легенды бара" sub="Топ по опыту. Каждое сообщение, реакция, угощение и ежедневный дрэм двигают выше." />
            <div className="mt-8 space-y-3 text-muted">
              <p>
                <span className="text-acc">Ранги:</span> Новичок → Дегустатор → Ценитель → Сомелье → Мастер купажа → Легенда бара → Нетраннер-Мастер.
              </p>
              <p>
                <span className="text-acc">Дрэмы</span> — внутренняя валюта. Капают за общение и ежедневные визиты, тратятся на цвета ника и титулы.
              </p>
              <Link href={me ? "/bar" : "/enter"} className="btn-ghost mt-4">
                Попасть в список
              </Link>
            </div>
          </div>
          <BoardPreview rows={stats.leaderboard} />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-line">
        <div className="smoke" />
        <div className="relative mx-auto max-w-4xl px-5 py-28 text-center">
          <div className="font-display text-[10px] uppercase tracking-[0.35em] text-muted">Бар открыт 24/7</div>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,5vw,3.4rem)] font-black leading-tight">
            Первый дрэм — <span className="neon-text">за счёт заведения</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif text-xl italic text-ink/80">
            Стул у стойки свободен. Неон уже горит. Осталось зайти.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={me ? "/bar" : "/enter?mode=register"} className="btn-neon text-sm">
              {me ? "В бар →" : "Зарегистрироваться"}
            </Link>
            {!me && (
              <Link href="/enter" className="btn-ghost">
                У меня уже есть стул
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center font-display text-[10px] uppercase tracking-[0.3em] text-muted">
        NEON DRAM · виски-бар в неоновой сети · пей ответственно, пиши осмысленно
      </footer>
    </main>
  );
}

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="max-w-2xl">
      <div className="font-display text-[10px] uppercase tracking-[0.35em] text-acc">{kicker}</div>
      <h2 className="mt-3 font-display text-[clamp(1.6rem,4vw,2.6rem)] font-black leading-tight text-ink">{title}</h2>
      <p className="mt-4 text-lg text-muted">{sub}</p>
    </div>
  );
}
