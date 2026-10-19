// пополнение баланса: создаёт платёж у провайдера (пока — тестовый)
const MIN_KOP = 100_00, MAX_KOP = 300_000_00

export default defineEventHandler(async (e) => {
  const u = await requireUser(e)
  const b = await readBody(e)
  const amount = Math.round(Number(b?.amount_kop))
  if (!Number.isFinite(amount) || amount < MIN_KOP || amount > MAX_KOP)
    fail(422, 'bad_amount', 'Сумма пополнения — от 100 до 300 000 ₽.', { min_kop: MIN_KOP, max_kop: MAX_KOP })
  const provider = useRuntimeConfig().paymentProvider || 'test'
  if (provider !== 'test' || !isStand()) fail(501, 'provider_not_configured', 'Пополнение временно недоступно: платёжный провайдер ещё не подключён.')
  // «пополнить и купить»: заказ проверяется сразу — как обычная покупка
  const forOrder = b?.for_order?.plan_id ? await prepareOrder(u, b.for_order) : null
  const p = await one<{ id: string }>(
    `insert into payments (user_id, amount_kop, provider, for_order) values ($1, $2, 'test', $3) returning id, amount_kop, status, created_at`,
    [u.id, amount, forOrder])
  await q(`update payments set provider_id = id::text where id = $1`, [p!.id])
  trackAction(u.id, 'topup_start', { label: (amount / 100) + ' ₽', payment_id: p!.id })
  return { payment: p, provider: 'test', confirm: { type: 'test', url: `/api/topups/${p!.id}/test` } }
})
