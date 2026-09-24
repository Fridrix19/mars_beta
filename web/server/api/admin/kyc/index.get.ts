// очередь верификации: pending первыми
export default defineEventHandler(async (e) => {
  await requireAdmin(e, 'kyc')
  const { status } = getQuery(e)
  const rows = await q(`select k.id, k.status, k.reason, k.created_at, k.reviewed_at, array_length(k.file_ids,1) files, k.birth_date,
      u.id user_id, u.email, u.name, a.name reviewer
    from kyc_submissions k join users u on u.id = k.user_id left join admins a on a.id = k.reviewed_by
    where ($1::text is null or k.status = $1) order by (k.status = 'pending') desc, k.created_at asc limit 200`, [status ? String(status) : 'pending'])
  return { submissions: rows }
})
