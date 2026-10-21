-- контакты сайта: Telegram @marscapcard и почта help@marscap.ru.
-- Меняем только старые значения по умолчанию — то, что задали в админке, не трогаем.
update settings set value = jsonb_set(value, '{telegram}', '"marscapcard"') where key = 'contacts' and value->>'telegram' = 'marscap_support';
update settings set value = jsonb_set(value, '{email}', '"help@marscap.ru"') where key = 'contacts' and value->>'email' = 'support@marscap.ru';
insert into settings (key, value) values ('contacts', '{"email":"help@marscap.ru","telegram":"marscapcard","max":"marscap_support"}') on conflict (key) do nothing;
