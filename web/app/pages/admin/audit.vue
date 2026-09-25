<script setup lang="ts">
const { api } = useAdm()
const rows = ref<any[]>([]), q = ref(''), first = ref(0)
async function load() { rows.value = ((await api('GET', `/audit?limit=100&offset=${first.value}&q=${encodeURIComponent(q.value)}`)) as any).entries }
let t: any; watch(q, () => { clearTimeout(t); t = setTimeout(() => { first.value = 0; load() }, 300) }); onMounted(load)
const A: Record<string, string> = { 'admin.login': 'Вход', 'admin.login_failed': 'Неудачный вход', 'admin.password': 'Смена пароля', 'admin.create': 'Новый админ', 'admin.update': 'Изменён админ',
  'balance.adjust': 'Корректировка баланса', 'user.block': 'Блокировка', 'user.unblock': 'Разблокировка', 'order.status': 'Статус заказа', 'order.deliver': 'Выдача вручную', 'order.deliver_key': 'Выдача ключа',
  'order.refund': 'Возврат заказа', 'refund.approve': 'Возврат одобрен', 'refund.reject': 'Возврат отклонён', 'refund.done': 'Возврат на карту выполнен', 'kyc.view': 'Просмотр KYC', 'kyc.approve': 'KYC одобрен', 'kyc.reject': 'KYC отклонён',
  'product.create': 'Новый товар', 'product.update': 'Изменён товар', 'plan.create': 'Новый тариф', 'plan.update': 'Изменён тариф', 'keys.add': 'Ключи добавлены', 'keys.revoke': 'Ключ отозван', 'rate.update': 'Курс изменён', 'settings.domains': 'Домены почты', 'settings.mail_test': 'Тестовое письмо' }
</script>
<template>
  <div class="adm-head"><div><span class="eyebrow">Безопасность</span><h1>Журнал действий</h1></div></div>
  <div class="toolbar"><IconField class="grow"><InputIcon class="pi pi-search" /><InputText v-model="q" placeholder="Действие, логин или объект" fluid /></IconField>
    <Button label="Раньше" severity="secondary" outlined :disabled="rows.length < 100" @click="first += 100; load()" /><Button v-if="first" label="Сначала" severity="secondary" text @click="first = 0; load()" /></div>
  <DataTable :value="rows" size="small">
    <Column header="Когда"><template #body="{ data }">{{ dt(data.created_at) }}</template></Column>
    <Column header="Кто"><template #body="{ data }">{{ data.name || '—' }}<div class="muted mono">{{ data.ip }}</div></template></Column>
    <Column header="Действие"><template #body="{ data }">{{ A[data.action] || data.action }}</template></Column>
    <Column header="Объект"><template #body="{ data }"><span class="mono muted">{{ data.target }}</span></template></Column>
    <Column header="Детали"><template #body="{ data }"><span v-if="data.data" class="mono" style="font-size:12px">{{ JSON.stringify(data.data).slice(0, 180) }}</span></template></Column>
  </DataTable>
</template>
