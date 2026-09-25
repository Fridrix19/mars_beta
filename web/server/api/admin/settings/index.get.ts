// настройки сервиса: разрешённые почтовые домены и состояние почты
export default defineEventHandler(async (e) => {
  await requireAdmin(e, 'admins')
  const cfg = useRuntimeConfig()
  const d = await one<{ v: string[] }>(`select value v from settings where key = 'email_domains'`)
  return {
    email_domains: d?.v || [],
    mail: {
      provider: cfg.mailProvider === 'unisender' && cfg.unisenderKey ? 'unisender' : 'log',
      configured_provider: cfg.mailProvider, has_key: !!cfg.unisenderKey, from: cfg.mailFrom,
      site_url: cfg.public.siteUrl || null, admin_notify: cfg.adminNotifyEmail || null,
      codes_on_screen: devCodesVisible(),
    },
  }
})
