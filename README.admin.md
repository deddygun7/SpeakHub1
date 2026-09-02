Добавлена поддержка ролей (user/admin/founder) и базовая система аутентификации (регистрация по нику и паролю) с cookie-JWT.

Как проверить локально:
1) npm install
2) cp .env.example .env (редактируйте DATABASE_URL и JWT_SECRET; ADMIN_USERS уже содержит demiyan)
3) npm run build
4) npm run db:generate && npm run db:push (зависит от вашей конфигурации миграций drizzle)
5) npm run dev

API endpoints:
- POST /api/auth/register { nick, password } -> зарегистрировать
- POST /api/auth/login { nick, password } -> войти
- POST /api/auth/logout -> выйти
- GET /api/me -> получить текущего пользователя
- GET /api/admin/users -> (доступно только основателю) список пользователей

UI:
- Компонент FounderBadge и ChatMessage использует его для визуального выделения основателя (градиент, иконка).
- Страница /admin доступна только для основателя.
