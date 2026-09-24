// тариф: цена в $ (центы) или ₽ (копейки). Новая цена действует только для новых заказов.
export default defineEventHandler(async (e) => {
  const a = await requireAdmin(e, 'products.write')
  const before = await one(`select pp.*, p.slug from product_plans pp join products p on p.id = pp.product_id where pp.id::text = $1`, [getRouterParam(e, 'id')])
  if (!before) fail(404, 'not_found', 'Тариф не найден.')
  const v = planInput({ ...before, ...(await readBody(e)) })
  const pl = await one(`update product_plans set label=$2, currency=$3, price_cents=$4, price_kop=$5, price_text=$6, description=$7, free=$8, active=$9, sort=$10, custom_min_cents=$11, custom_max_cents=$12
                         where id = $1 returning *`,
    [before.id, v.label, v.currency, v.price_cents, v.price_kop, v.price_text, v.description, v.free, v.active, v.sort, v.custom_min_cents, v.custom_max_cents])
  const changed: Record<string, any> = {}
  for (const k of ['label','currency','price_cents','price_kop','price_text','free','active','custom_min_cents','custom_max_cents']) if (String(before[k]) !== String(pl[k])) changed[k] = [before[k], pl[k]]
  await audit(e, a, 'plan.update', pl.id, { product: before.slug, label: pl.label, changed })
  await q(`update products set updated_at = now() where id = $1`, [pl.product_id])
  return { plan: pl }
})
