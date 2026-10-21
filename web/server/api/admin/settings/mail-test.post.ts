// тестовое письмо: показывает, уходит ли почта на самом деле и что ответил провайдер
export default defineEventHandler(async (e) => {
  const a = await requireAdmin(e, 'settings')
  const to = normEmail((await readBody(e))?.to)
  const r: any = await sendMail({ to, subject: 'Проверка почты Marscap', text: 'Если вы читаете это письмо — почта сайта работает.\n\nMarscap' })
  await audit(e, a, 'settings.mail_test', null, { to, ok: r.ok, provider: r.provider })
  if (r.provider === 'log') fail(409, 'mail_log_mode', 'Почта в режиме log — письма не уходят, а пишутся в журнал сервера. Задайте NUXT_MAIL_PROVIDER=smtp с NUXT_SMTP_USER и NUXT_SMTP_PASS (или unisender с ключом) и перезапустите сервер.')
  if (!r.ok && r.provider === 'smtp') fail(502, 'mail_failed', 'Почтовый сервер не принял письмо: ' + (r.error || 'ошибка') + '. Проверьте адрес ящика (NUXT_SMTP_USER) и пароль (NUXT_SMTP_PASS).')
  if (!r.ok) fail(502, 'mail_failed', 'Unisender не принял письмо: ' + (r.error || 'ошибка') + '. Проверьте ключ, адрес отправителя (NUXT_MAIL_FROM) и подтверждение домена.')
  return { ok: true, provider: r.provider }
})
