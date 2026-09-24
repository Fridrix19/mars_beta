export default defineEventHandler(async (e) => {
  await requireAdmin(e, 'summary')
  const s = await one(`select
      (select count(*)::int from users) users_total,
      (select count(*)::int from users where created_at > now() - interval '7 days') users_7d,
      (select count(*)::int from kyc_submissions where status = 'pending') kyc_pending,
      (select count(*)::int from orders where status in ('paid','in_work')) orders_open,
      (select count(*)::int from orders where status = 'need_info') orders_need_info,
      (select count(*)::int from refund_requests where status = 'new') refunds_new,
      (select coalesce(sum(-amount_kop),0) from ledger_entries where kind = 'purchase' and created_at > date_trunc('day', now())) sales_today_kop,
      (select coalesce(sum(-amount_kop),0) from ledger_entries where kind = 'purchase' and created_at > now() - interval '7 days') sales_7d_kop,
      (select coalesce(sum(-amount_kop),0) from ledger_entries where kind = 'purchase' and created_at > now() - interval '30 days') sales_30d_kop,
      (select count(*)::int from orders where created_at > now() - interval '30 days') orders_30d,
      (select coalesce(sum(amount_kop),0) from payments where status = 'succeeded' and paid_at > now() - interval '30 days') topups_30d_kop,
      (select coalesce(sum(b),0) from (select distinct on (user_id) balance_after b from ledger_entries order by user_id, id desc) t) balances_kop,
      (select value::text::numeric from settings where key = 'rate_rub_per_usd') rate`)
  const days = await q(`select to_char(d, 'YYYY-MM-DD') as day,
      coalesce((select sum(-amount_kop) from ledger_entries where kind = 'purchase' and created_at >= d and created_at < d + interval '1 day'), 0) sales_kop,
      coalesce((select sum(amount_kop) from payments where status = 'succeeded' and paid_at >= d and paid_at < d + interval '1 day'), 0) topups_kop
    from generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') d order by d`)
  const top = await q(`select product_name, count(*)::int n, sum(amount_kop) kop from orders where created_at > now() - interval '30 days' group by 1 order by 2 desc limit 8`)
  const lowKeys = await q(`select p.name, p.slug, count(k.*) filter (where k.status = 'free')::int free from products p left join product_keys k on k.product_id = p.id
                            where p.delivery = 'auto' and p.active group by p.id having count(k.*) filter (where k.status = 'free') < 5 order by 3`)
  return { ...s, days, top, low_keys: lowKeys }
})
