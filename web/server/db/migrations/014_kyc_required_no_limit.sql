-- верификация обязательна для любой покупки (проверка — в prepareOrder), лимита расходов больше нет
update settings set value = jsonb_build_object('unverified_kop', null, 'verified_kop', null) where key = 'spend_limits';
insert into settings (key, value) values ('spend_limits', '{"unverified_kop": null, "verified_kop": null}') on conflict (key) do nothing;
