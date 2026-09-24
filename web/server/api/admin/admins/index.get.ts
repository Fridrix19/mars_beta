export default defineEventHandler(async (e) => {
  await requireAdmin(e, 'admins')
  return { admins: await q(`select id, login, name, role, active, must_change, created_at, last_login_at from admins order by created_at`) }
})
