// шаг 1 показа реквизитов: код на почту
export default defineEventHandler(async (e) => {
  const u = await requireUser(e)
  const c = await one(`select id, status from cards where id::text = $1 and user_id = $2`, [getRouterParam(e, 'id'), u.id])
  if (!c) fail(404, 'not_found', 'Карта не найдена.')
  if (c.status !== 'active') fail(422, 'card_frozen', 'Карта заморожена — сначала разморозьте её.')
  return issueCode(e, u.email, 'reveal')
})
