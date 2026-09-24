// каталог: разделы и товары с минимальной ценой
export default defineEventHandler(async (e) => {
  const { category } = getQuery(e)
  const r = await rate()
  const cats = await q(`select id, name, sort from categories order by sort`)
  const rows = await q(
    `select p.slug, p.name, p.category_id, p.icon, p.delivery,
            (select min(pp.price_cents) from product_plans pp where pp.product_id = p.id and pp.active and not pp.free and pp.price_cents > 0) as min_cents,
            (select min(pp.custom_min_cents) from product_plans pp where pp.product_id = p.id and pp.active) as min_custom
       from products p where p.active and ($1::text is null or p.category_id = $1) order by p.category_id, p.sort`,
    [category ? String(category) : null])
  return {
    rate: r, categories: cats,
    products: rows.map(p => {
      const from = p.min_cents ?? p.min_custom
      const c = from ? chargedJs(from) : null
      return { slug: p.slug, name: p.name, category: p.category_id, icon: p.icon, delivery: p.delivery,
               from_cents: from, from_kop: c != null ? Math.round(c * r) : null }
    }),
  }
})
