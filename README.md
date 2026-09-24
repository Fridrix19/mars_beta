# Marscap — редизайн store.marscap.ru

Прототип нового сайта: каталог цифровых сервисов и виртуальные карты для оплаты зарубежных подписок.
Целевой стек — **Nuxt + PrimeVue 4** (styled mode, пресет Aura + свои токены); прототип — статический HTML, собранный из одной общей базы.

## Структура

```
_proto/          готовый прототип — открыть _proto/index.html в браузере
  index.html, catalog.html, virtual-card.html, how-it-works.html, support.html, faq.html,
  contacts.html, login.html, dashboard.html, design-system.html, styleguide.html, vc-primevue.html
  section/<id>/index.html      6 разделов каталога (ai, games, entertainment, design, work, international)
  service/<slug>/index.html    139 страниц сервисов
src/             исходники прототипа
  base/          общая база: токены и компоненты (base.css, lib.css), шапка/футер/таббар, common.js, pricefmt.js
  pages/         страницы: <page>.html|js|css, данные разделов section-<id>.json, static-models.json, ds/ (дизайн-система)
build/           сборка: build.py, galaxy-bg.v58.js (фон), icon-lum.json (яркость логотипов), shot.js (скриншоты)
source-site/     снимок исходного сайта — источник логотипов, каталога (search.js) и тарифов (payment-flow.v2.js)
design-system/   дизайн-система отдельным пакетом (index.html + src/)
docs/            PROJECT-DOC.md — рабочий документ проекта: решения, правила, артефакты, очередь
web/             бэкенд: Nuxt 4 + Nitro, PostgreSQL (миграции, API, тесты) — см. web/README.md
render.yaml      тестовый стенд на Render + Neon
```

## Сборка

```bash
# нужны Python 3.10+ и Node (sharp — только для крупных SVG-логотипов)
python3 build/build.py            # все страницы, кроме сервисов
python3 build/build.py all        # всё, включая 139 страниц сервисов
python3 build/build.py cursor chatgpt   # только указанные сервисы
```

Результат пишется в `_proto/`. Пути переопределяются переменными `MC_SOURCE` (исходный сайт), `MC_SRC` (исходники), `MC_OUT` (куда собирать).
Проверка вёрстки: `NODE_PATH=$(npm root -g) node build/shot.js _proto/dashboard.html out/dash overview` — скриншоты 1400 и 390 px и ошибки консоли.

## Бэкенд

`web/` отдаёт `_proto/` как статику и API `/api/*` (вход по почте, баланс, пополнение через тестовый провайдер, заказы, KYC-загрузка). Вход и кабинет сами переключаются на настоящие данные, когда рядом есть API; на Vercel работают в демо-режиме. Запуск, переменные и список API — в `web/README.md`.

## Деплой на Vercel

В корне лежит `vercel.json`: Output Directory = `_proto`, без build-команды, cleanUrls включены (`/catalog` и `/catalog.html` — одна страница).
При импорте репозитория в Vercel ничего менять не нужно: Framework Preset — Other, Root Directory — корень репозитория. Главная будет по адресу `/`, разделы — `/section/ai/`, сервисы — `/service/cursor/`.

## Ключевые правила

- Цены и тарифы — 1:1 с исходным сайтом: формула `computeChargedUsd` (до $45 — (сумма + 5) × 1.2, выше — × 1.3), планы из `payment-flow.v2.js`, затем `static-models.json`, затем дефолт раздела. Курс 80.2254.
- Палитра тёмно-синяя, ground `#090D18`; фон — galaxy v58 в слоте визуала; светлая тема переключается.
- Логотипы сервисов не изменяются; кикеры — Inter без черты; тексты короткие; по одному интерактивному блоку на контентную страницу.
- Кнопки в футере карточек — во всю ширину. Активная вкладка навигации — тёмная «утопленная» плашка с 3D-текстом.

Подробности, история решений и ссылки на артефакты — в `docs/PROJECT-DOC.md`.
