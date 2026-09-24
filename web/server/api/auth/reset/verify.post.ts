// код верный → одноразовый тикет на 15 минут для смены пароля
export default defineEventHandler(async (e) => {
  const b = await readBody(e)
  const email = normEmail(b?.email)
  await consumeCode(email, 'reset', checkCode(b?.code))
  const ticket = newToken()
  await q(`insert into signup_tickets (token_hash, email, purpose, expires_at) values ($1, $2, 'reset', now() + interval '15 minutes')`, [sha256(ticket), email])
  return { ok: true, ticket }
})
