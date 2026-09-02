// Bartender bot: whisky knowledge base and slash-command processing (pure logic).

export type Whisky = {
  name: string;
  region: string;
  type: "Scotch" | "Bourbon" | "Japanese" | "Irish" | "Rye";
  abv: number;
  age: string;
  notes: string[];
  color: string;
  price: number;
};

export const WHISKIES: Whisky[] = [
  { name: "Lagavulin 16", region: "Айла, Шотландия", type: "Scotch", abv: 43, age: "16 лет", notes: ["торф", "дым", "йод", "морская соль"], color: "#c8781a", price: 14 },
  { name: "Ardbeg Uigeadail", region: "Айла, Шотландия", type: "Scotch", abv: 54.2, age: "NAS", notes: ["костёр", "изюм", "шоколад", "дёготь"], color: "#b8671a", price: 15 },
  { name: "Macallan 12 Sherry Oak", region: "Спейсайд, Шотландия", type: "Scotch", abv: 40, age: "12 лет", notes: ["херес", "сухофрукты", "имбирь", "дуб"], color: "#a34f12", price: 13 },
  { name: "Glenfiddich 15 Solera", region: "Спейсайд, Шотландия", type: "Scotch", abv: 40, age: "15 лет", notes: ["мёд", "яблоко", "ваниль", "корица"], color: "#d9922a", price: 11 },
  { name: "Talisker 10", region: "Скай, Шотландия", type: "Scotch", abv: 45.8, age: "10 лет", notes: ["перец", "дым", "бриз", "соль"], color: "#cf8a25", price: 10 },
  { name: "Highland Park 12 Viking Honour", region: "Оркни, Шотландия", type: "Scotch", abv: 40, age: "12 лет", notes: ["вереск", "мёд", "лёгкий торф"], color: "#c47f22", price: 10 },
  { name: "Buffalo Trace", region: "Кентукки, США", type: "Bourbon", abv: 45, age: "NAS", notes: ["карамель", "ваниль", "мята", "дуб"], color: "#b96b1c", price: 7 },
  { name: "Maker's Mark", region: "Кентукки, США", type: "Bourbon", abv: 45, age: "NAS", notes: ["пшеница", "ирис", "фрукты"], color: "#c5762a", price: 8 },
  { name: "Woodford Reserve", region: "Кентукки, США", type: "Bourbon", abv: 45.2, age: "NAS", notes: ["сухофрукты", "какао", "специи"], color: "#a55a14", price: 9 },
  { name: "WhistlePig 10 Rye", region: "Вермонт, США", type: "Rye", abv: 50, age: "10 лет", notes: ["перец", "карамель", "мята", "дуб"], color: "#b6621b", price: 16 },
  { name: "Yamazaki 12", region: "Осака, Япония", type: "Japanese", abv: 43, age: "12 лет", notes: ["персик", "мидзунара", "кокос", "гвоздика"], color: "#d38b2f", price: 22 },
  { name: "Hibiki Harmony", region: "Япония", type: "Japanese", abv: 43, age: "NAS", notes: ["мёд", "апельсин", "белый шоколад"], color: "#dc9a3b", price: 18 },
  { name: "Nikka From The Barrel", region: "Япония", type: "Japanese", abv: 51.4, age: "NAS", notes: ["специи", "карамель", "цитрус"], color: "#bd6f1d", price: 12 },
  { name: "Redbreast 12", region: "Корк, Ирландия", type: "Irish", abv: 40, age: "12 лет", notes: ["херес", "орех", "яблочный пирог"], color: "#cf8628", price: 11 },
  { name: "Green Spot", region: "Ирландия", type: "Irish", abv: 40, age: "NAS", notes: ["зелёное яблоко", "ячмень", "ваниль"], color: "#dda044", price: 10 },
  { name: "Teeling Small Batch", region: "Дублин, Ирландия", type: "Irish", abv: 46, age: "NAS", notes: ["ром", "ваниль", "специи"], color: "#c9822a", price: 9 },
];

export const WHISKY_FACTS = [
  "Слово «виски» происходит от гэльского uisge beatha — «вода жизни».",
  "Ангельская доля — это ~2% виски, что испаряется из бочки каждый год выдержки.",
  "Бурбон обязан выдерживаться в НОВЫХ обожжённых бочках из американского дуба.",
  "Скотч становится скотчем только после трёх лет в бочке на территории Шотландии.",
  "Торфяной дым в виски измеряется в ppm фенолов. Octomore доходит до 300+ ppm.",
  "Японские дистиллерии часто держат сразу несколько форм перегонных кубов, чтобы делать десятки стилей спирта.",
  "Ирландский виски традиционно перегоняют трижды — отсюда его мягкость.",
  "Капля воды в стакане «раскрывает» виски: она высвобождает летучие ароматические соединения.",
  "Цвет виски почти полностью приходит из бочки, а не из зерна.",
  "Самая старая лицензированная дистиллерия в мире — Bushmills, лицензия выдана в 1608 году.",
  "Single malt — не значит «из одной бочки». Это значит «с одной дистиллерии, из ячменного солода».",
  "Виски не стареет в бутылке. 12-летний виски останется 12-летним и через сто лет.",
];

export const TOASTS = [
  "За тех, кто в сети, и за тех, кто ещё не подключился!",
  "Slàinte mhath! За здоровье и стабильный пинг!",
  "За неон в стакане и янтарь в венах!",
  "Чтобы бочки были полными, а логи — чистыми!",
  "За ночной город, где не гаснут вывески и не заканчивается виски!",
  "За тех, кто помнит вкус первого глотка!",
  "Пусть каждый твой коммит будет как хороший дрэм — без багов и с послевкусием!",
];

export const FORTUNES = [
  "Сегодня ночью нейросеть увидит твой сон и захочет его повторить.",
  "Ожидай сообщение от того, кого ты давно не слышал. Оно придёт с задержкой в 300 мс.",
  "Твоя следующая идея стоит дороже, чем этот стакан. Не разливай её.",
  "Кто-то в этом баре думает о тебе. Или это просто трассировка пакетов.",
  "Лёд в твоём стакане тает медленнее, чем твои сомнения.",
  "Удача любит тех, кто заказывает второй дрэм.",
  "Скоро ты найдёшь баг, который окажется фичей. Прибыльной.",
  "Неон шепчет: «выключи уведомления и допей».",
];

const EIGHT_BALL = [
  "Бесспорно.", "Определённо да.", "Можешь быть уверен.", "Похоже на то.", "Знаки говорят «да».",
  "Пока туманно, спроси после второго дрэма.", "Лучше не рассказывать.", "Сконцентрируйся и спроси снова.",
  "Не рассчитывай на это.", "Мой ответ — нет.", "Источники говорят «нет».", "Очень сомнительно.",
];

const HACK_LINES = [
  "> инициализация ICE-breaker v4.2…",
  "> обход файрвола бара… ОК",
  "> взлом холодильника со льдом… ОК",
  "> доступ к бочке #7 получен",
  "> ВНИМАНИЕ: обнаружен бармен. Отключение…",
  "> …бармен не отключается. Он просто смотрит.",
  "> взлом завершён. Награда: один бесплатный взгляд осуждения.",
];

export function whiskyOfTheDay(date = new Date()): Whisky {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return WHISKIES[dayIndex % WHISKIES.length];
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const COMMANDS: Array<{ cmd: string; args?: string; desc: string }> = [
  { cmd: "/help", desc: "Список команд бармена" },
  { cmd: "/whisky", desc: "Случайный факт и рекомендация" },
  { cmd: "/menu", desc: "Меню бара на сегодня" },
  { cmd: "/pour", args: "[@ник]", desc: "Налить дрэм себе или другу" },
  { cmd: "/cheers", args: "@ник", desc: "Угостить: +карма и XP получателю" },
  { cmd: "/toast", desc: "Произнести тост" },
  { cmd: "/roll", args: "[2d6]", desc: "Бросить кости" },
  { cmd: "/flip", desc: "Подбросить монетку" },
  { cmd: "/8ball", args: "вопрос", desc: "Спросить магический шар" },
  { cmd: "/fortune", desc: "Кибер-предсказание" },
  { cmd: "/me", args: "действие", desc: "Сообщение от третьего лица" },
  { cmd: "/shrug", args: "[текст]", desc: "¯\\_(ツ)_/¯" },
  { cmd: "/glitch", args: "текст", desc: "Гл̷и̸т̵ч̶-текст" },
  { cmd: "/topic", args: "текст", desc: "Сменить тему зала" },
  { cmd: "/hack", desc: "Взломать бар (не рекомендуется)" },
];

export type CommandResult = {
  /** Message posted on behalf of the user (kind text|me). Null if nothing. */
  userMessage?: { content: string; kind: "text" | "me" };
  /** Message from bartender bot */
  botMessage?: string;
  /** Side effect */
  action?: { type: "topic"; topic: string } | { type: "cheers"; target: string } | { type: "hack" };
  error?: string;
};

function glitchify(text: string): string {
  const marks = ["\u0336", "\u0337", "\u0338", "\u0334", "\u0335", "\u0305", "\u0332", "\u0333"];
  return Array.from(text)
    .map((ch) => (ch === " " ? ch : ch + pick(marks) + (Math.random() > 0.6 ? pick(marks) : "")))
    .join("");
}

function rollDice(spec: string): { rolls: number[]; total: number; spec: string } | null {
  const m = /^(\d{0,2})d(\d{1,3})$/i.exec(spec.trim() || "1d6");
  if (!m) return null;
  const count = Math.min(Math.max(parseInt(m[1] || "1", 10), 1), 20);
  const sides = Math.min(Math.max(parseInt(m[2], 10), 2), 1000);
  const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
  return { rolls, total: rolls.reduce((a, b) => a + b, 0), spec: `${count}d${sides}` };
}

export function processCommand(raw: string, actorName: string): CommandResult | null {
  if (!raw.startsWith("/")) return null;
  const [cmdRaw, ...rest] = raw.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase();
  const arg = rest.join(" ").trim();

  switch (cmd) {
    case "/help":
      return {
        botMessage:
          "🤖 **Команды бармена:**\n" + COMMANDS.map((c) => `${c.cmd}${c.args ? " " + c.args : ""} — ${c.desc}`).join("\n"),
      };
    case "/whisky": {
      const w = pick(WHISKIES);
      return {
        botMessage: `🥃 **Факт:** ${pick(WHISKY_FACTS)}\n\n**Рекомендую сегодня:** ${w.name} (${w.region}, ${w.abv}%). Ноты: ${w.notes.join(", ")}.`,
      };
    }
    case "/menu": {
      const w = whiskyOfTheDay();
      const list = WHISKIES.slice(0, 8)
        .map((x) => `• ${x.name} — ${x.price}¢ · ${x.notes.slice(0, 2).join(", ")}`)
        .join("\n");
      return { botMessage: `📜 **Меню бара**\n⭐ Дрэм дня: **${w.name}** (${w.age})\n${list}\n…и ещё ${WHISKIES.length - 8} позиций. Полное меню — на главной.` };
    }
    case "/pour": {
      const w = pick(WHISKIES);
      const target = arg.startsWith("@") ? arg : `@${actorName}`;
      return { botMessage: `🥃 Бармен наливает ${w.age === "NAS" ? "щедрый" : w.age} дрэм **${w.name}** для ${target}. ${pick(["Со льдом или чистым?", "Без льда. Это приказ.", "Первый — за счёт заведения.", "Не пей залпом, это не сироп."])}` };
    }
    case "/toast":
      return { userMessage: { content: `поднимает стакан: «${pick(TOASTS)}» 🥂`, kind: "me" } };
    case "/roll": {
      const r = rollDice(arg);
      if (!r) return { error: "Формат: /roll 2d6" };
      return { botMessage: `🎲 ${actorName} бросает ${r.spec}: [${r.rolls.join(", ")}] = **${r.total}**` };
    }
    case "/flip":
      return { botMessage: `🪙 ${actorName} подбрасывает монетку: **${Math.random() < 0.5 ? "ОРЁЛ" : "РЕШКА"}**` };
    case "/8ball":
      if (!arg) return { error: "Задай вопрос: /8ball будет ли дождь?" };
      return { userMessage: { content: `🎱 ${arg}`, kind: "text" }, botMessage: `🎱 ${pick(EIGHT_BALL)}` };
    case "/fortune":
      return { botMessage: `🔮 ${actorName}, предсказание: ${pick(FORTUNES)}` };
    case "/me":
      if (!arg) return { error: "Формат: /me делает что-то" };
      return { userMessage: { content: arg, kind: "me" } };
    case "/shrug":
      return { userMessage: { content: `${arg ? arg + " " : ""}¯\\_(ツ)_/¯`, kind: "text" } };
    case "/glitch":
      if (!arg) return { error: "Формат: /glitch текст" };
      return { userMessage: { content: glitchify(arg), kind: "text" } };
    case "/topic":
      if (!arg) return { error: "Формат: /topic новая тема" };
      return { action: { type: "topic", topic: arg.slice(0, 160) } };
    case "/cheers": {
      const target = arg.replace(/^@/, "").trim();
      if (!target) return { error: "Кого угощаем? /cheers @ник" };
      return { action: { type: "cheers", target } };
    }
    case "/hack":
      return { botMessage: HACK_LINES.join("\n"), action: { type: "hack" } };
    default:
      return { error: `Неизвестная команда ${cmd}. Напиши /help` };
  }
}
