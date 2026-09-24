<script setup lang="ts">
const { api, ok, can } = useAdm()
const r = ref<any>({ products: [], categories: [] }), loading = ref(false)
const f = reactive({ q: '', category: null as string | null, active: null as string | null })
const nw = reactive({ open: false, slug: '', name: '', category_id: 'ai', delivery: 'manual', busy: false })
const rate = reactive({ open: false, v: null as number | null, busy: false })
async function load() {
  loading.value = true
  r.value = await api('GET', `/products?q=${encodeURIComponent(f.q)}${f.category ? '&category=' + f.category : ''}${f.active ? '&active=' + f.active : ''}`).finally(() => loading.value = false)
}
let t: any; watch(() => f.q, () => { clearTimeout(t); t = setTimeout(load, 300) }); watch(() => [f.category, f.active], load); onMounted(load)
async function create() {
  nw.busy = true
  try { const x: any = await api('POST', '/products', { slug: nw.slug, name: nw.name, category_id: nw.category_id, delivery: nw.delivery, active: false,
      buyer_fields: [{ key: 'account_email', label: 'E-mail аккаунта в сервисе', type: 'email', required: true }] })
    ok('Товар создан', 'Он выключен — добавьте тариф и включите'); navigateTo('/admin/products/' + x.product.slug) } finally { nw.busy = false }
}
async function saveRate() { rate.busy = true; try { await api('POST', '/rate', { rate: rate.v }); ok('Курс обновлён', 'Для новых заказов'); rate.open = false } finally { rate.busy = false } }
const catName = (id: string) => r.value.categories.find((c: any) => c.id === id)?.name || id
</script>
<template>
  <div class="adm-head"><div><span class="eyebrow">Каталог</span><h1>Товары и цены</h1></div>
    <div v-if="can('products.write')" class="row-actions"><Button label="Курс ₽/$" icon="pi pi-dollar" severity="secondary" outlined @click="rate.open = true" /><Button label="Новый товар" icon="pi pi-plus" @click="nw.open = true" /></div></div>
  <div class="toolbar">
    <IconField class="grow"><InputIcon class="pi pi-search" /><InputText v-model="f.q" placeholder="Название или адрес" fluid /></IconField>
    <Select v-model="f.category" :options="[{ id: null, name: 'Все разделы' }, ...r.categories]" option-label="name" option-value="id" style="min-width:190px" />
    <SelectButton v-model="f.active" :options="[{ v: null, l: 'Все' }, { v: 'true', l: 'Активные' }, { v: 'false', l: 'Архив' }]" option-label="l" option-value="v" />
  </div>
  <DataTable :value="r.products" :loading="loading" paginator :rows="50" size="small" row-hover :row-class="() => 'clickable'" @row-click="e => navigateTo('/admin/products/' + e.data.slug)">
    <Column header="Товар"><template #body="{ data }"><div style="display:flex;gap:10px;align-items:center"><img v-if="data.icon" :src="data.icon" alt="" style="width:28px;height:28px;border-radius:7px;background:#fff;padding:2px;object-fit:contain" /><div><b style="color:var(--text)">{{ data.name }}</b><div class="muted mono">{{ data.slug }}</div></div></div></template></Column>
    <Column header="Раздел"><template #body="{ data }">{{ catName(data.category_id) }}</template></Column>
    <Column header="Выдача"><template #body="{ data }">{{ DELIVERY[data.delivery] }}<span v-if="data.delivery === 'auto'" :class="data.keys_free < 5 ? 'warn' : 'muted'"> · ключей {{ data.keys_free }}</span></template></Column>
    <Column field="plans" header="Тарифов" />
    <Column header="Комиссия"><template #body="{ data }">{{ data.commission_pct == null ? 'формула' : data.commission_pct + ' %' }}</template></Column>
    <Column field="orders_30d" header="Заказов за 30 дн." />
    <Column header=""><template #body="{ data }"><Tag v-if="!data.active" value="Архив" severity="secondary" /></template></Column>
  </DataTable>
  <Dialog v-model:visible="nw.open" modal header="Новый товар" :style="{ width: 'min(460px, 94vw)' }">
    <div class="grid">
      <div class="field"><label>Название</label><InputText v-model="nw.name" fluid /></div>
      <div class="field"><label>Адрес (slug): латиница, цифры, дефис — будет /service/&lt;slug&gt;/</label><InputText v-model="nw.slug" placeholder="например, notion-plus" fluid /></div>
      <div class="field"><label>Раздел</label><Select v-model="nw.category_id" :options="r.categories" option-label="name" option-value="id" fluid /></div>
      <div class="field"><label>Выдача</label><Select v-model="nw.delivery" :options="Object.entries(DELIVERY).map(([v, l]) => ({ v, l }))" option-label="l" option-value="v" fluid /></div>
    </div>
    <template #footer><Button label="Отмена" severity="secondary" text @click="nw.open = false" /><Button label="Создать" :loading="nw.busy" :disabled="!nw.name || !nw.slug" @click="create" /></template>
  </Dialog>
  <Dialog v-model:visible="rate.open" modal header="Курс ₽ за $1" :style="{ width: 'min(380px, 94vw)' }">
    <p style="margin-top:0" class="muted">Применяется к новым заказам. В уже оформленных курс зафиксирован.</p>
    <InputNumber v-model="rate.v" :min-fraction-digits="2" :max-fraction-digits="4" locale="ru-RU" fluid placeholder="80,2254" />
    <template #footer><Button label="Отмена" severity="secondary" text @click="rate.open = false" /><Button label="Сохранить" :loading="rate.busy" :disabled="!rate.v" @click="saveRate" /></template>
  </Dialog>
</template>
