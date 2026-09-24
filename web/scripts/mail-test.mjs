// Проверка Unisender Go: node scripts/mail-test.mjs you@example.ru
// Нужны NUXT_UNISENDER_KEY, NUXT_MAIL_FROM (адрес на подтверждённом домене), при необходимости NUXT_UNISENDER_URL
const to = process.argv[2]
const key = process.env.NUXT_UNISENDER_KEY
const url = process.env.NUXT_UNISENDER_URL || 'https://goapi.unisender.ru/ru/transactional/api/v1'
const from = process.env.NUXT_MAIL_FROM || 'noreply@marscap.ru'
if (!to || !key) { console.error('usage: NUXT_UNISENDER_KEY=… node scripts/mail-test.mjs you@example.ru'); process.exit(1) }
const r = await fetch(url + '/email/send.json', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
  body: JSON.stringify({ message: { recipients: [{ email: to }], subject: '123456 — проверка почты Marscap', from_email: from, from_name: 'Marscap',
    body: { plaintext: 'Тестовое письмо Marscap. Если оно пришло во «Входящие» — почта настроена.' }, track_links: 0, track_read: 0 } }),
})
console.log(r.status, await r.text())
