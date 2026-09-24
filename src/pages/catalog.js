(function(){
  var MC = window.MC, $ = MC.$, CAT = MC.CATALOG;
  var META = /*__CATALOG_META__*/;
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var dirs = $('catDirs');

  /* — карта — */
  var vc = document.createElement('a'); vc.className = 'card card-link cat-card cat-vc'; vc.href = 'virtual-card.html';
  vc.innerHTML = '<div class="cat-head"><span class="cat-ico cat-ico-vc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg></span><h3>Виртуальная карта</h3><span class="cat-count">от $50 до $200</span></div><p>Долларовая карта для любого сервиса. Выпуск за 15 минут, пополнение тем же способом.</p><div class="cat-tags"><span class="badge badge-plain">USD</span><span class="badge badge-plain">СБП</span><span class="badge badge-plain">многоразовая</span></div><span class="arrow-link">Выпустить' + ARROW + '</span>';
  dirs.appendChild(vc);

  /* — направления: описание, популярные логотипы, минимальная цена — */
  CAT.categories.forEach(function(c){
    var m = META.cats[c.id] || { text: '', top: [], from: null };
    var logos = m.top.map(function(n){ var s = CAT.services.find(function(x){ return x.n === n; }); return s ? '<img alt="' + s.n + '" title="' + s.n + '"' + (s.d ? ' class="on-dark"' : '') + ' src="' + s.l + '">' : ''; }).join('');
    var rest = c.count - m.top.length;
    var a = document.createElement('a'); a.className = 'card card-link cat-card'; a.href = 'section/' + c.id + '/index.html';
    a.innerHTML = '<div class="cat-head"><span class="cat-ico"><img alt="" src="' + c.icon + '"></span><h3>' + c.name + '</h3><span class="cat-count">' + c.count + ' ' + MC.plural(c.count, ['сервис','сервиса','сервисов']) + '</span></div><p>' + m.text + '</p><div class="cat-logos">' + logos + (rest > 0 ? '<span class="more">+' + rest + '</span>' : '') + '</div>' + (m.from ? '<span class="cat-from" data-price-cat="' + c.id + '">от <b>$' + m.from + '</b>' + (m.monthly ? ' в месяц' : '') + '</span>' : '') + '<span class="arrow-link">Открыть раздел' + ARROW + '</span>';
    dirs.appendChild(a);
  });

  MC.initShowcase({ page: 24 });
  MC.initReveal();
})();
