export default defineEventHandler(async (e) => {
  const a = await currentAdmin(e)
  if (!a) return { admin: null }
  const perms = ['summary','users','users.write','balance.adjust','orders','refunds','kyc','products','products.write','admins','audit','export'].filter(p => can(a.role, p))
  return { admin: { id: a.id, login: a.login, name: a.name, role: a.role, must_change: a.must_change }, perms }
})
