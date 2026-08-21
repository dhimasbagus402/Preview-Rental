/* Forms — validasi, pengiriman, dan ringkasan biaya yang hidup.

   BELUM ADA BACKEND. Form hanya benar-benar mengirim kalau <form> punya
   atribut data-endpoint. Tanpa itu penyewa mendapat pesan tegas bahwa
   permintaannya TIDAK terkirim, lengkap dengan nomor telepon dan WhatsApp.
   Ini disengaja — permintaan sewa yang ditelan diam-diam lebih buruk
   daripada tidak ada form sama sekali. Lihat README.md. */
(function () {
  'use strict';

  var WA = '6281234567890'; // placeholder — nomor karangan dari mockup
  /* Harus sama persis dengan App\Support\Tanggal::BULAN_PENDEK. Kalau
     berbeda, tanggal yang sama tampil dua rupa: satu versi di layar saat
     mengisi, satu versi lagi di halaman konfirmasi. */
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function fmtTanggal(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ── pengiriman form ─────────────────────────────────────────────────── */

  function statusBox(form) {
    var box = form.querySelector('.form-status');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-status';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      form.appendChild(box);
    }
    return box;
  }

  function say(form, html) {
    var box = statusBox(form);
    box.innerHTML = html;
    box.hidden = false;
    box.scrollIntoView({ block: 'nearest' });
  }

  function firstInvalid(form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll('[required]'));
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i].value.trim()) return fields[i];
    }
    return null;
  }

  function handle(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var bad = firstInvalid(form);
      if (bad) {
        bad.focus();
        var label = form.querySelector('label[for="' + bad.id + '"]');
        say(form, '<b>Lengkapi dulu:</b> ' + (label ? label.textContent : 'ada isian wajib yang kosong') + '.');
        return;
      }

      var endpoint = form.dataset.endpoint;
      if (!endpoint) {
        say(form,
          '<b>Formulir belum terhubung ke server.</b> Permintaan Anda <em>tidak</em> terkirim. ' +
          'Sementara ini hubungi kami langsung di ' +
          '<a href="tel:+' + WA + '">0812-3456-7890</a> atau ' +
          '<a href="https://wa.me/' + WA + '" rel="noopener">WhatsApp</a>.');
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      say(form, 'Mengirim…');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        say(form, '<b>Terkirim.</b> Tim kami menjawab pada hari kerja yang sama.');
      }).catch(function (err) {
        say(form,
          '<b>Gagal mengirim (' + err.message + ').</b> Silakan hubungi ' +
          '<a href="https://wa.me/' + WA + '" rel="noopener">WhatsApp 0812-3456-7890</a>.');
      }).then(function () {
        if (btn) btn.disabled = false;
      });
    });
  }

  /* ── ringkasan biaya yang hidup ──────────────────────────────────────────
     Unit, jumlah, jarak, dan operator dibawa dari halaman sebelumnya lewat
     query string. Lama sewa datang dari rentang tanggal di formulir ini,
     jadi begitu penyewa menggeser tanggal atau mengubah shift, seluruh
     rincian biaya langsung ikut berubah.                                  */
  function liveRecap() {
    var box = document.getElementById('recap-box');
    var P = window.Pricing;
    if (!box || !P) return;

    var mulai = document.getElementById('mulai');
    var selesai = document.getElementById('selesai');
    var shiftSel = document.getElementById('shift');
    if (!mulai || !selesai || !shiftSel) return;

    var opCheck = document.getElementById('operator');
    var areaSel = document.getElementById('area');
    var daftar = document.getElementById('alat-daftar');
    var contoh = document.getElementById('alat-contoh');
    var tambah = document.getElementById('alat-tambah');

    var base = P.fromQuery() || {
      unit: Object.keys(P.RATES)[0],
      mode: 'harian', qty: 2, dur: 7, km: 18, op: true, shift2: false
    };
    var q = new URLSearchParams(window.location.search);

    /* Tanggal selesai hanya ditebak kalau server memang belum menghitungnya
       (kunjungan langsung, tanpa estimasi dari halaman unit). */
    if (selesai.hasAttribute('data-auto') && q.get('unit')) {
      var awal = P.estimate(base);
      var s0 = new Date(mulai.value + 'T00:00:00');
      if (!isNaN(s0)) {
        var e0 = new Date(s0.getTime());
        e0.setDate(e0.getDate() + awal.hari - 1);
        selesai.value = e0.getFullYear() + '-' +
          String(e0.getMonth() + 1).padStart(2, '0') + '-' +
          String(e0.getDate()).padStart(2, '0');
      }
    }

    var set = function (id, text) { window.setLive(document.getElementById(id), text); };

    /* Selama penyewa belum menyentuh tanggal, hormati skema tarif yang sudah
       dipilih di halaman sebelumnya - kalau tidak, totalnya bisa berubah
       sendiri antar halaman dan itu membingungkan. Begitu tanggalnya diubah,
       barulah skema termurah dipakai, karena pilihan lama sudah tidak
       relevan dengan rentang yang baru. */
    var disentuh = false;
    var bawaSkema = q.get('unit') ? base.mode : null;

    /* ── baris alat ───────────────────────────────────────────────────────
       FORMULIR INI YANG MENENTUKAN, bukan query string. Nilai dari halaman
       sebelumnya sudah dipakai server untuk mengisi tiap kolom; di sini
       tinggal dibaca ulang setiap kali menghitung. */
    function barisAlat() {
      if (!daftar) {
        return [{ unit: base.unit, qty: base.qty }];
      }

      return Array.prototype.slice.call(daftar.querySelectorAll('.alat-baris'))
        .map(function (r) {
          var u = r.querySelector('[data-alat="unit"]');
          var n = r.querySelector('[data-alat="qty"]');
          return { unit: u && u.value, qty: n ? Number(n.value) : 1 };
        })
        .filter(function (r) { return r.unit; });
    }

    function kmTerpilih() {
      if (!areaSel || areaSel.selectedIndex < 0) return base.km;
      var pilihan = areaSel.options[areaSel.selectedIndex];
      var km = pilihan && pilihan.getAttribute('data-km');
      return km ? Number(km) : base.km;
    }

    /* Durasi mengikuti rentang tanggal, bukan angka lama dari query - server
       pun menghitungnya dari tanggal, jadi keduanya harus sepakat. */
    function durUntuk(mode, hari) {
      if (mode === 'mingguan') return Math.ceil(hari / 7);
      if (mode === 'bulanan') return Math.ceil(hari / 30);
      return hari;
    }

    function punyaTarif(unitKey, mode) {
      var r = P.RATES[unitKey];
      if (!r) return false;
      return mode === 'harian' ? !!r.h : mode === 'mingguan' ? !!r.m : !!r.b;
    }

    /* Skema per jenis alat, meniru sisi server: pilihan penyewa dipakai
       selama tarifnya memang ada, kalau tidak dipakai yang termurah. */
    function skemaUntuk(unitKey, hari) {
      if (!disentuh && bawaSkema && punyaTarif(unitKey, bawaSkema)) {
        return bawaSkema;
      }
      return P.bestScheme(unitKey, hari).mode;
    }

    function susun(hari, pemilihSkema) {
      return barisAlat().map(function (b) {
        var mode = pemilihSkema(b.unit, hari);
        return { unit: b.unit, qty: b.qty, mode: mode, dur: durUntuk(mode, hari) };
      });
    }

    function render() {
      var skemaTeks = document.getElementById('recap-skema');
      var hari = P.daysBetween(mulai.value, selesai.value);

      if (!hari) {
        window.setLive(skemaTeks, 'Tanggal selesai harus sama dengan atau setelah tanggal mulai.');
        return;
      }

      var items = susun(hari, skemaUntuk);

      if (!items.length) {
        window.setLive(skemaTeks, 'Pilih minimal satu jenis alat.');
        return;
      }

      var shared = {
        km: kmTerpilih(),
        op: opCheck ? opCheck.checked : base.op,
        shift2: /2 shift/.test(shiftSel.value),
        hariKerja: hari
      };

      var v = P.estimateMulti(items, shared);

      /* Skema tersimpan dikirim ke server lewat kolom tersembunyi. Kalau
         jenis alatnya lebih dari satu dan skemanya berbeda-beda, kolom itu
         dikosongkan supaya server memilih sendiri per jenis alat - lebih
         jujur daripada memaksakan satu skema untuk semuanya. */
      var pilihan = document.getElementById('skema-terpilih');
      if (pilihan) {
        var semuaSama = items.every(function (it) { return it.mode === items[0].mode; });
        pilihan.value = semuaSama ? items[0].mode : '';
      }

      var daftarAlat = document.getElementById('recap-alat');
      if (daftarAlat) {
        daftarAlat.innerHTML = '';
        v.baris.forEach(function (b) {
          var el = document.createElement('b');
          el.textContent = b.label;
          daftarAlat.appendChild(el);
        });
      }

      set('recap-detail', hari + ' hari \u00b7 ' + fmtTanggal(mulai.value) + ' \u2013 ' + fmtTanggal(selesai.value) +
        ' \u00b7 ' + (v.shift2 ? '2 shift' : '1 shift') + (v.op ? ' \u00b7 dengan operator' : ' \u00b7 tanpa operator'));
      set('recap-l-sewa', v.barisSewa);
      set('recap-sewa', v.sewaRp);
      set('recap-l-shift', v.barisShift);
      set('recap-shift', v.shiftRp);
      set('recap-l-op', v.barisOperator);
      set('recap-op', v.operatorRp);
      set('recap-l-mob', v.barisMobilisasi);
      set('recap-mob', v.mobilisasiRp);
      set('recap-subtotal', v.subtotalRp);
      set('recap-l-ppn', v.labelPpn);
      set('recap-ppn', v.ppnRp);
      set('recap-total', v.totalRp);

      /* Kalau ada skema lain yang lebih murah, katakan berapa hematnya -
         jangan diam-diam menggantinya. */
      var termurah = P.estimateMulti(
        susun(hari, function (u, h) { return P.bestScheme(u, h).mode; }),
        shared
      );
      var hemat = v.sewa - termurah.sewa;

      if (hemat > 0) {
        window.setLive(skemaTeks, 'Dihitung dengan tarif sesuai pilihan Anda. Untuk ' + hari +
          ' hari, kombinasi tarif termurah menghemat ' + P.rp(hemat) + '.');
      } else if (items.length > 1) {
        window.setLive(skemaTeks, 'Tiap jenis alat dihitung dengan tarif termurahnya untuk ' +
          hari + ' hari sewa.');
      } else {
        window.setLive(skemaTeks, 'Dihitung dengan tarif ' + items[0].mode +
          ' \u2014 paling murah untuk ' + hari + ' hari sewa.');
      }
    }

    /* ── menambah & menghapus baris alat ──────────────────────────────── */
    function segarkanBaris() {
      var baris = daftar.querySelectorAll('.alat-baris');

      baris.forEach(function (r, i) {
        var u = r.querySelector('[data-alat="unit"]');
        var n = r.querySelector('[data-alat="qty"]');
        if (u) u.setAttribute('aria-label', 'Jenis alat baris ' + (i + 1));
        if (n) n.setAttribute('aria-label', 'Jumlah unit baris ' + (i + 1));

        var hapus = r.querySelector('[data-alat-hapus]');
        // Satu baris terakhir tidak boleh dihapus: pengajuan tanpa alat
        // tidak ada artinya.
        if (hapus) hapus.disabled = baris.length < 2;
      });
    }

    if (daftar && contoh && tambah) {
      daftar.querySelectorAll('[data-alat-hapus]').forEach(function (b) { b.hidden = false; });
      tambah.hidden = false;

      tambah.addEventListener('click', function () {
        var b = contoh.content.firstElementChild.cloneNode(true);
        daftar.appendChild(b);
        segarkanBaris();
        render();

        var pilih = b.querySelector('select');
        if (pilih) pilih.focus();
      });

      daftar.addEventListener('click', function (e) {
        var tombol = e.target.closest('[data-alat-hapus]');
        if (!tombol || tombol.disabled) return;

        tombol.closest('.alat-baris').remove();
        segarkanBaris();
        render();
        tambah.focus();
      });

      daftar.addEventListener('input', render);
      daftar.addEventListener('change', render);
      segarkanBaris();
    }

    [mulai, selesai].forEach(function (c) {
      c.addEventListener('input', function () { disentuh = true; render(); });
      c.addEventListener('change', function () { disentuh = true; render(); });
    });
    shiftSel.addEventListener('change', render);
    [opCheck, areaSel].forEach(function (c) {
      if (!c) return;
      c.addEventListener('input', render);
      c.addEventListener('change', render);
    });

    render();
  }

  /* Tunggu sampai data/content.json selesai dimuat, supaya tarif yang
   dipakai adalah tarif terbaru dari panel admin. */
  var boot = window.Content && window.Content.onReady
    ? window.Content.onReady
    : function (cb) { document.addEventListener('DOMContentLoaded', cb); };

  boot(function () {
    document.querySelectorAll('form[data-form]').forEach(handle);
    liveRecap();
  });
})();
