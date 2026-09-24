export default defineEventHandler(async (e) => {
  const u = await requireUser(e)
  const { status } = getQuery(e)
  const rows = await q(
    `select o.*, p.slug as product_slug from orders o left join products p on p.id = o.product_id
      where o.user_id = $1 and ($2::text is null or o.status = $2) order by o.created_at desc limit 200`,
    [u.id, status ? String(status) : null])
  return { orders: rows.map(orderView) }
})
