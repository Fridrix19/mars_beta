// шаг 1 регистрации: почта свободна → код на почту (аккаунт ещё не создаётся)
export default defineEventHandler(async (e) => {
  const b = await readBody(e)
  const email = normEmail(b?.email)
  if (await one(`select 1 from users where email = $1`, [email]))
    fail(409, 'email_taken', 'Аккаунт уже зарегистрирован. Войдите или восстановите пароль.')
  return issueCode(e, email, 'register')
})
