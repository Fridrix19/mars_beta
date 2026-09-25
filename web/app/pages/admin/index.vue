<script setup lang="ts">
const { api } = useAdm()
const s = ref<any>(null)
const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const period = ref({ from: iso(new Date(Date.now() - 29 * 86400000)), to: iso(new Date()) })
async function load() { s.value = await api('GET', '/summary?x=1' + periodQS(period.value)) }
watch(period, load, { deep: true }); onMounted(load)
const max = computed(() => Math.max(1, ...(s.value?.days || []).map((x: any) => (+x.sales_kop + +x.topups_kop))))
const fmtRange = computed(() => s.value ? `${d(s.value.period.from)} — ${d(s.value.period.to)}` : '')
</script>
<template>
  <div class="adm-head"><div><span class="eyebrow">Сводка</span><h1>Что происходит</h1></div><span v-if="s" class="muted mono">курс {{ s.rate }} ₽/$</span></div>
  <div v-if="s" class="grid" style="gap:18px">
    <div class="grid g4">
      <NuxtLink to="/admin/orders" :class="['kpi', { hot: s.orders_open + s.orders_need_info }]"><span class="k">Заказы в работе</span><span class="v">{{ s.orders_open }}</span><span class="muted">нужны данные: {{ s.orders_need_info }}</span></NuxtLink>
      <NuxtLink to="/admin/kyc" :class="['kpi', { hot: s.kyc_pending }]"><span class="k">KYC на проверке</span><span class="v">{{ s.kyc_pending }}</span><span class="muted">очередь по порядку</span></NuxtLink>
      <NuxtLink to="/admin/refunds" :class="['kpi', { hot: s.refunds_new }]"><span class="k">Заявки на возврат</span><span class="v">{{ s.refunds_new }}</span><span class="muted">новые</span></NuxtLink>
      <div class="kpi"><span class="k">На балансах клиентов</span><span class="v">{{ kop(+s.balances_kop) }}</span><span class="muted">пользователей всего {{ s.users_total }}</span></div>
    </div>
    <div class="panel grid" style="gap:12px">
      <div class="adm-head" style="margin:0"><h2>За период <span class="muted" style="font-size:14px;font-weight:500">{{ fmtRange }}</span></h2><AdmPeriod v-model="period" /></div>
      <div class="grid g4">
        <div class="kpi"><span class="k">Продажи</span><span class="v">{{ kop(+s.period.sales_kop) }}</span><span class="muted">{{ s.period.orders }} заказов · {{ s.period.buyers }} покупателей</span></div>
        <div class="kpi"><span class="k">Пополнения</span><span class="v">{{ kop(+s.period.topups_kop) }}</span><span class="muted">возвраты {{ kop(+s.period.refunds_kop) }}</span></div>
        <div class="kpi"><span class="k">Новые пользователи</span><span class="v">{{ s.period.users_new }}</span><span class="muted">прошли KYC: {{ s.period.kyc_approved }}</span></div>
        <div class="kpi"><span class="k">Посетители сайта</span><span class="v">{{ s.period.visitors }}</span><NuxtLink to="/admin/analytics" class="muted">подробнее в аналитике</NuxtLink></div>
      </div>
    </div>
    <div class="grid g2">
      <div class="panel">
        <div class="adm-head" style="margin:0"><h2>По дням</h2><div class="legend"><span><i style="background:#3D7EFC" />продажи</span><span><i style="background:#52CFF3;opacity:.55" />пополнения</span></div></div>
        <div v-if="s.days.length" class="chart">
          <div v-for="x in s.days" :key="x.day" class="col" v-tooltip.top="`${d(x.day)}: продажи ${kop(+x.sales_kop)}, пополнения ${kop(+x.topups_kop)}`">
            <div class="bar t" :style="{ height: (x.topups_kop / max * 100) + 'px' }" />
            <div class="bar" :style="{ height: (x.sales_kop / max * 100) + 'px' }" />
            <span v-if="s.days.length <= 31" class="lbl">{{ x.day.slice(8) }}</span>
          </div>
        </div>
        <p v-else class="muted">Период больше 3 месяцев — график по дням не строим, смотрите итоги выше.</p>
      </div>
      <div class="panel">
        <h2 style="margin-bottom:10px">Топ товаров</h2>
        <DataTable :value="s.top" size="small"><Column field="product_name" header="Товар" /><Column field="n" header="Заказов" /><Column header="Сумма"><template #body="{ data }">{{ kop(+data.kop) }}</template></Column>
          <template #empty><span class="muted">Заказов за период нет</span></template></DataTable>
        <div v-if="s.low_keys.length" style="margin-top:14px"><h3>Заканчиваются ключи</h3>
          <p v-for="k in s.low_keys" :key="k.slug" style="margin:6px 0"><NuxtLink :to="'/admin/products/' + k.slug">{{ k.name }}</NuxtLink> — свободно {{ k.free }}</p></div>
      </div>
    </div>
  </div>
</template>
