-- бонус за верификацию выключен: верификация обязательна, отдельно не поощряется.
-- Уже начисленные бонусы не трогаем; включить снова — админка → Настройки → «Бонус за верификацию».
update settings set value = jsonb_set(value, '{kyc_kop}', '0') where key = 'bonus';
insert into settings (key, value) values ('bonus', '{"kyc_kop": 0}') on conflict (key) do nothing;
