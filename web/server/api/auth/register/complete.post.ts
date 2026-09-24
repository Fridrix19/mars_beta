// шаг 2: код верный → создаём аккаунт с паролем и сессию
export default defineEventHandler(async (e) => {
  const b = await readBody(e)
  const email = normEmail(b?.email)
  const password = checkPassword(b?.password)
  const code = checkCode(b?.code)
  if (b?.agree !== true) fail(422, 'offer_required', 'Без согласия с офертой создать аккаунт нельзя.')
  if (await one(`select 1 from users where email = $1`, [email]))
    fail(409, 'email_taken', 'Аккаунт уже зарегистрирован. Войдите или восстановите пароль.')
  await consumeCode(email, 'register', code)
  const offer = (await one<{ v: string }>(`select value #>> '{}' as v from settings where key = 'offer_version'`))?.v ?? null
  const hash = await hashPassword(password)
  const user = await one<{ id: string }>(
    `insert into users (email, password_hash, consent_offer, consent_news) values ($1, $2, $3, $4)
     on conflict (email) do nothing returning id`, [email, hash, offer, b?.news === true])
  if (!user) fail(409, 'email_taken', 'Аккаунт уже зарегистрирован. Войдите или восстановите пароль.')
  await q(`insert into notifications (user_id, title, body, link) values ($1, 'Добро пожаловать в Marscap', 'Пройдите верификацию, чтобы открыть покупки.', '/dashboard.html#kyc')`, [user.id])
  await startSession(e, user.id)
  return { ok: true, user: await me(e, user.id) }
})
