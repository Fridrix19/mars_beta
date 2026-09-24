// профиль: имя и необязательный телефон
export default defineEventHandler(async (e) => {
  const u = await requireUser(e)
  const b = await readBody(e)
  const name = b?.name != null ? String(b.name).trim().slice(0, 80) || null : undefined
  let phone: string | null | undefined
  if (b?.phone !== undefined) {
    const d = String(b.phone ?? '').replace(/\D/g, '')
    if (!d) phone = null
    else {
      const n = d.length === 11 && (d[0] === '8' || d[0] === '7') ? '7' + d.slice(1) : d.length === 10 ? '7' + d : d
      if (n.length < 11 || n.length > 15) fail(422, 'bad_phone', 'Проверьте номер: +7 900 000-00-00.')
      phone = '+' + n
    }
  }
  await q(`update users set name = coalesce($2, name), phone = case when $4 then $3 else phone end where id = $1`,
    [u.id, name === undefined ? null : name, phone ?? null, phone !== undefined])
  return { user: await me(e, u.id) }
})
