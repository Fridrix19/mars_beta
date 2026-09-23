# Бэкенд Marscap

## База данных (PostgreSQL 16)

Миграции применяются по порядку:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f server/db/migrations/001_init.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f server/db/migrations/002_catalog.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f server/db/migrations/003_money.sql
```

`002_catalog.sql` генерируется `python3 build/seed_catalog.py` из тех же источников, что и прототип (139 товаров, 389 тарифов, цены 1:1 с исходным сайтом).

## Деньги

Баланс не хранится полем — это последняя проводка в `ledger_entries`. Любое движение денег идёт только через функции из `003_money.sql`:

| функция | что делает |
|---|---|
| `user_balance(user)` | баланс в копейках |
| `payment_succeeded(payment)` | зачисляет пополнение; повторный вебхук ничего не меняет |
| `place_order(user, plan, fields, idem)` | проверяет KYC и баланс, фиксирует цену и курс, создаёт заказ `MC-XXXXXXXX` и списывает деньги одной транзакцией; ошибка `insufficient_funds` возвращает недостающую сумму в `DETAIL` |
| `refund_order(order, admin, reason)` | возврат на баланс, идемпотентно |
| `charged_cents(cents)` | комиссия сайта: до $45 — (сумма + 5) × 1.2, выше — × 1.3 |

Проверено: повторные вебхуки и повторные клики не проводят операцию дважды; из четырёх одновременных покупок при балансе на одну проходит ровно одна.
