/* Kotak "Ajukan sewa unit ini" di halaman detail unit.

   Di mockup kotak ini statis: input-nya ada tapi angkanya tetap. Di sini
   setiap kontrol menghitung ulang seketika — skema tarif, tanggal mulai,
   durasi, lokasi (jarak mobilisasi), jumlah unit, operator, dan shift.
   Semua angka berasal dari pricing.js, sama persis dengan halaman
   Simulasi biaya, jadi dua halaman tidak akan pernah berbeda hasil. */
(function () {
  'use strict';

  var P = window.Pricing;
  /* Harus sama persis dengan App\Support\Tanggal::BULAN_PENDEK. Kalau
     berbeda, tanggal yang sama tampil dua rupa: satu versi di layar saat
     mengisi, satu versi lagi di halaman konfirmasi. */
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function fmtTanggal(d) {
    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* Tunggu sampai data/content.json selesai dimuat, supaya tarif yang
   dipakai adalah tarif terbaru dari panel admin. */
  var boot = window.Content && window.Content.onReady
    ? window.Content.onReady
    : function (cb) { document.addEventListener('DOMContentLoaded', cb); };

  boot(function () {
    var box = document.getElementById('sewa-box');
    if (!box || !P) return;

    var unitKey = box.dataset.unit || 'pc200';
    var rate = P.RATES[unitKey] || P.RATES.pc200;

    var $ = function (id) { return document.getElementById(id); };
    var mulai = $('sb-mulai'), durSel = $('sb-dur'), lokasi = $('sb-lokasi'),
        qty = $('sb-qty'), op = $('sb-op'), shift = $('sb-shift'), cta = $('sb-cta');
    var rateRows = Array.prototype.slice.call(box.querySelectorAll('[data-mode]'));

    var mode = 'harian';

    /* — isi kontrol yang datanya dari pricing.js — */
    P.AREAS.forEach(function (a) {
      var o = document.createElement('option');
      o.value = a.value;
      o.textContent = a.label + ' · ' + a.km + ' km';
      lokasi.appendChild(o);
    });

    /* Tarif per skema untuk unit ini. */
    window.setLive($('sb-rate-harian'), P.rp(rate.h));
    window.setLive($('sb-rate-mingguan'), P.rp(rate.m));
    window.setLive($('sb-rate-bulanan'), P.rp(rate.b));
    var hemat = P.hematPersen(unitKey);
    var hematEl = $('sb-hemat');
    if (hematEl) {
      if (hemat) {
        window.setLive(hematEl, 'Hemat ' + hemat + '%');
        hematEl.hidden = false;
      } else {
        hematEl.hidden = true;
      }
    }

    function fillDurations() {
      var keep = durSel.value;
      durSel.innerHTML = '';
      P.DURATIONS[mode].forEach(function (pair) {
        var o = document.createElement('option');
        o.value = String(pair[0]);
        o.textContent = pair[1];
        durSel.appendChild(o);
      });
      durSel.value = P.DURATIONS[mode].some(function (p) { return String(p[0]) === keep; })
        ? keep
        : String(P.DEFAULT_DUR[mode]);
    }

    function state() {
      return {
        unit: unitKey,
        mode: mode,
        qty: Number(qty.value) || 1,
        dur: Number(durSel.value) || 1,
        km: P.kmForArea(lokasi.value),
        op: op.checked,
        shift2: shift.checked
      };
    }

    function render() {
      var v = P.estimate(state());

      window.setLive($('sb-l-sewa'), v.barisSewa);
      window.setLive($('sb-v-sewa'), v.sewaRp);
      window.setLive($('sb-l-op'), v.barisOperator);
      window.setLive($('sb-v-op'), v.operatorRp);
      window.setLive($('sb-l-shift'), v.barisShift);
      window.setLive($('sb-v-shift'), v.shiftRp);
      window.setLive($('sb-l-mob'), v.barisMobilisasi);
      window.setLive($('sb-v-mob'), v.mobilisasiRp);
      window.setLive($('sb-l-ppn'), v.labelPpn);
      window.setLive($('sb-v-ppn'), v.ppnRp);
      window.setLive($('sb-l-operator'), v.labelOperator);
      window.setLive($('sb-v-total'), v.totalRp);
      window.setLive($('sb-perhari'), v.perHariRp);

      rateRows.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
      });

      /* Rentang tanggal dihitung dari tanggal mulai + jumlah hari kerja. */
      var periode = $('sb-periode');
      if (periode && mulai.value) {
        var start = new Date(mulai.value + 'T00:00:00');
        if (!isNaN(start)) {
          var end = new Date(start.getTime());
          end.setDate(end.getDate() + v.hari - 1);
          window.setLive(periode, fmtTanggal(start) + ' – ' + fmtTanggal(end) +
            ' · ' + v.hari + ' hari kerja');
        }
      }

      if (cta) {
        var q = P.toQuery(v);
        if (mulai.value) q += '&mulai=' + encodeURIComponent(mulai.value);
        cta.setAttribute('href', (window.AJUKAN_URL || 'ajukan-sewa.html') + '?' + q);
      }
    }

    rateRows.forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.dataset.mode;
        fillDurations();
        render();
      });
    });

    [mulai, durSel, lokasi, qty, op, shift].forEach(function (c) {
      c.addEventListener('input', render);
      c.addEventListener('change', render);
    });

    /* Jumlah unit dijaga di rentang wajar tanpa mengagetkan saat mengetik. */
    qty.addEventListener('blur', function () {
      var n = Number(qty.value);
      if (!isFinite(n) || n < 1) qty.value = '1';
      else if (n > 20) qty.value = '20';
      render();
    });

    fillDurations();
    render();
  });
})();
