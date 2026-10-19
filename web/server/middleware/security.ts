// общие заголовки безопасности и предел размера тела запроса (до чтения тела — иначе гигабайтный файл целиком ляжет в память)
const MB = 1024 * 1024
function bodyLimit(path: string) {
  if (path.startsWith('/api/kyc')) return 45 * MB
  if (path.startsWith('/api/admin/settings/documents')) return 25 * MB
  if (/^\/api\/(admin\/)?chats\/.*send/.test(path)) return 11 * MB
  return 1 * MB
}
export default defineEventHandler((e) => {
  setResponseHeaders(e, {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'SAMEORIGIN',
  })
  const cfg = useRuntimeConfig()
  if (cfg.cookieSecure === true || String(cfg.cookieSecure) === 'true') setResponseHeader(e, 'strict-transport-security', 'max-age=31536000')
  const path = e.path || ''
  if (!path.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(e.method)) return
  const len = Number(getHeader(e, 'content-length') || 0)
  const chunked = /chunked/i.test(getHeader(e, 'transfer-encoding') || '')
  if (len > bodyLimit(path) || (chunked && !len)) fail(413, 'too_large', 'Слишком большой запрос: файл до 10 МБ.')
  if (path === '/api/t' && (tooMany('t:' + clientIp(e), 120, 60) || (hit('t:' + clientIp(e)), false))) { setResponseStatus(e, 204); return null }
})
