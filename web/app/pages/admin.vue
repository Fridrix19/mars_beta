<script setup lang="ts">
// оболочка админки: проверка входа, боковое меню со счётчиками, обязательная смена пароля
const { api, me, can } = useAdm()
const route = useRoute()
const ready = ref(false)
const counts = ref<any>({})
const isLogin = computed(() => route.path === '/admin/login')
useHead({ title: 'Админка — Marscap' })

async function loadMe() {
  const r: any = await $fetch('/api/admin/auth/me').catch(() => ({ admin: null, perms: [] }))
  me.value = { admin: r.admin, perms: r.perms || [] }
  if (!r.admin && !isLogin.value) return navigateTo('/admin/login')
  if (r.admin && isLogin.value) return navigateTo('/admin')
}
async function loadCounts() { if (me.value.admin) counts.value = await api('GET', '/summary', undefined, { quiet: true }).catch(() => ({})) }
onMounted(async () => { await loadMe(); ready.value = true; loadCounts() })
watch(() => route.path, () => { if (!isLogin.value) loadCounts() })

const nav = computed(() => [
  { to: '/admin', label: 'Сводка', icon: 'pi-chart-bar', perm: 'summary', exact: true },
  { to: '/admin/orders', label: 'Заказы', icon: 'pi-shopping-bag', perm: 'orders', n: counts.value.orders_open + (counts.value.orders_need_info || 0) || 0 },
  { to: '/admin/kyc', label: 'Верификация', icon: 'pi-id-card', perm: 'kyc', n: counts.value.kyc_pending, warn: true },
  { to: '/admin/refunds', label: 'Возвраты', icon: 'pi-replay', perm: 'refunds', n: counts.value.refunds_new, warn: true },
  { to: '/admin/users', label: 'Пользователи', icon: 'pi-users', perm: 'users' },
  { to: '/admin/products', label: 'Товары и цены', icon: 'pi-box', perm: 'products' },
  { to: '/admin/export', label: 'Выгрузки CSV', icon: 'pi-download', perm: 'export' },
  { to: '/admin/admins', label: 'Админы', icon: 'pi-shield', perm: 'admins' },
  { to: '/admin/audit', label: 'Журнал действий', icon: 'pi-history', perm: 'audit' },
].filter(i => can(i.perm)))

async function logout() { await $fetch('/api/admin/auth/logout', { method: 'POST' }); me.value = { admin: null, perms: [] }; navigateTo('/admin/login') }
const pw = reactive({ open: false, old: '', new: '', busy: false })
async function changePw() {
  pw.busy = true
  try { await api('POST', '/auth/password', { old: pw.old, new: pw.new }); pw.open = false; pw.old = pw.new = ''; await loadMe() } finally { pw.busy = false }
}
</script>

<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <NuxtPage v-if="isLogin" />
  <div v-else-if="ready && me.admin" class="adm">
    <aside class="adm-side">
      <div class="adm-brand">Marscap <small>admin</small></div>
      <nav class="adm-nav">
        <NuxtLink v-for="i in nav" :key="i.to" :to="i.to" :class="{ 'is-on': i.exact ? route.path === i.to : route.path.startsWith(i.to) }" exact-active-class="x-exact" active-class="x-active">
          <i :class="['pi', i.icon]" />{{ i.label }}<span v-if="i.n" :class="['n', { warn: i.warn }]">{{ i.n }}</span>
        </NuxtLink>
      </nav>
      <div class="adm-me">
        <div><b>{{ me.admin.name }}</b><div class="muted mono">{{ me.admin.login }} · {{ ROLE[me.admin.role] }}</div></div>
        <Button size="small" severity="secondary" outlined label="Сменить пароль" icon="pi pi-key" @click="pw.open = true" />
        <Button size="small" severity="secondary" text label="Выйти" icon="pi pi-sign-out" @click="logout" />
      </div>
    </aside>
    <main class="adm-main">
      <div v-if="me.admin.must_change" class="banner"><i class="pi pi-exclamation-triangle warn" />
        <span>Вы вошли с временным паролем{{ me.admin.login === 'admin' ? ' admin/admin' : '' }}. Смените его, прежде чем работать дальше.</span>
        <Button size="small" label="Сменить пароль" @click="pw.open = true" />
      </div>
      <NuxtPage @changed="loadCounts" />
    </main>
  </div>
  <Dialog v-model:visible="pw.open" modal header="Смена пароля" :style="{ width: 'min(420px, 94vw)' }">
    <div class="grid">
      <div class="field"><label>Текущий пароль</label><Password v-model="pw.old" :feedback="false" toggle-mask fluid /></div>
      <div class="field"><label>Новый пароль — от 10 символов, буквы и цифры</label><Password v-model="pw.new" toggle-mask fluid /></div>
    </div>
    <template #footer><Button label="Отмена" severity="secondary" text @click="pw.open = false" /><Button label="Сохранить" :loading="pw.busy" @click="changePw" /></template>
  </Dialog>
</template>
