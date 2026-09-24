// каталог: разделы и товары с минимальной ценой
export default defineEventHandler(async (e) => {
  const { category } = getQuery(e)
  const r = await rate()
  const cats = await q(`select id, name, sort from categories order by sort`)
  const rows = await q(
    `select p.slug, p.name, p.category_id, p.icon, p.delivery,
            p.commission_pct,
            (select min(pp.price_cents) from product_plans pp where pp.product_id = p.id and pp.active and pp.currency = 'usd' and not pp.free and pp.price_cents > 0) as min_cents,
            (select min(pp.price_kop) from product_plans pp where pp.product_id = p.id and pp.active and pp.currency = 'rub' and pp.price_kop > 0) as min_kop,
            (select min(pp.custom_min_cents) from product_plans pp where pp.product_id = p.id and pp.active) as min_custom
       from products p where p.active and ($1::text is null or p.category_id = $1) order by p.category_id, p.sort`,
    [category ? String(category) : null])
  return {
    rate: r, categories: cats,
    products: rows.map(p => {
      const from = p.min_cents ?? p.min_custom
      const t = from ? planTotal({ currency: 'usd', price_cents: from }, r, p.commission_pct) : p.min_kop ? planTotal({ currency: 'rub', price_kop: p.min_kop }, r, p.commission_pct) : null
      return { slug: p.slug, name: p.name, category: p.category_id, icon: p.icon, delivery: p.delivery,
               from_cents: from ?? null, from_kop: t?.charged_kop ?? null }
    }),
  }
})
