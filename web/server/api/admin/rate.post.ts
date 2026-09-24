// курс ₽/$ для новых заказов (пока вручную; позже — ЦБ по расписанию)
export default defineEventHandler(async (e) => {
  const a = await requireAdmin(e, 'products.write')
  const r = Number((await readBody(e))?.rate)
  if (!Number.isFinite(r) || r < 10 || r > 1000) fail(422, 'bad_rate', 'Курс — число от 10 до 1000.')
  const before = await rate()
  await q(`insert into settings (key, value) values ('rate_rub_per_usd', $1::text::jsonb) on conflict (key) do update set value = excluded.value`, [String(Math.round(r * 10000) / 10000)])
  await audit(e, a, 'rate.update', null, { before, after: r })
  return { rate: await rate() }
})
