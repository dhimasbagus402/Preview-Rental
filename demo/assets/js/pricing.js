/* Mesin perhitungan biaya sewa — dipakai bersama oleh:
     - simulasi-biaya.html   (Simulasi biaya)
     - unit-*.html           (kotak "Ajukan sewa unit ini")
     - ajukan-sewa.html      (ringkasan sewa)

   Satu sumber angka supaya ketiga halaman tidak pernah berbeda hasil.
   Rumus dan susunan kalimat diambil persis dari design document.

   TARIF DI BAWAH INI MASIH KARANGAN dari mockup. Ganti dengan tarif asli
   sebelum dipakai ke pelanggan — lihat README.md. */
window.Pricing = (function () {
  'use strict';

  var RATES = {
    pc200:    { name: 'Excavator Komatsu PC200-8',         kat: 'excavator',   h: 8500000,  m: 51000000, b: 175000000 },
    u35:      { name: 'Excavator Mini Kubota U-35',        kat: 'excavator',   h: 2900000,  m: 17400000, b: 62000000 },
    d65:      { name: 'Bulldozer Komatsu D65E-12',         kat: 'bulldozer',   h: 12500000, m: 75000000, b: 260000000 },
    nk250:    { name: 'Mobile Crane Kato NK-250',          kat: 'crane',       h: 9800000,  m: 58800000, b: 205000000 },
    forklift: { name: 'Forklift Toyota 3 Ton Diesel',      kat: 'forklift',    h: 1450000,  m: 8700000,  b: 29000000 },
    scaff:    { name: 'Scaffolding frame 1,7 m (100 set)', kat: 'scaffolding', h: 1200000,  m: 6500000,  b: 18000000 },
    breaker:  { name: 'Attachment Breaker Soosan SB81',    kat: 'attachment',  h: 2800000,  m: 16800000, b: 56000000 }
  };

  var OPERATOR_PER_DAY = 450000;   // per operator, per hari kerja, per unit
  var MOB_BASE = 950000;           // dasar sekali jalan untuk 30 km pertama
  var MOB_PER_KM = 25000;          // per km di atas 30
  var PPN = 0.11;
  var SHIFT2_SURCHARGE = 0.30;
  var MIN_HARI = 3;                // "Harian (min. 3 hari)"
  var MOB_KM_GRATIS = 30;          // km pertama sudah masuk tarif dasar

  /* Titik lokasi proyek → jarak mobilisasi dari pool terdekat. */
  var AREAS = [
    { value: 'lamongan',  label: 'Brondong, Lamongan',    km: 18 },
    { value: 'lamongan2', label: 'Lamongan kota',         km: 28 },
    { value: 'gresik',    label: 'Gresik',                km: 45 },
    { value: 'tuban',     label: 'Tuban',                 km: 90 },
    { value: 'surabaya',  label: 'Surabaya',              km: 90 },
    { value: 'luar',      label: 'Luar area — nego',      km: 160 }
  ];

  /* Pilihan durasi mengikuti skema sewa. Mockup memakai 3/7/14/30 untuk
     ketiga skema, yang terbaca "30 bulan" pada skema Bulanan. */
  var DURATIONS = {
    harian:   [[3, '3 hari'], [7, '7 hari'], [14, '14 hari'], [30, '30 hari']],
    mingguan: [[1, '1 minggu'], [2, '2 minggu'], [3, '3 minggu'], [4, '4 minggu']],
    bulanan:  [[1, '1 bulan'], [2, '2 bulan'], [3, '3 bulan'], [6, '6 bulan']]
  };
  var DEFAULT_DUR = { harian: 7, mingguan: 3, bulanan: 3 };

  /* Ditimpa oleh content.js begitu data/content.json selesai dimuat.
     Nilai di atas tetap jadi cadangan kalau berkasnya tidak terbaca. */
  function configure(c) {
    if (!c) return;
    if (Array.isArray(c.unit) && c.unit.length) {
      var baru = {};
      c.unit.forEach(function (u) {
        if (!u || !u.key || !u.tarif) return;
        baru[u.key] = {
          name: u.nama, kat: u.kategori,
          h: Number(u.tarif.h), m: Number(u.tarif.m), b: Number(u.tarif.b),
          hemat: u.hemat === null || u.hemat === undefined ? null : Number(u.hemat)
        };
      });
      if (Object.keys(baru).length) RATES = baru;
    }
    if (Array.isArray(c.area) && c.area.length) AREAS = c.area;
    var b = c.biaya || {};
    if (isFinite(b.operatorPerHari))   OPERATOR_PER_DAY = Number(b.operatorPerHari);
    if (isFinite(b.mobilisasiDasar))   MOB_BASE = Number(b.mobilisasiDasar);
    if (isFinite(b.mobilisasiPerKm))   MOB_PER_KM = Number(b.mobilisasiPerKm);
    if (isFinite(b.mobilisasiKmGratis)) MOB_KM_GRATIS = Number(b.mobilisasiKmGratis);
    if (isFinite(b.ppn))               PPN = Number(b.ppn);
    if (isFinite(b.shift2))            SHIFT2_SURCHARGE = Number(b.shift2);
    if (isFinite(b.minHariHarian))     MIN_HARI = Number(b.minHariHarian);
    document.dispatchEvent(new CustomEvent('pricing:configured'));
  }

  /* Tarif untuk satu kunci; kalau tidak ketemu, pakai entri pertama yang ada.
     Sebelumnya jatuh ke 'pc200' - itu pecah begitu kunci datang dari
     database dan bukan lagi nama tetap. */
  function rateFor(key) {
    return RATES[key] || RATES[Object.keys(RATES)[0]];
  }

  function rp(n) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  }

  function kmForArea(value) {
    for (var i = 0; i < AREAS.length; i++) {
      if (AREAS[i].value === value) return AREAS[i].km;
    }
    return 18;
  }

  /* Skema paling murah untuk sejumlah hari tertentu — dipakai kotak sewa
     untuk menandai "Hemat xx%" pada baris tarif. */
  /* Nilai "Hemat" ditentukan server: bisa diatur manual admin, dihitung
     otomatis, atau dimatikan sama sekali. null berarti label disembunyikan. */
  function hematPersen(unitKey) {
    var r = rateFor(unitKey);

    if (r && Object.prototype.hasOwnProperty.call(r, 'hemat')) {
      return r.hemat;
    }

    // Cadangan untuk halaman yang belum mengirim nilai dari server.
    var harianSebulan = r.h * 30;
    if (!harianSebulan || !r.b) return null;
    var persen = Math.round((1 - r.b / harianSebulan) * 100);

    return persen > 0 ? persen : null;
  }

  /* Murni: menerima state, mengembalikan angka + setiap kalimat yang tampil. */
  function estimate(s) {
    var r = rateFor(s.unit);
    var mode = s.mode || 'harian';
    var qty = Math.max(1, Number(s.qty) || 1);
    var dur = Math.max(1, Number(s.dur) || 1);
    var km = Number(s.km);
    if (!isFinite(km)) km = 18;
    var op = s.op !== false;
    var shift2 = s.shift2 === true;

    if (mode === 'harian' && dur < MIN_HARI) dur = MIN_HARI;

    var base = mode === 'harian' ? r.h : mode === 'mingguan' ? r.m : r.b;
    var hari = mode === 'harian' ? dur : mode === 'mingguan' ? dur * 7 : dur * 30;
    var satuan = mode === 'harian' ? 'hari' : mode === 'mingguan' ? 'minggu' : 'bulan';

    /* Kalau pemanggil tahu jumlah hari kerja sebenarnya (halaman pengajuan
       menghitungnya dari rentang tanggal), pakai angka itu untuk biaya
       operator. Menyewa 25 hari dengan tarif bulanan tidak boleh menagih
       operator 30 hari. */
    if (isFinite(Number(s.hariKerja)) && Number(s.hariKerja) > 0) {
      hari = Number(s.hariKerja);
    }

    var sewa = base * dur * qty;
    var shiftFee = shift2 ? sewa * SHIFT2_SURCHARGE : 0;
    var opFee = op ? OPERATOR_PER_DAY * hari * qty : 0;
    var mob = (MOB_BASE + Math.max(0, km - MOB_KM_GRATIS) * MOB_PER_KM) * 2 * (qty > 2 ? 2 : 1);
    var sub = sewa + shiftFee + opFee + mob;
    var ppn = sub * PPN;
    var total = sub + ppn;

    return {
      /* angka mentah */
      qty: qty, dur: dur, km: km, mode: mode, unit: s.unit,
      op: op, shift2: shift2,
      hari: hari, satuan: satuan,
      sewa: sewa, shiftFee: shiftFee, opFee: opFee,
      mob: mob, subtotal: sub, ppn: ppn, total: total,

      /* kalimat siap tampil */
      unitName: r.name,
      durasiLabel: 'Durasi (' + satuan + ')',
      ringkasan: qty + ' unit · ' + dur + ' ' + satuan + ' (' + hari + ' hari kerja) · ' +
        (shift2 ? '2 shift' : '1 shift') + (op ? ' · dengan operator' : ' · tanpa operator'),
      barisSewa: 'Sewa unit — ' + qty + ' × ' + dur + ' ' + satuan,
      sewaRp: rp(sewa),
      barisShift: shift2 ? 'Tambahan 2 shift (+' + Math.round(SHIFT2_SURCHARGE * 100) + '%)' : 'Tambahan shift',
      shiftRp: shift2 ? rp(shiftFee) : '—',
      barisOperator: op ? 'Operator — ' + hari + ' hari × ' + qty : 'Operator (tidak diambil)',
      operatorRp: op ? rp(opFee) : '—',
      barisMobilisasi: 'Mobilisasi & demobilisasi ' + km + ' km',
      mobilisasiRp: rp(mob),
      subtotalRp: rp(sub),
      labelPpn: 'PPN ' + (Math.round(PPN * 1000) / 10) + '%',
      labelOperator: 'Termasuk operator (' + rp(OPERATOR_PER_DAY) + '/hari/unit)',
      ppnRp: rp(ppn),
      totalRp: rp(total),
      perHariRp: '≈ ' + rp(total / hari) + ' per hari kerja'
    };
  }

  /*
   * Estimasi untuk beberapa jenis alat sekaligus.
   *
   * Satu proyek jarang butuh satu jenis alat saja. Yang dijumlahkan hanya
   * biaya sewanya; operator, mobilisasi, shift, dan PPN tetap dihitung sekali
   * atas TOTAL unit — persis seperti yang dilakukan server, supaya angka di
   * layar sama dengan angka yang tersimpan.
   *
   * items:  [{unit, mode, dur, qty}]
   * shared: {km, op, shift2, hariKerja}
   */
  function estimateMulti(items, shared) {
    shared = shared || {};

    var km = Number(shared.km);
    if (!isFinite(km)) km = 18;
    var op = shared.op !== false;
    var shift2 = shared.shift2 === true;
    var hari = Math.max(1, Number(shared.hariKerja) || 1);

    var sewa = 0, totalQty = 0, baris = [];

    (items || []).forEach(function (it) {
      var r = rateFor(it.unit);
      var mode = it.mode || 'harian';
      var qty = Math.max(1, Number(it.qty) || 1);
      var dur = Math.max(1, Number(it.dur) || 1);

      if (mode === 'harian' && dur < MIN_HARI) dur = MIN_HARI;

      var tarif = mode === 'harian' ? r.h : mode === 'mingguan' ? r.m : r.b;
      var satuan = mode === 'harian' ? 'hari' : mode === 'mingguan' ? 'minggu' : 'bulan';
      var jumlah = tarif * dur * qty;

      sewa += jumlah;
      totalQty += qty;

      baris.push({
        unit: it.unit, nama: r.name, qty: qty, mode: mode, dur: dur, satuan: satuan,
        jumlah: jumlah,
        label: qty + ' × ' + r.name,
        detail: dur + ' ' + satuan + ' · tarif ' + mode,
        rp: rp(jumlah)
      });
    });

    var shiftFee = shift2 ? sewa * SHIFT2_SURCHARGE : 0;
    var opFee = op ? OPERATOR_PER_DAY * hari * totalQty : 0;
    var mob = (MOB_BASE + Math.max(0, km - MOB_KM_GRATIS) * MOB_PER_KM) * 2 * (totalQty > 2 ? 2 : 1);
    var sub = sewa + shiftFee + opFee + mob;
    var ppn = sub * PPN;

    return {
      baris: baris, qty: totalQty, hari: hari, km: km, op: op, shift2: shift2,
      sewa: sewa, shiftFee: shiftFee, opFee: opFee, mob: mob,
      subtotal: sub, ppn: ppn, total: sub + ppn,

      barisSewa: baris.length > 1
        ? 'Sewa alat — ' + baris.length + ' jenis, ' + totalQty + ' unit'
        : 'Sewa unit — ' + totalQty + ' × ' + (baris[0] ? baris[0].dur + ' ' + baris[0].satuan : ''),
      sewaRp: rp(sewa),
      barisShift: shift2 ? 'Tambahan 2 shift (+' + Math.round(SHIFT2_SURCHARGE * 100) + '%)' : 'Tambahan shift',
      shiftRp: shift2 ? rp(shiftFee) : '—',
      barisOperator: op ? 'Operator — ' + hari + ' hari × ' + totalQty : 'Operator (tidak diambil)',
      operatorRp: op ? rp(opFee) : '—',
      barisMobilisasi: 'Mobilisasi & demobilisasi ' + km + ' km',
      mobilisasiRp: rp(mob),
      subtotalRp: rp(sub),
      labelPpn: 'PPN ' + (Math.round(PPN * 1000) / 10) + '%',
      ppnRp: rp(ppn),
      totalRp: rp(sub + ppn)
    };
  }

  /* Skema termurah yang tetap menutup sejumlah hari sewa.
     Contoh tarif PC200-8: 7 hari lebih murah lewat tarif mingguan
     (Rp 51 jt) daripada harian (Rp 59,5 jt); 30 hari jauh lebih murah lewat
     tarif bulanan. Dipakai halaman pengajuan supaya rentang tanggal yang
     dipilih penyewa langsung diberi tarif terbaik. */
  function bestScheme(unitKey, days) {
    var r = rateFor(unitKey);
    var d = Math.max(1, Math.round(days) || 1);
    var opsi = [
      { mode: 'harian',   dur: Math.max(MIN_HARI, d),  rate: r.h },
      { mode: 'mingguan', dur: Math.ceil(d / 7),       rate: r.m },
      { mode: 'bulanan',  dur: Math.ceil(d / 30),      rate: r.b }
    ];
    opsi.forEach(function (o) { o.cost = o.rate * o.dur; });
    opsi.sort(function (a, b) { return a.cost - b.cost; });
    return opsi[0];
  }

  /* Selisih hari inklusif antara dua <input type="date">. */
  function daysBetween(a, b) {
    var s = new Date(a + 'T00:00:00'), e = new Date(b + 'T00:00:00');
    if (isNaN(s) || isNaN(e)) return null;
    var n = Math.round((e - s) / 86400000) + 1;
    return n > 0 ? n : null;
  }

  /* Bentuk query string yang dipakai untuk mengoper estimasi antar halaman. */
  function toQuery(s) {
    return new URLSearchParams({
      unit: s.unit, mode: s.mode, qty: String(s.qty), dur: String(s.dur),
      km: String(s.km), op: s.op ? '1' : '0', shift2: s.shift2 ? '1' : '0'
    }).toString();
  }

  function fromQuery(search) {
    var q = new URLSearchParams(search || window.location.search);
    if (!q.get('unit')) return null;
    return {
      unit: q.get('unit'),
      mode: q.get('mode') || 'harian',
      qty: Number(q.get('qty') || 2),
      dur: Number(q.get('dur') || 7),
      km: Number(q.get('km') || 18),
      op: q.get('op') !== '0',
      shift2: q.get('shift2') === '1'
    };
  }

  /* Tulis nilai baru dan beri kedip singkat kalau memang berubah, supaya
     terlihat bahwa angka bergerak saat kontrol digeser. Tidak melakukan apa
     pun kalau nilainya sama — jadi tidak ada kedip palsu saat render ulang. */
  function setLive(node, text) {
    if (!node || text === undefined || text === null) return;
    var next = String(text);
    if (node.textContent === next) return;
    node.textContent = next;
    node.classList.remove('is-updated');
    void node.offsetWidth;            // paksa restart animasi
    node.classList.add('is-updated');
  }
  window.setLive = setLive;

  return {
    get RATES() { return RATES; },
    get AREAS() { return AREAS; },
    get MIN_HARI() { return MIN_HARI; },
    get PPN() { return PPN; },
    DURATIONS: DURATIONS, DEFAULT_DUR: DEFAULT_DUR,
    configure: configure,
    rp: rp, estimate: estimate, kmForArea: kmForArea, hematPersen: hematPersen,
    bestScheme: bestScheme, daysBetween: daysBetween,
    estimateMulti: estimateMulti,
    toQuery: toQuery, fromQuery: fromQuery, setLive: setLive
  };
})();
