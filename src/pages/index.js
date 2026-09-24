(function(){
  var MC = window.MC, $ = MC.$, CAT = MC.CATALOG, reduce = MC.reduce;
  var HOME = /*__HOME__*/;
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* — категории: иконки и счётчики из каталога, описания из HOME — */
  var cats = $('homeCats');
  var vc = document.createElement('a'); vc.className = 'card card-link cat-card cat-vc'; vc.href = 'virtual-card.html';
  vc.innerHTML = '<div class="cat-head"><span class="cat-ico cat-ico-vc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg></span><h3>Виртуальная карта</h3><span class="cat-count">от $5</span></div><p>Долларовая карта для любого сервиса. Выпуск за 15 минут.</p><div class="cat-tags"><span class="badge badge-plain">USD</span><span class="badge badge-plain">СБП</span></div><span class="arrow-link">Выпустить' + ARROW + '</span>';
  cats.appendChild(vc);
  CAT.categories.forEach(function(c){
    var m = HOME.cats[c.id] || { text: '', tags: [] };
    var a = document.createElement('a'); a.className = 'card card-link cat-card'; a.href = 'section/' + c.id + '/index.html';
    a.innerHTML = '<div class="cat-head"><span class="cat-ico"><img alt="" src="' + c.icon + '"></span><h3>' + c.name + '</h3><span class="cat-count">' + c.count + '</span></div><p>' + m.text + '</p><div class="cat-tags">' + m.tags.map(function(t){ return '<span class="badge badge-plain">' + t + '</span>'; }).join('') + '</div><span class="arrow-link">Открыть раздел' + ARROW + '</span>';
    cats.appendChild(a);
  });

  /* — популярные сервисы — */
  var pop = $('homePopular');
  HOME.popular.forEach(function(p){
    var s = CAT.services.find(function(x){ return x.n === p.n; }); if (!s) return;
    var art = document.createElement('article'); art.className = 'card svc-card';
    art.innerHTML = '<div class="svc-head"><img class="svc-logo-sm' + (s.d ? ' on-dark' : '') + '" alt="" src="' + s.l + '"><span class="badge badge-plain">' + CAT.catName[s.c] + '</span></div><h3>' + s.n + '</h3><p>' + p.text + '</p><span class="svc-price" data-price-slug="' + MC.slugOf(s.h) + '">' + p.price + '</span><div class="card-foot"><a class="btn btn-ghost btn-sm" href="' + s.h + '">Оплатить</a></div>';
    pop.appendChild(art);
  });

  /* — карта: наклон за курсором — */
  var stage = $('cardStage'), tilt = $('cardTilt');
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    stage.addEventListener('pointermove', function(e){
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.setProperty('--ty', (x * 26).toFixed(1)); tilt.style.setProperty('--tx', (-8 - y * 22).toFixed(1));
    });
    stage.addEventListener('pointerleave', function(){ tilt.style.removeProperty('--ty'); tilt.style.removeProperty('--tx'); });
  }
  MC.initReveal();
})();
