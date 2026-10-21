// вход по логину или почте и паролю; 5 ошибок подряд — блокировка на 15 минут; с одного IP — не больше 20 ошибок за 15 минут
export default defineEventHandler(async (e) => {
  const b = await readBody(e)
  const password = String(b?.password ?? '')
  const ipKey = 'login:' + clientIp(e)
  if (tooMany(ipKey, 20, 900)) fail(429, 'too_many', 'Слишком много попыток входа. Попробуйте через 15 минут.')
  const u = await findAccount(b?.login ?? b?.email)
  if (!password) fail(422, 'bad_password', 'Введите пароль.')
  if (!u) { hit(ipKey); await verifyPassword(password, await dummyHash()); fail(401, 'bad_credentials', 'Неверный логин, почта или пароль.') }
  const locked = () => fail(429, 'locked', `Слишком много попыток. Вход откроется через ${u.wait || 15} мин. или восстановите пароль.`, { retry_min: u.wait || 15 })
  if (u.locked) locked()
  // попытка списывается до проверки пароля и атомарно — параллельные запросы не обойдут лимит
  const r = await one<{ n: number }>(
    `update users set failed_logins = failed_logins + 1
      where id = $1 and failed_logins < 5 and coalesce(locked_until, '-infinity') <= now() returning failed_logins as n`, [u.id])
  if (!r) locked()
  if (!(await verifyPassword(password, u.password_hash))) {
    hit(ipKey)
    const n = r!.n
    if (n >= 5) { await q(`update users set failed_logins = 0, locked_until = now() + interval '15 minutes' where id = $1`, [u.id]); fail(429, 'locked', 'Слишком много попыток. Вход закрыт на 15 минут — или восстановите пароль.', { retry_min: 15 }) }
    fail(401, 'bad_credentials', `Неверный логин, почта или пароль. Осталось попыток: ${5 - n}.`, { attempts_left: 5 - n })
  }
  if (u.status === 'blocked') fail(403, 'user_blocked', 'Аккаунт заблокирован. Напишите в поддержку.')
  trackAction(u.id, 'login', { label: 'пароль' }, '/login')
  await startSession(e, u.id)
  return { ok: true, user: await me(e, u.id) }
})
