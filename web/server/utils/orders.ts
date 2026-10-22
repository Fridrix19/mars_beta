export const ORDER_STATUS: Record<string, string> = {
  paid: 'Оплачен', in_work: 'В работе', need_info: 'Нужны данные', done: 'Выполнен', canceled: 'Отменён', refunded: 'Возврат',
}
export function orderView(o: any) {
  if (!o) return null
  return {
    id: o.id, product_name: o.product_name, plan_label: o.plan_label,
    price_cents: o.price_cents, charged_cents: o.charged_cents, rate: o.rate, amount_kop: o.amount_kop,
    buyer_fields: o.buyer_fields, status: o.status, status_text: ORDER_STATUS[o.status] ?? o.status,
    delivered: !!o.delivered_at, delivered_at: o.delivered_at, created_at: o.created_at, updated_at: o.updated_at,
    product_slug: o.product_slug, bonus_kop: Number(o.bonus_kop || 0), gift_to: o.gift_to || null, reviewed: !!o.reviewed, chat_unread: Number(o.chat_unread || 0),
  }
}

// проверки перед покупкой — общие для покупки с баланса и для пополнения «под заказ»
export async function prepareOrder(u: { id: string; email: string }, b: any) {
  const pend = await pendingDocuments(u.id)
  if (pend.length) fail(409, 'docs_update_required', 'Обновились условия: ' + pend.map(d => d.title).join(', ') + '. Ознакомьтесь и примите их в разделе «Документы», затем повторите покупку.', { documents: pend.map(d => d.id) })
  const plan = await one(
    `select pp.id, pr.buyer_fields, pr.slug from product_plans pp join products pr on pr.id = pp.product_id where pp.id::text = $1`, [String(b?.plan_id ?? '')])
  if (!plan) fail(404, 'plan_not_found', 'Тариф не найден.')
  const fields: Record<string, string> = validateFields(plan.buyer_fields, b?.fields)
  // пополнение существующей карты: карта должна быть своей и активной
  // card_id — в теле или в полях (так шлёт кабинет при «пополнить и купить»)
  const cardId = b?.card_id ?? b?.fields?.card_id
  // выпуск новой карты (в том числе в подарок) — только после одобренной верификации
  if (plan.slug === 'virtual-card' && !cardId) {
    const k = await one<{ kyc_status: string }>(`select kyc_status from users where id = $1`, [u.id])
    if (k?.kyc_status !== 'approved')
      fail(403, 'kyc_required', k?.kyc_status === 'pending'
        ? 'Документы на проверке — карту можно будет выпустить сразу после одобрения.'
        : 'Выпуск карты доступен после верификации: ФИО, телефон или почта и документ, удостоверяющий личность.', { kyc_status: k?.kyc_status })
  }
  if (plan.slug === 'virtual-card' && cardId) {
    const card = await one(`select id from cards where id::text = $1 and user_id = $2 and status = 'active' and (gift_to is null or claimed_at is not null)`, [String(cardId), u.id])
    if (!card) fail(422, 'card_unavailable', 'Карта заморожена или не найдена.')
    fields.card_id = card.id
  }
  // подарок другу: почта получателя (для карты — кому достанется карта, для сервиса — аккаунт друга)
  const giftTo = b?.gift_to ? normEmail(b.gift_to) : null
  if (giftTo && giftTo === u.email) fail(422, 'gift_self', 'Это ваша почта — выберите «На мою почту».')
  if (giftTo && cardId) fail(422, 'gift_topup', 'Подарить можно новую карту, а не пополнение своей.')
  if (giftTo && plan.slug !== 'virtual-card' && 'account_email' in fields) fields.account_email = giftTo
  let amount: number | null = null
  if (b?.amount_cents != null && b.amount_cents !== '') {
    amount = Math.round(Number(b.amount_cents))
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) fail(422, 'amount_out_of_range', 'Проверьте сумму.')
  }
  return { plan_id: plan.id as string, fields, gift_to: giftTo, amount_cents: amount, use_bonus: b?.use_bonus !== false }
}

function validateFields(spec: any[], input: any) {
  const out: Record<string, string> = {}
  const errors: Record<string, string> = {}
  for (const f of spec || []) {
    const v = String(input?.[f.key] ?? '').trim().slice(0, 500)
    if (!v) { if (f.required) errors[f.key] = `Заполните поле «${f.label}».`; continue }
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { errors[f.key] = 'Проверьте почту.'; continue }
    out[f.key] = v
  }
  if (Object.keys(errors).length) fail(422, 'bad_fields', Object.values(errors)[0], { fields: errors })
  return out
}
