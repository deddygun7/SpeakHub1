# SpeakHub1 — локальная настройка, миграции и деплой на Render

Краткая инструкция по запуску проекта локально и развертыванию на Render.

Локально
1) Установите зависимости

```bash
npm install
```

2) Скопируйте .env.example и установите DATABASE_URL

```bash
cp .env.example .env
# Отредактируйте .env (DATABASE_URL)
```

3) Запустите dev-сервер

```bash
npm run dev
```

Миграции (drizzle-kit)
- Сгенерировать миграцию: `npm run db:generate`
- Применить миграции: `npm run db:push`

Перед применением миграций убедитесь, что в .env указана рабочая DATABASE_URL.

Деплой на Render
1) Создайте новый Web Service на Render и укажите репозиторий.
2) Установите переменные окружения в Render -> ENV: `DATABASE_URL` (postgres://user:pass@host:5432/db)
3) Build command: `npm install && npm run build`
4) Start command: `npm run start`
5) Перед первым запуском выполните миграции вручную как One-Off команду на Render:
   - `npm run db:push`

Node версия
- Установите в Render Node 18 или 20 (рекомендую LTS).

Drizzle config
- Для совместимости добавлен `drizzle.config.js` (CommonJS), который читает `DATABASE_URL` из окружения. Это работает в Render и с большинством CLI-инструментов.

Если нужно — могу автоматизировать выполнение миграций на deploy (через deploy hook/one-off job) или добавить инструкции для GitHub Actions.
