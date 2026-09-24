import type { H3Event } from 'h3'

export const ADM_COOKIE = 'mc_adm'
const HOURS = 12
export type AdminRole = 'owner' | 'operator' | 'kyc'
export type Admin = { id: string; login: string; name: string; role: AdminRole; must_change: boolean; session_id: string }

// что может каждая роль
const CAN: Record<string, AdminRole[]> = {
  summary: ['owner', 'operator', 'kyc'],
  users: ['owner', 'operator'],
  'users.write': ['owner', 'operator'],
  'balance.adjust': ['owner'],
  orders: ['owner', 'operator'],
  refunds: ['owner', 'operator'],
  kyc: ['owner', 'operator', 'kyc'],
  products: ['owner', 'operator'],
  'products.write': ['owner'],
  admins: ['owner'],
  audit: ['owner'],
  export: ['owner', 'operator'],
}
export function can(role: AdminRole, perm: string) { return (CAN[perm] || []).includes(role) }

export async function startAdminSession(e: H3Event, adminId: string) {
  const token = newToken()
  await q(`insert into admin_sessions (admin_id, token_hash, ip, user_agent, expires_at) values ($1, $2, $3, $4, now() + interval '${HOURS} hours')`,
    [adminId, sha256(token), clientIp(e), (getHeader(e, 'user-agent') || '').slice(0, 300)])
  await q(`update admins set last_login_at = now() where id = $1`, [adminId])
  const cfg = useRuntimeConfig()
  setCookie(e, ADM_COOKIE, token, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: HOURS * 3600,
    secure: cfg.cookieSecure === true || String(cfg.cookieSecure) === 'true' })
}

export async function currentAdmin(e: H3Event): Promise<Admin | null> {
  if (e.context.admin !== undefined) return e.context.admin
  const token = getCookie(e, ADM_COOKIE)
  let a: Admin | null = null
  if (token) a = await one<Admin>(
    `update admin_sessions s set last_seen_at = now() from admins a
      where s.token_hash = $1 and s.expires_at > now() and a.id = s.admin_id and a.active
      returning a.id, a.login, a.name, a.role, a.must_change, s.id as session_id`, [sha256(token)])
  e.context.admin = a
  return a
}

export async function requireAdmin(e: H3Event, perm?: string) {
  const a = await currentAdmin(e)
  if (!a) fail(401, 'admin_unauthorized', 'Войдите в админку.')
  if (perm && !can(a.role, perm)) fail(403, 'forbidden', 'Недостаточно прав для этого действия.')
  return a
}

export async function audit(e: H3Event, a: Admin, action: string, target: string | null, data: any = null) {
  await q(`insert into audit_log (admin_id, action, target, data, ip) values ($1, $2, $3, $4, $5)`, [a.id, action, target, data, clientIp(e)])
}

export function page(e: H3Event, def = 50) {
  const qy = getQuery(e)
  const limit = Math.min(Math.max(Number(qy.limit) || def, 1), 200)
  const offset = Math.max(Number(qy.offset) || 0, 0)
  return { limit, offset, q: qy.q ? String(qy.q).trim() : '' }
}

export function csv(e: H3Event, name: string, rows: any[], cols: string[]) {
  const esc = (v: any) => { if (v == null) return ''; const s = v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  setHeader(e, 'content-type', 'text/csv; charset=utf-8')
  setHeader(e, 'content-disposition', `attachment; filename="${name}"`)
  return '﻿' + [cols.join(';'), ...rows.map(r => cols.map(c => esc(r[c])).join(';'))].join('\n')
}
