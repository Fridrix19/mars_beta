<script setup lang="ts">
const { api } = useAdm()
const rows = ref<any[]>([]), total = ref(0), loading = ref(false)
const f = reactive({ q: '', kyc: null as string | null, first: 0 })
async function load() {
  loading.value = true
  const r: any = await api('GET', `/users?limit=50&offset=${f.first}&q=${encodeURIComponent(f.q)}${f.kyc ? '&kyc=' + f.kyc : ''}`).finally(() => loading.value = false)
  rows.value = r.users; total.value = r.total
}
let t: any; watch(() => f.q, () => { clearTimeout(t); t = setTimeout(() => { f.first = 0; load() }, 300) })
watch(() => f.kyc, () => { f.first = 0; load() }); onMounted(load)
</script>
<template>
  <div class="adm-head"><div><span class="eyebrow">Клиенты</span><h1>Пользователи</h1></div><span class="muted">{{ total }}</span></div>
  <div class="toolbar">
    <IconField class="grow"><InputIcon class="pi pi-search" /><InputText v-model="f.q" placeholder="Почта, имя, телефон или id" fluid /></IconField>
    <Select v-model="f.kyc" :options="[{ v: null, l: 'Любой KYC' }, { v: 'none', l: 'Без KYC' }, { v: 'pending', l: 'На проверке' }, { v: 'approved', l: 'Пройден' }, { v: 'rejected', l: 'Отклонён' }]" option-label="l" option-value="v" style="min-width:180px" />
  </div>
  <DataTable :value="rows" :loading="loading" lazy paginator :rows="50" :total-records="total" :first="f.first" @page="e => { f.first = e.first; load() }"
    row-hover :row-class="() => 'clickable'" @row-click="e => navigateTo('/admin/users/' + e.data.id)" size="small">
    <Column header="Почта"><template #body="{ data }"><b style="color:var(--text)">{{ data.email }}</b><div class="muted">{{ data.name || '' }} {{ data.phone || '' }}</div></template></Column>
    <Column header="Баланс"><template #body="{ data }"><span class="mono">{{ kop(data.balance_kop) }}</span></template></Column>
    <Column header="KYC"><template #body="{ data }"><Tag :value="KYC_ST[data.kyc_status][0]" :severity="KYC_ST[data.kyc_status][1]" /></template></Column>
    <Column field="orders" header="Заказов" />
    <Column header="Статус"><template #body="{ data }"><Tag v-if="data.status === 'blocked'" value="Заблокирован" severity="danger" /><span v-else class="muted">активен</span></template></Column>
    <Column header="Регистрация"><template #body="{ data }">{{ d(data.created_at) }}</template></Column>
    <Column header="Вход"><template #body="{ data }">{{ dt(data.last_login_at) }}</template></Column>
    <template #empty><span class="muted">Никого не нашли</span></template>
  </DataTable>
</template>
