// возврат заказа на баланс
export default defineEventHandler(async (e) => {
  const a = await requireAdmin(e, 'refunds')
  const reason = String((await readBody(e))?.reason ?? '').trim().slice(0, 300)
  if (!reason) fail(422, 'reason_required', 'Укажите причину возврата.')
  const id = getRouterParam(e, 'id')
  let o
  try { o = await one(`select * from refund_order($1, $2, $3)`, [id, a.id, reason]) }
  catch (err: any) { if (err?.message === 'order_not_found') fail(404, 'not_found', 'Заказ не найден.'); throw err }
  await q(`update refund_requests set status = 'done', admin_id = $2, admin_note = coalesce(admin_note, $3), decided_at = now()
            where order_id = $1 and status in ('new','approved') and destination = 'balance'`, [id, a.id, reason])
  await audit(e, a, 'order.refund', id, { reason, amount_kop: o.amount_kop })
  return { order: o }
})
