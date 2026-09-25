<script setup lang="ts">
const { api, ok } = useAdm()
const s = ref<any>(null), domains = ref(''), busy = ref(''), to = ref('')
async function load() { s.value = await api('GET', '/settings'); domains.value = s.value.email_domains.join('\n') }
onMounted(load)
async function saveDomains() { busy.value = 'd'; try { const r: any = await api('POST', '/settings/domains', { domains: domains.value }); ok('Сохранено', `Доменов: ${r.email_domains.length}`); await load() } finally { busy.value = '' } }
async function test() { busy.value = 't'; try { await api('POST', '/settings/mail-test', { to: to.value }); ok('Письмо отправлено', 'Проверьте входящие и «Спам»') } finally { busy.value = '' } }
</script>
<template>
  <div class="adm-head"><div><span class="eyebrow">Сервис</span><h1>Настройки</h1></div></div>
  <div v-if="s" class="grid g2" style="align-items:start">
    <div class="panel grid">
      <h2>Почта для регистрации</h2>
      <p class="muted" style="margin:0">Зарегистрироваться можно только с почтой этих доменов — временные и одноразовые адреса не пройдут. По одному на строку. Пустой список — принимать любые.</p>
      <Textarea v-model="domains" rows="12" class="mono" auto-resize fluid />
      <div><Button label="Сохранить список" :loading="busy === 'd'" @click="saveDomains" /></div>
      <p class="muted" style="margin:0;font-size:13px">Уже зарегистрированных это не касается.</p>
    </div>
    <div class="panel grid">
      <h2>Отправка писем</h2>
      <dl class="kv">
        <dt>Режим</dt><dd><Tag :value="s.mail.provider === 'unisender' ? 'Unisender Go — письма уходят' : 'log — письма НЕ уходят'" :severity="s.mail.provider === 'unisender' ? 'success' : 'danger'" /></dd>
        <dt>Отправитель</dt><dd class="mono">{{ s.mail.from }}</dd>
        <dt>Коды на экране</dt><dd>{{ s.mail.codes_on_screen ? 'да (стенд без почты)' : 'нет — только письмом' }}</dd>
        <dt>Адрес сайта в письмах</dt><dd class="mono">{{ s.mail.site_url || 'не задан (NUXT_PUBLIC_SITE_URL)' }}</dd>
        <dt>Уведомления команде</dt><dd class="mono">{{ s.mail.admin_notify || 'не заданы (NUXT_ADMIN_NOTIFY_EMAIL)' }}</dd>
      </dl>
      <Message v-if="s.mail.provider !== 'unisender'" severity="warn" size="small">
        Письма сейчас не отправляются: {{ s.mail.configured_provider !== 'unisender' ? 'NUXT_MAIL_PROVIDER не равен unisender' : 'нет NUXT_UNISENDER_KEY' }}. Поэтому коды показываются в окне на сайте. Задайте переменные в Render и перезапустите сервис.
      </Message>
      <div class="field"><label>Тестовое письмо на адрес</label><div style="display:flex;gap:8px;flex-wrap:wrap"><InputText v-model="to" placeholder="you@gmail.com" style="flex:1;min-width:200px" /><Button label="Отправить" :loading="busy === 't'" :disabled="!to" @click="test" /></div></div>
    </div>
  </div>
</template>
