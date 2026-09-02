import Background from "./components/Background";
import VideoPlayer from "./components/VideoPlayer";
import ChatFeed from "./components/ChatFeed";
import ReactionsBar from "./components/ReactionsBar";

const MARQUEE = [
  "🔥 ЛЮБЛЮ МАТИ МАМУ ЮЗЕРА 🔥",
  "🍊 З ЧАТУ LFU 🍊",
  "💀 НАЙКРАЩИЙ КЛІП ТИЖНЯ 💀",
  "👁️ ТОП КОНТЕНТ 👁️",
  "🧡 LFU НАЗАВДЖДИ 🧡",
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-ember-600/30 bg-black/40 px-4 py-3 text-center backdrop-blur">
      <div className="bg-gradient-to-b from-ember-300 to-ember-600 bg-clip-text text-2xl font-black tabular-nums text-transparent sm:text-3xl">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">
      <Background />

      {/* top nav */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ember-400 to-ember-700 text-lg font-black text-black shadow-[0_0_24px_-4px_rgba(249,115,22,0.9)]">
            L
          </div>
          <div className="leading-none">
            <div className="text-lg font-black tracking-tight">
              LFU<span className="text-ember-500">.tv</span>
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              media network
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-300 sm:flex">
          <a href="#watch" className="transition hover:text-ember-400">Відео</a>
          <a href="#about" className="transition hover:text-ember-400">Про нас</a>
          <a href="#chat" className="transition hover:text-ember-400">Чат</a>
        </nav>
        <a
          href="#watch"
          className="rounded-full bg-ember-500 px-4 py-2 text-sm font-bold text-black shadow-[0_0_20px_-4px_rgba(249,115,22,0.9)] transition hover:scale-105 hover:bg-ember-400"
        >
          Дивитись ▶
        </a>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-2 pt-6 text-center sm:px-6 sm:pt-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ember-600/40 bg-ember-600/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ember-300">
          <span className="animate-pulse">🔴</span> ексклюзив з чату LFU
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          <span className="block bg-gradient-to-r from-ember-200 via-ember-400 to-orange-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
            Люблю мати маму Юзера
          </span>
          <span className="animate-glow mt-2 block text-white">
            з чату <span className="text-ember-500">LFU</span> 🔥
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm text-zinc-400 sm:text-base">
          Найбільш легендарний кліп мережі. Натисни play, качай звук на повну та
          занурюйся в атмосферу легендарного чату. 🍊🖤
        </p>

        <div className="mx-auto mt-7 grid max-w-md grid-cols-3 gap-3">
          <Stat value="1.3M" label="переглядів" />
          <Stat value="69K" label="лайків" />
          <Stat value="#1" label="тренд LFU" />
        </div>
      </section>

      {/* marquee */}
      <div className="relative z-10 my-8 overflow-hidden border-y border-ember-600/20 bg-ember-950/30 py-3">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span
              key={i}
              className="mx-6 text-sm font-black uppercase tracking-widest text-ember-400/80"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* video + chat */}
      <main
        id="watch"
        className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[1.6fr_1fr]"
      >
        <div className="space-y-4">
          <VideoPlayer />
          <ReactionsBar />

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black">
                Люблю мати маму Юзера, з чату LFU 🍊
              </h2>
              <p className="text-sm text-zinc-400">
                автор: <span className="text-ember-400">admin_LFU</span> • сьогодні
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {["#мем", "#LFU", "#мамаюзера", "#топ", "#відео"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-ember-600/30 bg-ember-600/10 px-3 py-1 text-ember-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div id="chat" className="h-[480px] lg:h-[620px]">
          <ChatFeed />
        </div>
      </main>

      {/* about / warning strip */}
      <section id="about" className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: "🔥",
              title: "Легендарний контент",
              text: "Кліп, який зробив чат LFU відомим на всю мережу. Класика жанру.",
            },
            {
              icon: "🎧",
              title: "Звук на повну",
              text: "Одягай навушники та вмикай на максимум. Гарантований рофл.",
            },
            {
              icon: "📤",
              title: "Свое відео",
              text: "Можеш завантажити власний кліп прямо в плеєр — кнопка ⤴.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-ember-600/25 bg-black/40 p-5 backdrop-blur transition hover:-translate-y-1 hover:border-ember-500/60"
            >
              <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-ember-600/15 text-2xl">
                {c.icon}
              </div>
              <h3 className="text-base font-black text-ember-300">{c.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-ember-600/20 bg-black/40 py-8 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-ember-500">LFU</span>.tv — loved by the chat 🍊🖤
          </div>
          <p className="text-xs text-zinc-500">
            гумористичний проєкт • 2026 • жодні матері не постраждали (надієємось)
          </p>
        </div>
      </footer>
    </div>
  );
}
