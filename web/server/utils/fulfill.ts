// после оплаты заказа: карта — выпуск/пополнение, товар с автовыдачей — ключ из пула
export async function fulfillOrder(orderId: string) {
  const o = await one(`select o.id, o.status, p.delivery from orders o join products p on p.id = o.product_id where o.id = $1`, [orderId])
  if (!o || o.status !== 'paid') return
  if (o.delivery === 'card_topup') return fulfillCardOrder(orderId)
  if (o.delivery === 'auto') return fulfillKeyOrder(orderId)
}

export async function fulfillKeyOrder(orderId: string, adminId: string | null = null) {
  return tx(async (c) => {
    const o = (await c.query(`select * from orders where id = $1 for update`, [orderId])).rows[0]
    if (!o || !['paid', 'in_work', 'need_info'].includes(o.status)) return null
    const k = (await c.query(
      `select * from product_keys where product_id = $1 and status = 'free' and (plan_id = $2 or plan_id is null)
        order by (plan_id is null), created_at limit 1 for update skip locked`, [o.product_id, o.plan_id])).rows[0]
    if (!k) {
      const had = (await c.query(`select 1 from order_events where order_id = $1 and kind = 'note' and text like 'Ключи закончились%'`, [o.id])).rowCount
      if (!had) await c.query(`insert into order_events (order_id, kind, text) values ($1, 'note', 'Ключи закончились — выдадим вручную')`, [o.id])
      return null
    }
    await c.query(`update product_keys set status = 'sold', order_id = $2, sold_at = now() where id = $1`, [k.id, o.id])
    await c.query(`update orders set status = 'done', delivered_at = now(), updated_at = now(), delivery_enc = $2, assigned_admin = coalesce(assigned_admin, $3) where id = $1`,
      [o.id, k.secret_enc, adminId])
    await c.query(`insert into order_events (order_id, kind, status, text, by_admin) values ($1, 'delivered', 'done', 'Выдано автоматически из пула ключей', $2)`, [o.id, adminId])
    await c.query(`insert into notifications (user_id, title, body, link) values ($1, $2, 'Данные для доступа — в карточке заказа', $3)`,
      [o.user_id, `Заказ ${o.id} выполнен`, '/dashboard.html#order:' + o.id])
    return k.id
  })
}

// ручная выдача админом: данные хранятся зашифрованными
export async function deliverManual(orderId: string, text: string, adminId: string) {
  return tx(async (c) => {
    const o = (await c.query(`select * from orders where id = $1 for update`, [orderId])).rows[0]
    if (!o) fail(404, 'not_found', 'Заказ не найден.')
    if (['canceled', 'refunded'].includes(o.status)) fail(409, 'order_closed', 'Заказ отменён или возвращён.')
    await c.query(`update orders set status = 'done', delivered_at = now(), updated_at = now(), delivery_enc = $2, assigned_admin = $3 where id = $1`,
      [o.id, encrypt(text), adminId])
    await c.query(`insert into order_events (order_id, kind, status, text, by_admin) values ($1, 'delivered', 'done', 'Данные выданы', $2)`, [o.id, adminId])
    await c.query(`insert into notifications (user_id, title, body, link) values ($1, $2, 'Данные для доступа — в карточке заказа', $3)`,
      [o.user_id, `Заказ ${o.id} выполнен`, '/dashboard.html#order:' + o.id])
    return o.id
  })
}
