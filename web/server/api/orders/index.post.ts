// покупка с баланса. idem — ключ от клиента (uuid на попытку), повторный клик вернёт тот же заказ
export default defineEventHandler(async (e) => {
  const u = await requireUser(e)
  const b = await readBody(e)
  const idem = String(b?.idem ?? '')
  if (!/^[\w-]{8,80}$/.test(idem)) fail(422, 'bad_idem', 'Нужен ключ идемпотентности (idem).')
  const plan = await one(
    `select pp.id, pr.buyer_fields, pr.slug from product_plans pp join products pr on pr.id = pp.product_id where pp.id::text = $1`, [String(b?.plan_id ?? '')])
  if (!plan) fail(404, 'plan_not_found', 'Тариф не найден.')
  const fields: Record<string, string> = validateFields(plan.buyer_fields, b?.fields)
  // пополнение существующей карты: карта должна быть своей и активной
  if (plan.slug === 'virtual-card' && b?.card_id) {
    const card = await one(`select id from cards where id::text = $1 and user_id = $2 and status = 'active'`, [String(b.card_id), u.id])
    if (!card) fail(422, 'card_unavailable', 'Карта заморожена или не найдена.')
    fields.card_id = card.id
  }
  const amount = b?.amount_cents != null ? Math.round(Number(b.amount_cents)) : null
  try {
    let o = await one(`select * from place_order($1, $2, $3, $4, $5)`, [u.id, plan.id, fields, 'u:' + u.id + ':' + idem, amount])
    if (plan.slug === 'virtual-card') {
      await fulfillCardOrder(o.id)
      o = await one(`select * from orders where id = $1`, [o.id])
    }
    return { order: orderView(o) }
  } catch (err) { pgFail(err) }
})

function validateFields(spec: any[], input: any) {
  const out: Record<string, string> = {}
  const errors: Record<string, string> = {}
  for (const f of spec || []) {
    const v = String(input?.[f.key] ?? '').trim().slice(0, 500)
    if (!v) { if (f.required) errors[f.key] = `Заполните поле «${f.label}».`; continue }
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { errors[f.key] = 'Проверьте почту.'; continue }
    out[f.key] = v
  }
  if (Object.keys(errors).length) fail(422, 'bad_fields', Object.values(errors)[0], { fields: errors })
  return out
}
