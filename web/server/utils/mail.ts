// Отправка писем: log (в консоль — стенд без DNS) или Unisender Go
type Mail = { to: string; subject: string; text: string; html?: string }

export async function sendMail(m: Mail) {
  const cfg = useRuntimeConfig()
  if (cfg.mailProvider !== 'unisender' || !cfg.unisenderKey) {
    console.log(`[mail] → ${m.to} · ${m.subject}\n${m.text}`)
    return { ok: true, provider: 'log' }
  }
  const res = await fetch(cfg.unisenderUrl + '/email/send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': cfg.unisenderKey },
    body: JSON.stringify({
      message: {
        recipients: [{ email: m.to }],
        subject: m.subject,
        from_email: cfg.mailFrom, from_name: cfg.mailFromName,
        body: { plaintext: m.text, ...(m.html ? { html: m.html } : {}) },
        track_links: 0, track_read: 0,
      },
    }),
  })
  if (!res.ok) {
    console.error('[mail] unisender', res.status, await res.text().catch(() => ''))
    return { ok: false, provider: 'unisender' }
  }
  return { ok: true, provider: 'unisender' }
}

const SUBJ: Record<string, string> = {
  register: 'Код подтверждения регистрации',
  login: 'Код для входа',
  reset: 'Код для восстановления пароля',
  change_email: 'Код для смены почты',
}
export function codeMail(to: string, purpose: string, code: string): Mail {
  const subject = `${code} — ${SUBJ[purpose] || 'код Marscap'}`
  const text = `${SUBJ[purpose] || 'Код'}: ${code}\n\nКод действует 10 минут. Если вы ничего не запрашивали — просто удалите письмо.\n\nMarscap`
  const html = `<div style="font:15px/1.5 Arial,sans-serif;color:#0E1420"><p>${SUBJ[purpose] || 'Код'}:</p>
<p style="font:600 28px/1 'Courier New',monospace;letter-spacing:6px;color:#0244BE">${code}</p>
<p style="color:#596070">Код действует 10 минут. Если вы ничего не запрашивали — просто удалите письмо.</p><p>Marscap</p></div>`
  return { to, subject, text, html }
}
