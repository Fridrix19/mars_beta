# Бэкенд Marscap

Nuxt 4 + Nitro, PostgreSQL 16. Сервер отдаёт прототип (`../_proto`) как статику и API по `/api/*`.
Страницы `login.html` и `dashboard.html` сами проверяют `/api/health`: есть сервер — работают с настоящими данными, нет (Vercel, артефакт, file://) — в демо-режиме.

## Запуск

```bash
cd web
npm ci
export NUXT_DATABASE_URL=postgres://…   # или DATABASE_URL
export NUXT_SECRET=$(openssl rand -hex 32)
npm run migrate          # применяет server/db/migrations/*.sql, повторный запуск ничего не меняет
npm run build && npm start   # или npm run dev
```

Переменные окружения:

| переменная | по умолчанию | что это |
|---|---|---|
| `NUXT_DATABASE_URL` | — | строка подключения (Neon: `…?sslmode=require`) |
| `NUXT_SECRET` | — (в проде обязателен) | HMAC кодов из писем и ключ AES-GCM для данных выдачи. Не менять после запуска |
| `NUXT_MAIL_PROVIDER` | `log` | `log` — письма в консоль; `unisender` — Unisender Go |
| `NUXT_UNISENDER_KEY`, `NUXT_UNISENDER_URL` | —, `go1…/api/v1` | ключ и адрес API из кабинета Unisender Go |
| `NUXT_MAIL_FROM` | `noreply@marscap.ru` | отправитель (домен с SPF/DKIM) |
| `NUXT_PAYMENT_PROVIDER` | `test` | пока только тестовый провайдер |
| `NUXT_COOKIE_SECURE` | `false` | `true` за HTTPS |
| `NUXT_DEV_CODES` | `false` | `true` только на стенде: код из письма приходит в ответе API и показывается на экране |

Деплой на Render — `render.yaml` в корне репозитория (миграции запускаются при старте).

## Тесты

```bash
NUXT_SECRET=x NUXT_DATABASE_URL=… NUXT_DEV_CODES=true PORT=3100 node .output/server/index.mjs &
DATABASE_URL=… API_URL=http://localhost:3100 npm test
```

Покрыто: регистрация (код до создания аккаунта, занятая почта, попытки кода), вход и блокировка после 5 ошибок, вход по коду, сброс пароля с завершением сессий, профиль, сессии, смена пароля, загрузка KYC, пополнение и повтор вебхука, KYC-запрет покупки, недостача с суммой, идемпотентная покупка, пополнение «под заказ», карта с произвольной суммой, каталог.

## API

Ошибки: `{ statusCode, message, data: { code, … } }` — `message` можно показывать пользователю.

| метод | путь | что делает |
|---|---|---|
| POST | `/api/auth/register/start` | `{email}` → код на почту; `409 email_taken` |
| POST | `/api/auth/register/complete` | `{email, code, password, agree, news}` → аккаунт + сессия |
| POST | `/api/auth/login` | `{email, password}`; 5 ошибок — `429 locked` на 15 минут |
| POST | `/api/auth/login/code-start`, `/api/auth/login/code` | вход по коду из письма |
| POST | `/api/auth/reset/start` → `/reset/verify` → `/reset/complete` | код → тикет → новый пароль, все сессии завершаются |
| POST | `/api/auth/logout` · GET `/api/auth/me` | выход · профиль с балансом |
| GET/DELETE | `/api/auth/sessions`, `/api/auth/sessions/:id` (`others`) | устройства |
| POST | `/api/auth/password` | `{old, new}`, остальные сессии завершаются |
| PATCH | `/api/profile` | `{name, phone}` |
| GET/POST | `/api/kyc` | статус · загрузка фото (multipart `files`, 1–4 шт., JPG/PNG/HEIC/PDF до 10 МБ) |
| GET | `/api/catalog`, `/api/catalog/:slug` | разделы, товары, тарифы с итоговой ценой в копейках |
| GET | `/api/balance` | баланс и журнал операций |
| POST | `/api/topups` | `{amount_kop, for_order?}` → платёж; `for_order` — оформить заказ сразу после оплаты |
| POST | `/api/topups/:id/test` | тестовый провайдер: `{action: succeed|cancel}` (в бою выключен) |
| GET | `/api/topups/:id`, `/api/payments` | статус платежа, история пополнений |
| POST | `/api/orders` | `{plan_id, fields, amount_cents?, idem}` → заказ с баланса; `403 kyc_required`, `402 insufficient_funds` + `shortfall_kop` |
| GET | `/api/orders`, `/api/orders/:id` | заказы, карточка с событиями и выдачей |
| GET/POST | `/api/notifications`, `/api/notifications/read` | уведомления |

## Деньги

Баланс не хранится полем — это последняя проводка в `ledger_entries`. Любое движение денег идёт только через функции из `003_money.sql` / `004_auth_cards.sql`:

| функция | что делает |
|---|---|
| `user_balance(user)` | баланс в копейках |
| `payment_succeeded(payment)` | зачисляет пополнение; повторный вебхук ничего не меняет |
| `place_order(user, plan, fields, idem, amount_cents)` | проверяет KYC и баланс, фиксирует цену и курс, создаёт заказ `MC-XXXXXXXX` и списывает деньги одной транзакцией; `amount_cents` — для тарифа с произвольной суммой (карта $50–$200) |
| `refund_order(order, admin, reason)` | возврат на баланс, идемпотентно |
| `charged_cents(cents)` | комиссия сайта: до $45 — (сумма + 5) × 1.2, выше — × 1.3 |

`002_catalog.sql` генерируется `python3 build/seed_catalog.py` из тех же источников, что и прототип (139 товаров, 389 тарифов, цены 1:1 с исходным сайтом). `004` добавляет виртуальную карту как товар (номиналы 50/75/100/150/200 и своя сумма).
