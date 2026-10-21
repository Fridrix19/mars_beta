-- канал Max убран с сайта: в контактах остаются почта и Telegram
update settings set value = value - 'max' where key = 'contacts' and value ? 'max';
