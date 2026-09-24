export async function rate(): Promise<number> {
  const r = await one<{ v: number }>(`select value::text::numeric as v from settings where key = 'rate_rub_per_usd'`)
  return r?.v ?? 0
}
// столько же, сколько посчитает place_order: charged_cents × курс, округление до копейки
export async function chargedKop(cents: number | null, rateRub: number) {
  const r = await one<{ c: number }>(`select charged_cents($1) as c`, [cents ?? 0])
  const c = r?.c ?? 0
  return { charged_cents: c, charged_kop: Math.round(c * rateRub) }
}
export function planView(p: any, rateRub: number) {
  const custom = p.custom_min_cents != null
  const purchasable = custom || (!p.free && p.price_cents > 0)
  const c = purchasable && !custom ? chargedJs(p.price_cents) : null
  return {
    id: p.id, label: p.label, price_text: p.price_text, description: p.description,
    price_cents: p.price_cents, free: p.free, purchasable,
    custom: custom ? { min_cents: p.custom_min_cents, max_cents: p.custom_max_cents } : null,
    charged_cents: c, charged_kop: c != null ? Math.round(c * rateRub) : null,
  }
}
// та же формула, что charged_cents() в SQL и computeChargedUsd в исходнике
export function chargedJs(cents: number) {
  const u = (cents || 2000) / 100
  return Math.round((u <= 45 ? (u + 5) * 1.2 : u * 1.3) * 100)
}
