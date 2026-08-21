/* Halaman Simulasi biaya — UI saja; semua angka berasal dari pricing.js. */
(function () {
  'use strict';

  var P = window.Pricing;

  /* Tunggu sampai data/content.json selesai dimuat, supaya tarif yang
   dipakai adalah tarif terbaru dari panel admin. */
  var boot = window.Content && window.Content.onReady
    ? window.Content.onReady
    : function (cb) { document.addEventListener('DOMContentLoaded', cb); };

  boot(function () {
    var root = document.getElementById('simulasi');
    if (!root || !P) return;

    var el = {};
    ['unitName', 'ringkasan', 'barisSewa', 'sewaRp', 'barisShift', 'shiftRp',
      'barisOperator', 'operatorRp', 'barisMobilisasi', 'mobilisasiRp',
      'ppnRp', 'totalRp', 'perHariRp', 'durasiLabel',
      'labelPpn', 'labelOperator'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

    var unit = document.getElementById('unit');
    var qty = document.getElementById('qty');
    var dur = document.getElementById('dur');
    var km = document.getElementById('km');
    var op = document.getElementById('op');
    var shift2 = document.getElementById('shift2');
    var cta = document.getElementById('ajukan-dengan-angka');
    var segs = Array.prototype.slice.call(root.querySelectorAll('.segbar button[data-mode]'));

    var mode = 'harian';

    function state() {
      return {
        unit: unit.value, mode: mode,
        qty: Number(qty.value), dur: Number(dur.value),
        km: Number(km.value), op: op.checked, shift2: shift2.checked
      };
    }

    function render() {
      var v = P.estimate(state());
      Object.keys(el).forEach(function (id) {
        if (el[id]) window.setLive(el[id], v[id]);
      });
      segs.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
      });
      if (cta) cta.setAttribute('href', (window.AJUKAN_URL || 'ajukan-sewa.html') + '?' + P.toQuery(v));
    }

    function fillDurations() {
      dur.innerHTML = '';
      P.DURATIONS[mode].forEach(function (pair) {
        var o = document.createElement('option');
        o.value = String(pair[0]);
        o.textContent = pair[1];
        dur.appendChild(o);
      });
      dur.value = String(P.DEFAULT_DUR[mode]);
    }

    segs.forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.dataset.mode;
        fillDurations();
        render();
      });
    });

    /* 'input' rather than 'change' so the panel tracks the control live. */
    [unit, qty, dur, km, op, shift2].forEach(function (c) {
      c.addEventListener('input', render);
      c.addEventListener('change', render);
    });

    fillDurations();
    render();
  });
})();
