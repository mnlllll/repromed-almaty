# Подготовка Репро-Мед к GitHub и Cloudflare

## Важно: структура каталогов

Загружайте в корень GitHub-репозитория содержимое этой папки, а не сам ZIP и не вложенную папку целиком. В корне репозитория должны лежать `index.html`, `package.json`, `vite.config.ts`, `wrangler.jsonc`, `worker/`, `cloudflare/`, `functions/` и папка `src/`.

Внутри `src/` должны сохраниться `App.tsx`, `main.tsx`, `components/`, `data/`, `lib/`, `types/`, `assets/`.

## Исправление .gitignore

В `.gitignore` используется `/data/`, чтобы исключалась только корневая папка локальных данных. Не заменяйте это на `data/`: такой шаблон может исключить `src/data/clinicData.ts` и сломать сборку.

## Cloudflare Workers (рекомендуемый вариант для wrangler.jsonc)

В настройках сборки Git-интеграции укажите:

- Production branch: `main`
- Root directory: `/` (корень репозитория)
- Build command: `npm run build:cf`
- Deploy command: `npx wrangler deploy`

`wrangler.jsonc` уже указывает Worker `worker/index.ts` и статические файлы из `dist`.

## Cloudflare Pages — альтернативный вариант

Если создаёте именно Pages project, используйте:

- Framework preset: Vite
- Root directory: `/`
- Build command: `npm run build:cf`
- Build output directory: `dist`

Pages Functions находятся в `functions/api/[[path]].ts`.

Не смешивайте настройки Pages и Workers в одном деплое: выберите один вариант.

## KV для постоянного хранения

Для сохранения аккаунтов, записей и отзывов создайте Cloudflare KV namespace и привяжите его с именем `REPROMED_STORE`. Для Workers добавьте namespace binding в `wrangler.jsonc` (или через настройки ресурса, если поддерживается выбранным способом деплоя). Без KV приложение использует предусмотренный кодом fallback в памяти, который не является постоянным хранилищем.

## Безопасность перед реальным запуском

Не загружайте в GitHub локальные базы с данными пациентов или реальные `.env`-файлы. В исходном проекте есть демонстрационные пациентские данные и тестовые идентификаторы в коде. Перед реальным использованием медицинского сайта замените/удалите демонстрационные записи и проведите отдельную проверку защиты персональных данных, авторизации и хранения медицинской информации.
