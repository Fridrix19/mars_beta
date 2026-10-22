-- верификация: кроме фото документа — ФИО, вид документа и контакт (телефон и/или почта).
-- Без одобренной верификации выпуск виртуальной карты закрыт (проверка — в prepareOrder).
alter table kyc_submissions add column if not exists full_name text;
alter table kyc_submissions add column if not exists doc_type text check (doc_type in ('passport_ru', 'passport_foreign', 'other'));
alter table kyc_submissions add column if not exists contact_phone text;
alter table kyc_submissions add column if not exists contact_email text;
