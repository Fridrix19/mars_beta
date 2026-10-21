// чистые адреса страниц сайта: /catalog → catalog.html (сами файлы — в публичной статике).
// Существующие файлы статика отдаёт раньше; сюда приходят только адреса без расширения.
// Переадресацию старых адресов с .html на чистые делает nginx на боевом сервере.
const PAGE = /^\/[a-z0-9-]+$/
export default defineEventHandler(async (e) => {
  if (e.method !== 'GET' && e.method !== 'HEAD') return
  const path = (e.path || '').split('?')[0]
  if (!PAGE.test(path) || path === '/admin' || path === '/api') return
  const html = await $fetch<string>(path + '.html', { responseType: 'text' }).catch(() => null)
  if (typeof html !== 'string' || !html.startsWith('<!doctype html>')) return
  setHeader(e, 'content-type', 'text/html; charset=utf-8')
  return html
})
