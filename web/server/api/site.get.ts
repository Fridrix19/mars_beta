// публичные настройки сайта: контакты и действующие документы
export default defineEventHandler(async (e) => {
  setHeader(e, 'cache-control', 'no-store')
  const c = await one(`select value v from settings where key = 'contacts'`)
  return { contacts: c?.v || {}, documents: await currentDocuments() }
})
