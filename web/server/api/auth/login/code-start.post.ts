// вход без пароля: код на почту
export default defineEventHandler(async (e) => {
  const email = normEmail((await readBody(e))?.email)
  if (!(await one(`select 1 from users where email = $1`, [email])))
    fail(404, 'not_registered', 'Аккаунт с этой почтой не найден. Зарегистрируйтесь.')
  return issueCode(e, email, 'login')
})
