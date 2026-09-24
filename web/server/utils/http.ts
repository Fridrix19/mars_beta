import type { H3Event } from 'h3'

// единый формат ошибки: { statusCode, message, data: { code, ...extra } }
export function fail(status: number, code: string, message: string, extra: Record<string, any> = {}): never {
  throw createError({ statusCode: status, statusMessage: code, message, data: { code, ...extra } })
}

export function clientIp(e: H3Event): string | null {
  // за одним прокси (Render) настоящий адрес — последний в X-Forwarded-For: левые значения клиент может подделать
  const xff = getHeader(e, 'x-forwarded-for')
  const ip = xff ? xff.split(',').map(s => s.trim()).filter(Boolean).pop() : getRequestIP(e)
  return ip && /^[0-9a-f:.]+$/i.test(ip) ? ip : null
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export function normEmail(v: unknown): string {
  const s = String(v ?? '').trim().toLowerCase()
  if (!EMAIL.test(s) || s.length > 254) fail(422, 'bad_email', 'Проверьте почту — например, mail@example.ru.')
  return s
}
export function checkPassword(v: unknown): string {
  const p = String(v ?? '')
  if (p.length < 8) fail(422, 'weak_password', 'Пароль не короче 8 символов.')
  if (p.length > 200) fail(422, 'weak_password', 'Слишком длинный пароль.')
  if (!/\d/.test(p) || !/[^\d\s]/.test(p)) fail(422, 'weak_password', 'Пароль слишком простой: нужны буквы и цифры.')
  return p
}
export function checkCode(v: unknown): string {
  const c = String(v ?? '').replace(/\D/g, '')
  if (c.length !== 6) fail(422, 'bad_code', 'Код — 6 цифр.')
  return c
}

// переводит ошибки SQL-функций (raise exception 'code') в HTTP
const PG_ERRORS: Record<string, [number, string]> = {
  kyc_required: [403, 'Покупки доступны после верификации личности.'],
  user_blocked: [403, 'Аккаунт заблокирован. Напишите в поддержку.'],
  insufficient_funds: [402, 'Недостаточно средств на балансе.'],
  plan_not_found: [404, 'Тариф не найден.'],
  product_inactive: [404, 'Товар сейчас недоступен.'],
  plan_not_purchasable: [422, 'Этот тариф нельзя купить — только по запросу.'],
  amount_out_of_range: [422, 'Сумма вне допустимого диапазона.'],
  user_not_found: [404, 'Пользователь не найден.'],
  card_unavailable: [422, 'Карта заморожена или не найдена.'],
}
export function pgFail(e: any): never {
  const known = PG_ERRORS[e?.message]
  if (known) {
    const extra: Record<string, any> = {}
    if (e.message === 'insufficient_funds' && e.detail) extra.shortfall_kop = Number(e.detail)
    if (e.message === 'amount_out_of_range' && e.detail) { const [a, b] = String(e.detail).split('-').map(Number); extra.min_cents = a; extra.max_cents = b }
    fail(known[0], e.message, known[1], extra)
  }
  throw e
}
