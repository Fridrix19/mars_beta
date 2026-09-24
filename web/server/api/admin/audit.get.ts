export default defineEventHandler(async (e) => {
  await requireAdmin(e, 'audit')
  const { limit, offset, q: s } = page(e, 100)
  const rows = await q(`select l.id, l.action, l.target, l.data, host(l.ip) ip, l.created_at, a.login, a.name
      from audit_log l left join admins a on a.id = l.admin_id
     where ($1 = '' or l.action ilike '%' || $1 || '%' or coalesce(l.target,'') ilike '%' || $1 || '%' or coalesce(a.login,'') ilike '%' || $1 || '%')
     order by l.id desc limit ${limit} offset ${offset}`, [s])
  return { entries: rows }
})
