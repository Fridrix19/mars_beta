export default defineEventHandler(async (e) => {
  const b = await readBody(e)
  const email = normEmail(b?.email)
  const code = checkCode(b?.code)
  const u = await one<{ id: string; status: string }>(`select id, status from users where email = $1`, [email])
  if (!u) fail(404, 'not_registered', 'Аккаунт с этой почтой не найден.')
  await consumeCode(email, 'login', code)
  if (u.status === 'blocked') fail(403, 'user_blocked', 'Аккаунт заблокирован. Напишите в поддержку.')
  await startSession(e, u.id)
  return { ok: true, user: await me(e, u.id) }
})
