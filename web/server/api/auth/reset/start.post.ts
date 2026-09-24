// восстановление: код уходит, только если аккаунт есть; ответ одинаковый
export default defineEventHandler(async (e) => {
  const email = normEmail((await readBody(e))?.email)
  if (await one(`select 1 from users where email = $1`, [email])) return issueCode(e, email, 'reset')
  return { sent: true, resend_after: 59, ttl_min: 10 }
})
