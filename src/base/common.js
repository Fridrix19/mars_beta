window.MC = (function(){
  var CATALOG = /*__CATALOG__*/;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nf = new Intl.NumberFormat('ru-RU', {maximumFractionDigits:0});
  var $ = function(id){ return document.getElementById(id); };
  function usd(v){ return '$' + v.toFixed(2); }
  function rub(v){ return nf.format(Math.round(v)) + ' ₽'; }
  function plural(n, f){ n = Math.abs(n) % 100; var d = n % 10; return (n > 10 && n < 20) ? f[2] : (d > 1 && d < 5) ? f[1] : (d === 1) ? f[0] : f[2]; }
  /* формула сайта (payment-flow.v2.js → computeChargedUsd): до $45 — (сумма + $5) × 1.2, выше — сумма × 1.3 */
  function charged(u){ var b = Number(u) || 20; return Math.round((b <= 45 ? (b + 5) * 1.2 : b * 1.3) * 100) / 100; }
  function bump(el){ if (reduce || !el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  /* — витрина сервисов: категории + поиск, плитки ведут на страницы сервисов — */
  function initShowcase(opts){
    opts = opts || {};
    if (!$('cats')) return;
  var cats = $('cats'), tiles = $('tiles'), more = $('tilesMore'), q = $('svcSearch');
  var activeCat = 'all', query = '', shown = 0, PAGE = opts.page || 20;
  var CATS = [{ id:'all', name:'Все', icon:CATALOG.allIcon, count:CATALOG.services.length }].concat(CATALOG.categories);
  CATS.forEach(function(c, i){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cat'; b.setAttribute('role','tab');
    b.id = 'cat-' + c.id; b.setAttribute('aria-selected', i === 0 ? 'true':'false'); b.tabIndex = i === 0 ? 0 : -1;
    b.innerHTML = '<img alt="" src="' + c.icon + '"><span>' + c.name + '</span><span class="n">' + c.count + '</span>';
    b.addEventListener('click', function(){ selectCat(i, true); });
    b.addEventListener('keydown', function(e){
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? CATS.length - 1 : null;
      if (n === null) return; e.preventDefault();
      n = (n + CATS.length) % CATS.length; selectCat(n, true); cats.children[n].focus();
    });
    cats.appendChild(b);
  });
  function selectCat(i, user){
    activeCat = CATS[i].id;
    [].forEach.call(cats.children, function(b, k){ b.setAttribute('aria-selected', k === i ? 'true':'false'); b.tabIndex = k === i ? 0 : -1; });
    if (user) cats.children[i].scrollIntoView({block:'nearest', inline:'nearest', behavior: reduce ? 'auto' : 'smooth'});
    shown = 0; renderTiles(true);
  }
  function matches(s){
    return (activeCat === 'all' || s.c === activeCat) && (!query || s.n.toLowerCase().indexOf(query) !== -1);
  }
  function renderTiles(swap){
    var list = CATALOG.services.filter(matches);
    var next = Math.min(list.length, shown + PAGE);
    tiles.innerHTML = '';
    if (swap) { tiles.classList.remove('swap'); void tiles.offsetWidth; tiles.classList.add('swap'); }
    if (!list.length) {
      var e = document.createElement('div'); e.className = 'tiles-empty';
      e.innerHTML = '<b>Ничего не найдено по «' + query.replace(/</g,'&lt;') + '»</b>Проверьте написание или <button type="button" id="resetSearch">сбросьте поиск</button>';
      tiles.appendChild(e);
      e.querySelector('#resetSearch').addEventListener('click', function(){ q.value = ''; query = ''; shown = 0; renderTiles(true); q.focus(); });
    }
    list.slice(0, next).forEach(function(s){
      var t = document.createElement('a');
      t.className = 'tile tile-link' + (opts.current === s.h ? ' is-current' : ''); t.href = (opts.base || window.MC_BASE || '') + s.h; t.setAttribute('role','listitem');
      if (opts.current === s.h) t.setAttribute('aria-current','page');
      var sub = opts.sub ? opts.sub(s) : null;
      t.innerHTML = '<img alt="" class="' + (s.d ? 'on-dark' : '') + '" src="' + s.l + '"><span class="t"><b>' + s.n + '</b>' + (sub ? '<span>' + sub + '</span>' : '<span class="cat-name">' + CATALOG.catName[s.c] + '</span>') + '</span>';
      tiles.appendChild(t);
    });
    shown = next;
    $('tilesCount').textContent = list.length ? (query ? 'Найдено ' + list.length : 'Показано ' + shown + ' из ' + list.length) : '';
    more.hidden = shown >= list.length;
    more.textContent = 'Показать ещё ' + Math.min(PAGE, list.length - shown);
  }
  more.addEventListener('click', function(){ renderTiles(false); });
  var qt = null;
  q.addEventListener('input', function(){
    clearTimeout(qt);
    qt = setTimeout(function(){ query = q.value.trim().toLowerCase(); shown = 0; renderTiles(true); }, 120);
  });
  var start = Math.max(0, CATS.findIndex(function(c){ return c.id === (opts.cat || 'all'); }));
  selectCat(start, false);
  }

  /* — появление панелей и линии таймлайна — */
  function initReveal(){
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
    var io2 = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in-view'); io2.unobserve(e.target); } }); }, {threshold:.35});
    if ($('timeline')) io2.observe($('timeline'));
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    if ($('timeline')) $('timeline').classList.add('in-view');
  }

  }

  /* — тема: тёмная по умолчанию, выбор запоминается в браузере; переключателей может быть несколько (шапка, мобильный лист) — */
  function setTheme(next){
    var root = document.documentElement;
    // на время смены темы гасим все transition, иначе страница «размазывается»
    var kill = document.createElement('style'); kill.textContent = '*,*::before,*::after{transition:none!important}';
    document.head.appendChild(kill); void document.body.offsetHeight;
    root.setAttribute('data-mc-theme', next); root.classList.toggle('mc-dark', next !== 'light');
    try { localStorage.setItem('mc-theme', next); } catch (e) {}
    syncTheme();
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ kill.remove(); }); });
  }
  function syncTheme(){
    var light = document.documentElement.getAttribute('data-mc-theme') === 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(function(btn){
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Включить светлую тему');
    });
    var sw = $('sheetTheme'); if (sw) sw.checked = light;
  }
  function initTheme(){
    var btns = document.querySelectorAll('[data-theme-toggle]'); if (!btns.length) return;
    btns.forEach(function(btn){ btn.addEventListener('click', function(){ setTheme(document.documentElement.getAttribute('data-mc-theme') === 'light' ? 'dark' : 'light'); }); });
    var sw = $('sheetTheme'); if (sw) sw.addEventListener('change', function(){ setTheme(sw.checked ? 'light' : 'dark'); });
    if (document.readyState === 'complete') syncTheme(); else window.addEventListener('load', function(){ setTimeout(syncTheme, 0); }, { once: true });
  }

  /* — мобильный нижний бар: лист «Ещё» — */
  function initTabbar(){
    var more = $('tabMore'), wrap = $('moreSheet'); if (!more || !wrap) return;
    var lastFocus = null;
    function open(){ lastFocus = document.activeElement; wrap.hidden = false; more.setAttribute('aria-expanded', 'true'); document.body.classList.add('sheet-open'); requestAnimationFrame(function(){ wrap.classList.add('in'); var f = wrap.querySelector('.sheet a, .sheet button'); if (f) f.focus(); }); }
    function close(){ wrap.classList.remove('in'); more.setAttribute('aria-expanded', 'false'); document.body.classList.remove('sheet-open'); setTimeout(function(){ wrap.hidden = true; if (lastFocus) lastFocus.focus(); }, reduce ? 0 : 260); }
    more.addEventListener('click', function(){ wrap.hidden ? open() : close(); });
    wrap.querySelectorAll('[data-sheet-close]').forEach(function(el){ el.addEventListener('click', close); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !wrap.hidden) close(); });
    wrap.querySelectorAll('.sheet a').forEach(function(a){ a.addEventListener('click', close); });
  }
  initTabbar();

  /* — мобильная плашка оплаты: зеркалит итог расчёта, показывается пока итог не виден — */
  function initPaybar(){
    var bar = $('paybar'), total = $('rowTotal'), pay = $('pay'), calc = document.querySelector('.calc'), cfg = document.querySelector('.config');
    if (!bar || !total || !pay || !calc || !cfg || !('IntersectionObserver' in window)) return;
    var label = document.querySelector('[data-pb-label]'), cfgIn = false, totIn = false;
    function mirror(){
      $('pbTotal').textContent = total.textContent;
      if (label) $('pbLabel').textContent = label.textContent;
      $('pbPay').textContent = /^Запросить/.test(pay.textContent) ? 'Запросить' : 'Оплатить';
    }
    function sync(){ bar.hidden = !(cfgIn && !totIn && window.innerWidth <= 760); }
    new MutationObserver(mirror).observe(total, { childList: true, characterData: true, subtree: true });
    if (label) new MutationObserver(mirror).observe(label, { childList: true, characterData: true, subtree: true });
    new IntersectionObserver(function(es){ es.forEach(function(e){ cfgIn = e.isIntersecting; }); sync(); }, { rootMargin: '-25% 0px -10% 0px' }).observe(cfg);
    new IntersectionObserver(function(es){ es.forEach(function(e){ totIn = e.isIntersecting; }); sync(); }, { threshold: 0.6 }).observe(calc.querySelector('.calc-total') || calc);
    window.addEventListener('resize', sync);
    $('pbPay').addEventListener('click', function(){ calc.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); setTimeout(function(){ pay.click(); }, reduce ? 0 : 450); });
    mirror();
  }

  /* — API бэкенда. На статике (Vercel, артефакт, file://) /api нет — страницы работают в демо-режиме — */
  var API = window.MC_API || '/api', liveP = null;
  function isLive(){
    if (!liveP) liveP = (location.protocol === 'file:' || !window.fetch) ? Promise.resolve(false)
      : fetch(API + '/health', { credentials: 'same-origin' }).then(function(r){ return r.ok ? r.json() : null; })
          .then(function(j){ return !!(j && j.ok); }).catch(function(){ return false; });
    return liveP;
  }
  function api(method, path, body){
    return fetch(API + path, { method: method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function(r){
        return r.json().catch(function(){ return {}; }).then(function(j){
          if (r.ok) return j;
          var d = j.data || {}, e = new Error(r.status >= 500 ? 'Что-то пошло не так. Попробуйте ещё раз.' : (j.message || 'Ошибка запроса'));
          e.status = r.status; e.code = d.code || 'error'; e.data = d; throw e;
        });
      }, function(){ var e = new Error('Нет связи с сервером. Проверьте интернет.'); e.code = 'network'; throw e; });
  }
  function kop(v){ return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: v % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(v / 100) + ' ₽'; }
  function uid(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2); }

  initPaybar();
  initTheme();

  return { CATALOG: CATALOG, RATE: 80.2254, charged: charged, reduce: reduce, usd: usd, rub: rub, bump: bump, plural: plural, $: $, initShowcase: initShowcase, initReveal: initReveal, api: api, isLive: isLive, kop: kop, uid: uid };
})();
