// бонусный счёт: начислить или списать {amount_kop (со знаком), note}
export default defineEventHandler(async (e) => {
  const a = await requireAdmin(e, 'balance.adjust')
  const b = await readBody(e)
  const amount = Math.round(Number(b?.amount_kop))
  const note = String(b?.note ?? '').trim().slice(0, 300)
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1_000_000_00) fail(422, 'bad_amount', 'Сумма — ненулевая, до 1 млн ₽.')
  if (!note) fail(422, 'comment_required', 'Комментарий обязателен.')
  const u = await one(`select id, email from users where id::text = $1`, [getRouterParam(e, 'id')])
  if (!u) fail(404, 'not_found', 'Пользователь не найден.')
  const bal = await tx(async (c) => {
    await c.query(`select 1 from users where id = $1 for update`, [u.id])
    const bal = Number((await c.query(`select user_bonus($1) b`, [u.id])).rows[0].b)
    if (bal + amount < 0) fail(422, 'insufficient_funds', `На бонусном счёте ${bal / 100} ₽ — нельзя списать больше.`)
    await c.query(`insert into bonus_entries (user_id, kind, amount_kop, note, by_admin) values ($1, 'adjust', $2, $3, $4)`, [u.id, amount, note, a.id])
    return bal
  })
  if (amount > 0) await notifyUser(u.id, 'Начислен бонус', `+${amount / 100} ₽ на бонусный счёт — станет скидкой при следующей оплате. ${note}`, '/dashboard#overview')
  await audit(e, a, 'bonus.adjust', u.id, { email: u.email, amount_kop: amount, note })
  return { bonus_kop: bal + amount }
})
