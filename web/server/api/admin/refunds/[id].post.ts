// решение по заявке: {action: 'approve'|'reject'|'done', note}
// на баланс: approve — возврат заказа на баланс сразу.
// на карту: approve — заказ возвращается на баланс и сумма тут же списывается как выплата (для вывода пополнения — просто списывается);
// дальше админ возвращает деньги у провайдера и жмёт done. Отказ после одобрения возвращает сумму на баланс.
export default defineEventHandler(async (e) => {
  const a = await requireAdmin(e, 'refunds')
  const b = await readBody(e)
  const action = String(b?.action ?? ''), note = String(b?.note ?? '').trim().slice(0, 300)
  if (!['approve', 'reject', 'done'].includes(action)) fail(422, 'bad_action', 'Неизвестное действие.')
  if (action === 'reject' && !note) fail(422, 'note_required', 'Укажите причину отказа — её увидит клиент.')
  const r = await tx(async (c) => {
    const r = (await c.query(`select * from refund_requests where id::text = $1 for update`, [String(getRouterParam(e, 'id'))])).rows[0]
    if (!r) fail(404, 'not_found', 'Заявка не найдена.')
    try {
      if (action === 'reject') {
        if (!['new', 'approved'].includes(r.status)) fail(409, 'closed', 'Заявка уже закрыта.')
        if (r.status === 'approved' && r.destination === 'card')
          await c.query(`select ledger_post($1, $2, 'refund', $3, $4, $5, 'Выплата на карту отменена — деньги на балансе', $6)`,
            [r.user_id, r.amount_kop, r.order_id, r.payment_id, a.id, 'payout-cancel:' + r.id])
        await c.query(`update refund_requests set status = 'rejected', admin_id = $2, admin_note = $3, decided_at = now() where id = $1`, [r.id, a.id, note])
      } else if (action === 'approve') {
        if (r.status !== 'new') fail(409, 'closed', 'Заявка уже рассмотрена.')
        if (r.order_id) {
          const o = (await c.query(`select status from orders where id = $1 for update`, [r.order_id])).rows[0]
          if (!o || ['refunded', 'canceled'].includes(o.status)) fail(409, 'order_closed', 'Заказ уже возвращён или отменён — отклоните заявку.')
          await refundOrderTx(c, r.order_id, a.id, note || 'Возврат по заявке')
        }
        if (r.destination === 'balance') {
          await c.query(`update refund_requests set status = 'done', admin_id = $2, admin_note = $3, decided_at = now() where id = $1`, [r.id, a.id, note || null])
        } else {
          await c.query(`select ledger_post($1, $2, 'payout', $3, $4, $5, $6, $7)`,
            [r.user_id, -r.amount_kop, r.order_id, r.payment_id, a.id, r.order_id ? 'Возврат заказа на карту' : 'Возврат пополнения на карту', 'payout:' + r.id])
          await c.query(`update refund_requests set status = 'approved', admin_id = $2, admin_note = $3, decided_at = now() where id = $1`, [r.id, a.id, note || null])
        }
      } else {
        if (r.status !== 'approved' || r.destination !== 'card') fail(409, 'bad_state', 'Отметить выполненным можно одобренный возврат на карту.')
        if (r.payment_id) await c.query(`update payments set status = 'refunded' where id = $1 and status = 'succeeded'`, [r.payment_id])
        await c.query(`update refund_requests set status = 'done', decided_at = now() where id = $1`, [r.id])
      }
    } catch (err: any) {
      if (err?.message === 'insufficient_funds') fail(409, 'insufficient_funds', 'На балансе клиента меньше суммы заявки — деньги уже потрачены. Отклоните заявку или уточните сумму.')
      throw err
    }
    return r
  })
  if (action === 'reject') await notifyUser(r.user_id, 'Возврат отклонён', note, '/dashboard.html#payments:refunds')
  if (action === 'approve' && r.destination === 'card')
    await notifyUser(r.user_id, 'Возврат одобрен', 'Деньги вернутся на карту, с которой вы платили, обычно за 1–5 рабочих дней.', '/dashboard.html#payments:refunds')
  await audit(e, a, 'refund.' + action, r.id, { note, order_id: r.order_id, amount_kop: r.amount_kop })
  return { ok: true }
})
