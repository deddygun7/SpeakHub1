// Pure game logic shared by server and client (no DB imports here).

export type Achievement = {
  code: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  { code: "first_sip", title: "Первый глоток", description: "Отправить первое сообщение", icon: "🥃", xp: 20 },
  { code: "chatterbox", title: "Болтун", description: "50 сообщений в баре", icon: "💬", xp: 60 },
  { code: "regular", title: "Завсегдатай", description: "250 сообщений — у тебя тут свой стул", icon: "🪑", xp: 150 },
  { code: "night_owl", title: "Ночная сова", description: "Написать между 02:00 и 05:00", icon: "🦉", xp: 40 },
  { code: "barkeep", title: "Хозяин заведения", description: "Открыть собственный зал", icon: "🏗️", xp: 50 },
  { code: "whisperer", title: "Шёпот в неоне", description: "Отправить первое личное сообщение", icon: "🤫", xp: 30 },
  { code: "reactor", title: "Эмоциональный", description: "Поставить 25 реакций", icon: "⚡", xp: 40 },
  { code: "generous", title: "Щедрая душа", description: "Угостить 10 раз (/cheers)", icon: "🍻", xp: 70 },
  { code: "popular", title: "Душа компании", description: "Получить 10 угощений", icon: "🌟", xp: 90 },
  { code: "loyal", title: "Постоянный клиент", description: "Забрать 3 ежедневных дрэма", icon: "📅", xp: 50 },
  { code: "hacker", title: "Нетраннер", description: "Взломать что-нибудь через /hack", icon: "👾", xp: 25 },
  { code: "level_5", title: "Ценитель", description: "Достичь 5 уровня", icon: "🎖️", xp: 0 },
  { code: "level_10", title: "Мастер купажа", description: "Достичь 10 уровня", icon: "👑", xp: 0 },
  { code: "pinned", title: "Достойно стены", description: "Твоё сообщение закрепили", icon: "📌", xp: 30 },
  { code: "explorer", title: "Исследователь", description: "Заглянуть в 5 разных залов", icon: "🧭", xp: 40 },
  { code: "dresscode", title: "Дресс-код", description: "Купить что-то в магазине бара", icon: "🕶️", xp: 20 },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.code, a]));

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 40;
}

export function levelProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = xp - base;
  const needed = next - base;
  return { level, current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) };
}

const RANKS: Array<[number, string]> = [
  [1, "Новичок"],
  [3, "Дегустатор"],
  [5, "Ценитель"],
  [8, "Сомелье"],
  [12, "Мастер купажа"],
  [18, "Легенда бара"],
  [25, "Нетраннер-Мастер"],
];

export function rankForLevel(level: number): string {
  let rank = RANKS[0][1];
  for (const [lvl, name] of RANKS) if (level >= lvl) rank = name;
  return rank;
}

export const XP_REWARDS = {
  message: 5,
  command: 2,
  reaction: 1,
  createRoom: 30,
  dailyBase: 50,
  dailyStreakBonus: 10,
  cheersReceived: 15,
};

export const NAME_COLORS: Record<string, { label: string; css: string; price: number }> = {
  amber: { label: "Янтарь", css: "#f5a623", price: 0 },
  cyan: { label: "Неон-циан", css: "#22e5ff", price: 25 },
  magenta: { label: "Маджента", css: "#ff3ad6", price: 25 },
  lime: { label: "Кислотный лайм", css: "#a8ff3e", price: 25 },
  violet: { label: "Ультрафиолет", css: "#a78bfa", price: 35 },
  ember: { label: "Тлеющий уголь", css: "#ff5e3a", price: 35 },
  ice: { label: "Лёд в стакане", css: "#dff6ff", price: 45 },
};

export const SHOP_TITLES: Array<{ id: string; label: string; price: number }> = [
  { id: "Ночной странник", label: "Ночной странник", price: 30 },
  { id: "Бутлегер", label: "Бутлегер", price: 40 },
  { id: "Нетраннер", label: "Нетраннер", price: 50 },
  { id: "Хранитель бочки", label: "Хранитель бочки", price: 60 },
  { id: "Босс бара", label: "Босс бара", price: 120 },
  { id: "Призрак сети", label: "Призрак сети", price: 150 },
];

export const THEMES: Array<{ id: string; label: string; swatch: string }> = [
  { id: "amber", label: "Янтарный виски", swatch: "#f5a623" },
  { id: "cyan", label: "Неоновый лёд", swatch: "#22e5ff" },
  { id: "magenta", label: "Ночной клуб", swatch: "#ff3ad6" },
  { id: "matrix", label: "Матрица", swatch: "#4dff88" },
];

export const QUICK_EMOJI = ["🥃", "🔥", "😂", "❤️", "👾", "⚡", "🍻", "💀", "👀", "🤝", "😎", "🫡"];

export const EMOJI_SET = [
  "🥃", "🍻", "🥂", "🍷", "🍸", "🍹", "🧊", "🔥", "⚡", "💥", "✨", "🌟", "💫", "🌙",
  "😀", "😂", "🤣", "😎", "🥲", "😏", "🤔", "🫠", "😴", "🤯", "🥳", "😈", "👀", "💀",
  "👾", "🤖", "🧠", "🦾", "🕶️", "🧬", "🛰️", "💾", "📡", "🔮", "🎲", "🎯", "🎮", "🃏",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "👍", "👎", "👊", "🤝", "🫡",
  "🙌", "👏", "🙏", "💪", "🫶", "✌️", "🤘", "🖖", "🦉", "🐺", "🐍", "🦂", "🌆", "🌃",
];

export function isNightOwl(date = new Date()): boolean {
  const h = date.getHours();
  return h >= 2 && h < 5;
}
