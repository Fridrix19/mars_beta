// карточка заказа: события и выданные данные (расшифровываются только владельцу)
export default defineEventHandler(async (e) => {
  const u = await requireUser(e)
  const o = await one(`select o.*, p.slug as product_slug from orders o left join products p on p.id = o.product_id where o.id = $1 and o.user_id = $2`,
    [getRouterParam(e, 'id'), u.id])
  if (!o) fail(404, 'not_found', 'Заказ не найден.')
  const events = await q(`select kind, status, text, created_at from order_events where order_id = $1 order by id`, [o.id])
  let delivery: string | null = null
  if (o.delivery_enc) { try { delivery = decrypt(o.delivery_enc) } catch { delivery = null } }
  return { order: { ...orderView(o), delivery }, events }
})
