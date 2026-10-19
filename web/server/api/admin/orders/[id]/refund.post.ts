// возврат заказа на баланс
export default defineEventHandler(async (e) => {
  const a = await requireAdmin(e, 'refunds')
  const reason = String((await readBody(e))?.reason ?? '').trim().slice(0, 300)
  if (!reason) fail(422, 'reason_required', 'Укажите причину возврата.')
  const id = getRouterParam(e, 'id')
  const o = await refundOrderSafe(id!, a.id, reason)
  // открытые заявки по заказу закрываются: деньги уже на балансе (одобренные «на карту» вернули заказ сами при одобрении)
  await q(`update refund_requests set status = 'done', admin_id = $2, admin_note = coalesce(admin_note, $3), decided_at = now()
            where order_id = $1 and status = 'new' and destination = 'balance'`, [id, a.id, reason])
  await q(`update refund_requests set status = 'rejected', admin_id = $2, admin_note = 'Заказ возвращён на баланс', decided_at = now()
            where order_id = $1 and status = 'new' and destination = 'card'`, [id, a.id])
  await audit(e, a, 'order.refund', id, { reason, amount_kop: o.amount_kop })
  return { order: o }
})
