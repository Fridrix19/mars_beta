(function(){
  var MC = window.MC, $ = MC.$, usd = MC.usd, rub = MC.rub;
  var SVC = /*__SERVICE__*/;
  var RATE = MC.RATE;
  /* формула с сайта (payment-flow.v2.js → computeChargedUsd): до $45 — (цена + $5) × 1.2, выше — цена × 1.3; 0 и пусто → базовые $20 */
  function quote(u){ return { base: u, usd: MC.charged(u) }; }
  /* форматы цен — те же функции, что на сайте (payment-flow.v2.js): короткая для карточек и расчёта, полная для деталей */
  var PF = window.MC_PRICE;
  function ru(t){ return String(t || '').replace(/^Free$/i,'Бесплатно').replace(/^Custom(?: pricing)?$/i,'По запросу').replace(/^Уточняется$/,'По запросу')
    .replace(/\bbilled monthly\b/gi,'ежемесячно').replace(/\bbilled yearly\b/gi,'при оплате за год').replace(/\bbilled\s+/gi,'').replace(/\btokens\b/gi,'токенов').replace(/\bcredits\b/gi,'кредитов').replace(/\s+at\s+/gi,' · ').replace(/\bper user\b/gi,'за пользователя').replace(/\bper seat\b/gi,'за место'); }
  function priceShort(p){ return ru(PF.monthly(p.priceText, p.usd)); }
  function priceFull(p){ return ru(PF.localize(p.priceText)); }
  var pay = $('pay'), status = $('status'), email = $('email'), emailHint = $('emailHint'), details = $('planDetails');
  var groups = $('planGroups'), current = null, buttons = [];

  SVC.groups.forEach(function(g){
    var wrap = document.createElement('div'); wrap.className = 'plan-group';
    if (SVC.groups.length > 1) { var h = document.createElement('h4'); h.textContent = g.name; wrap.appendChild(h); }
    var grid = document.createElement('div'); grid.className = 'plans'; grid.setAttribute('role','group'); grid.setAttribute('aria-label', g.name);
    g.plans.forEach(function(p){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'plan';
      var custom = typeof p.usd !== 'number';
      b.innerHTML = '<b>' + p.label + '</b><span class="price">' + priceShort(p) + '</span>' +
        (p.free ? '<span class="rub ask">бесплатно</span>' : custom ? '<span class="rub ask">по запросу</span>' : '<span class="rub">' + rub(quote(p.usd).usd * RATE) + '</span>');
      b.addEventListener('click', function(){ select(p, b); });
      grid.appendChild(b); buttons.push(b);
    });
    wrap.appendChild(grid); groups.appendChild(wrap);
  });

  function select(p, b){
    current = p;
    buttons.forEach(function(o){ o.setAttribute('aria-pressed', o === b ? 'true':'false'); });
    var feats = String(p.features || '').split('\n').map(function(s){ return s.replace(/^•\s*/,'').trim(); }).filter(Boolean);
    var shortP = priceShort(p), fullP = priceFull(p);
    details.innerHTML = '<h4>' + p.label + '</h4><span class="pd-price">' + shortP + '</span><p>' + (p.description || '') + '</p>' + (fullP && fullP !== shortP ? '<p class="pd-note">Условия: ' + fullP + '</p>' : '') +
      (feats.length ? '<ul>' + feats.map(function(f){ return '<li>' + f + '</li>'; }).join('') + '</ul>' : '');
    MC.bump(details);
    render();
  }

  function render(){
    var custom = typeof current.usd !== 'number';
    $('calcSub').textContent = SVC.name + ' · ' + current.label;
    $('rowPlan').textContent = priceShort(current);
    if (current.free) {
      $('rowComm').textContent = '—'; $('rowTotal').textContent = 'бесплатно';
      pay.textContent = 'Оплата не требуется'; pay.disabled = true; MC.bump($('rowTotal')); return;
    }
    pay.disabled = false;
    if (custom) {
      $('rowComm').textContent = '—'; $('rowTotal').textContent = 'по запросу';
      pay.textContent = 'Запросить расчёт'; MC.bump($('rowTotal')); return;
    }
    var q = quote(current.usd), totalRub = q.usd * RATE, subRub = (current.usd || 0) * RATE;
    $('rowComm').textContent = rub(totalRub - subRub);
    $('rowTotal').textContent = rub(totalRub);
    pay.textContent = 'Оплатить ' + rub(totalRub);
    MC.bump($('rowTotal'));
  }

  pay.addEventListener('click', function(){
    var v = email.value.trim(), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (!ok) {
      email.setAttribute('aria-invalid','true'); emailHint.className = 'hint err';
      emailHint.textContent = 'Укажите почту в виде mail@example.ru — на неё придут реквизиты.';
      status.className = 'calc-status bad'; status.textContent = 'Не удалось перейти к оплате: проверьте почту.';
      email.focus(); return;
    }
    email.removeAttribute('aria-invalid'); emailHint.className = 'hint';
    emailHint.textContent = 'Отправим номер карты, срок, CVC и инструкцию по привязке к ' + SVC.short + '.';
    status.className = 'calc-status ok';
    var demoText = typeof current.usd !== 'number' ? 'Прототип: заявка на индивидуальный расчёт уйдёт в поддержку.' : 'Прототип: здесь откроется окно СБП на ' + rub(quote(current.usd).usd * RATE) + '.';
    MC.isLive().then(function(on){
      if (!on || typeof current.usd !== 'number') { status.textContent = on ? 'Индивидуальный расчёт — напишите в поддержку, посчитаем под ваш тариф.' : demoText; return; }
      status.textContent = 'Переходим к оплате…'; pay.disabled = true;
      var slug = (SVC.href || '').replace(/^.*service\//, '').replace(/\/.*$/, '');
      MC.checkout({ slug: slug, plan: current.label, fields: { account_email: v }, title: SVC.name + ' · ' + current.label, back: location.pathname });
    });
  });

  // стартовый план — первый платный, чтобы расчёт сразу был содержательным
  var first = null;
  SVC.groups.some(function(g){ return g.plans.some(function(p, i){ if (typeof p.usd === 'number' && p.usd > 0) { first = p; return true; } return false; }); });
  first = first || SVC.groups[0].plans[0];
  var idx = 0; SVC.groups.forEach(function(g){ g.plans.forEach(function(p){ if (p === first) select(p, buttons[idx]); idx++; }); });

  MC.initShowcase({ cat: SVC.cat, current: SVC.href });
  MC.initReveal();
})();
