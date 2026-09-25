(function(){
  var MC = window.MC, $ = MC.$;
  var EX = [10, 20, 45, 60, 100, 200];
  function money(v){ return '$' + (v % 1 ? v.toFixed(2) : String(v)); }
  function rows(rate){
    $('tfRate').textContent = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(rate) + ' ₽';
    $('tfRows').innerHTML = EX.map(function(u){ var c = MC.charged(u); return '<tr><td>' + money(u) + '</td><td class="num">' + money(c) + '</td><td class="num"><b>' + MC.rub(c * rate) + '</b></td></tr>'; }).join('');
  }
  rows(MC.RATE);
  MC.vcPricing().then(function(v){
    if (!v || v.unavailable) return;
    rows(v.rate);
    $('tfCard').textContent = '$' + v.min + '–' + v.max;
    $('tfCardRow').textContent = 'номинал $' + v.min + '–' + v.max + ' + комиссия';
  });
  MC.site().then(function(s){ var d = s && (s.documents || []).filter(function(x){ return x.kind === 'tariffs'; })[0]; if (d) $('tfVer').textContent = d.version + ' от ' + new Date(d.published_at).toLocaleDateString('ru-RU'); });
  MC.initReveal();
})();
