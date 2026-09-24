import { fileURLToPath } from 'node:url'
import Marscap from './app/theme/marscap'

const root = fileURLToPath(new URL('..', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  ssr: true,
  modules: ['@primevue/nuxt-module'],
  primevue: {
    options: { theme: { preset: Marscap, options: { darkModeSelector: '.mc-dark', cssLayer: false } }, ripple: false },
    components: { include: '*' },
    directives: { include: ['Tooltip'] },
  },
  css: ['primeicons/primeicons.css', '~/assets/admin.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'ru', class: 'mc-dark' },
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
      link: [{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
             { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Onest:wght@600;700&family=JetBrains+Mono:wght@500&display=swap' }],
    },
  },
  routeRules: { '/admin/**': { ssr: false }, '/admin': { ssr: false } },
  runtimeConfig: {
    databaseUrl: '',            // NUXT_DATABASE_URL (или DATABASE_URL)
    secret: '',                 // NUXT_SECRET — HMAC кодов и ключ шифрования выдач
    mailProvider: 'log',        // NUXT_MAIL_PROVIDER: log | unisender
    unisenderKey: '',           // NUXT_UNISENDER_KEY
    unisenderUrl: 'https://goapi.unisender.ru/ru/transactional/api/v1', // NUXT_UNISENDER_URL (или go1/go2 — как в кабинете)
    mailFrom: 'noreply@marscap.ru',
    mailFromName: 'Marscap',
    paymentProvider: 'test',    // NUXT_PAYMENT_PROVIDER: test | … (боевой — позже)
    cookieSecure: false,        // NUXT_COOKIE_SECURE=true за HTTPS
    devCodes: false,            // NUXT_DEV_CODES=true — код приходит в ответе API (только стенд)
    public: { siteUrl: '' },
  },
  nitro: {
    // прототип отдаётся как статика; API — /api/*; админка — /admin (Nuxt + PrimeVue)
    publicAssets: [
      { dir: root + '_proto', baseURL: '/', maxAge: 0 },
      { dir: root + 'source-site/assets', baseURL: '/assets', maxAge: 60 * 60 * 24 },
    ],
  },
})
