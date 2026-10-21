-- чистые адреса страниц (без .html): /dashboard#order:…, /tariffs.
-- Старые адреса с .html продолжают работать — сервер переадресует их, — но в базе храним чистые.

update documents set url = regexp_replace(url, '^/([a-z0-9-]+)\.html', '/\1') where url ~ '^/[a-z0-9-]+\.html';
update notifications set link = regexp_replace(link, '^/([a-z0-9-]+)\.html', '/\1') where link ~ '^/[a-z0-9-]+\.html';

-- уведомления из SQL-функций (пополнение, возврат) тоже получают чистый адрес
create or replace function notifications_clean_link() returns trigger
language plpgsql as $$
begin
  if new.link is not null then new.link := regexp_replace(new.link, '^/([a-z0-9-]+)\.html', '/\1'); end if;
  return new;
end $$;
drop trigger if exists notifications_clean_link on notifications;
create trigger notifications_clean_link before insert or update of link on notifications
  for each row execute function notifications_clean_link();
