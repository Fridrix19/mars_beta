// покупка с баланса. idem — ключ от клиента (uuid на попытку), повторный клик вернёт тот же заказ
export default defineEventHandler(async (e) => {
  const u = await requireUser(e)
  const b = await readBody(e)
  const idem = String(b?.idem ?? '')
  if (!/^[\w-]{8,80}$/.test(idem)) fail(422, 'bad_idem', 'Нужен ключ идемпотентности (idem).')
  const p = await prepareOrder(u, b)
  const key = 'u:' + u.id + ':' + idem
  try {
    let o: any
    try {
      o = await one(`select * from place_order($1, $2, $3, $4, $5, $6)`, [u.id, p.plan_id, p.fields, key, p.amount_cents, p.use_bonus])
    } catch (err: any) {
      // два одновременных клика с одним idem: второй упирается в уникальный индекс — отдаём заказ первого
      if (err?.code !== '23505') throw err
      o = await one(`select * from orders where idem = $1 and user_id = $2`, [key, u.id])
      if (!o) throw err
    }
    if (p.gift_to && !o.gift_to) await setGift(o, p.gift_to, u)
    await fulfillOrder(o.id)
    o = await one(`select * from orders where id = $1`, [o.id])
    trackAction(u.id, 'order', { label: o.product_name + ' · ' + o.plan_label, order_id: o.id, amount_kop: o.amount_kop })
    return { order: orderView(o) }
  } catch (err) { pgFail(err) }
})
