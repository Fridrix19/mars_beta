<script setup lang="ts">
const { api } = useAdm()
const s = ref<any>(null)
onMounted(async () => { s.value = await api('GET', '/summary') })
const max = computed(() => Math.max(1, ...(s.value?.days || []).map((x: any) => (+x.sales_kop + +x.topups_kop))))
</script>
<template>
  <div class="adm-head"><div><span class="eyebrow">Сводка</span><h1>Что происходит</h1></div><span v-if="s" class="muted mono">курс {{ s.rate }} ₽/$</span></div>
  <div v-if="s" class="grid" style="gap:18px">
    <div class="grid g4">
      <NuxtLink to="/admin/orders" :class="['kpi', { hot: s.orders_open + s.orders_need_info }]"><span class="k">Заказы в работе</span><span class="v">{{ s.orders_open }}</span><span class="muted">нужны данные: {{ s.orders_need_info }}</span></NuxtLink>
      <NuxtLink to="/admin/kyc" :class="['kpi', { hot: s.kyc_pending }]"><span class="k">KYC на проверке</span><span class="v">{{ s.kyc_pending }}</span><span class="muted">очередь по порядку</span></NuxtLink>
      <NuxtLink to="/admin/refunds" :class="['kpi', { hot: s.refunds_new }]"><span class="k">Заявки на возврат</span><span class="v">{{ s.refunds_new }}</span><span class="muted">новые</span></NuxtLink>
      <NuxtLink to="/admin/users" class="kpi"><span class="k">Пользователи</span><span class="v">{{ s.users_total }}</span><span class="muted">+{{ s.users_7d }} за 7 дней</span></NuxtLink>
    </div>
    <div class="grid g4">
      <div class="kpi"><span class="k">Продажи сегодня</span><span class="v">{{ kop(+s.sales_today_kop) }}</span></div>
      <div class="kpi"><span class="k">Продажи 7 дней</span><span class="v">{{ kop(+s.sales_7d_kop) }}</span></div>
      <div class="kpi"><span class="k">Продажи 30 дней</span><span class="v">{{ kop(+s.sales_30d_kop) }}</span><span class="muted">{{ s.orders_30d }} заказов</span></div>
      <div class="kpi"><span class="k">На балансах клиентов</span><span class="v">{{ kop(+s.balances_kop) }}</span><span class="muted">пополнено за 30 дней {{ kop(+s.topups_30d_kop) }}</span></div>
    </div>
    <div class="grid g2">
      <div class="panel">
        <div class="adm-head" style="margin:0"><h2>14 дней</h2><div class="legend"><span><i style="background:#3D7EFC" />продажи</span><span><i style="background:#52CFF3;opacity:.55" />пополнения</span></div></div>
        <div class="chart">
          <div v-for="x in s.days" :key="x.day" class="col" v-tooltip.top="`${x.day}: продажи ${kop(+x.sales_kop)}, пополнения ${kop(+x.topups_kop)}`">
            <div class="bar t" :style="{ height: (x.topups_kop / max * 100) + 'px' }" />
            <div class="bar" :style="{ height: (x.sales_kop / max * 100) + 'px' }" />
            <span class="lbl">{{ x.day.slice(8) }}</span>
          </div>
        </div>
      </div>
      <div class="panel">
        <h2 style="margin-bottom:10px">Топ товаров за 30 дней</h2>
        <DataTable :value="s.top" size="small"><Column field="product_name" header="Товар" /><Column field="n" header="Заказов" /><Column header="Сумма"><template #body="{ data }">{{ kop(+data.kop) }}</template></Column>
          <template #empty><span class="muted">Заказов пока нет</span></template></DataTable>
        <div v-if="s.low_keys.length" style="margin-top:14px"><h3>Заканчиваются ключи</h3>
          <p v-for="k in s.low_keys" :key="k.slug" style="margin:6px 0"><NuxtLink :to="'/admin/products/' + k.slug">{{ k.name }}</NuxtLink> — свободно {{ k.free }}</p></div>
      </div>
    </div>
  </div>
</template>
