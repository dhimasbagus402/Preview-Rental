/*
 * Landing page — hanya dua hal, keduanya penyempurnaan.
 *
 * Tanpa skrip ini halaman tetap terbaca: seluruh panel pratinjau ditampilkan
 * berurutan (atribut `hidden` baru dipasang di sini), dan halamannya tampil
 * dalam mode terang — yang memang bawaannya.
 */
(function () {
  'use strict';

  /* ── mode terang/gelap ─────────────────────────────────────────────── */
  var akar = document.documentElement;
  var kunci = 'landing-tema';

  try {
    var tersimpan = localStorage.getItem(kunci);
    if (tersimpan) akar.setAttribute('data-tema', tersimpan);
  } catch (e) { /* localStorage bisa ditolak; bukan alasan gagal */ }

  var tombolTema = document.querySelector('.tema');

  if (tombolTema) {
    tombolTema.addEventListener('click', function () {
      // Bawaannya terang, jadi tanpa pilihan tersimpan yang tampil pasti
      // terang. Sempat keliru menebaknya dari setelan sistem: di komputer
      // yang bermode gelap, klik pertama justru menyetel "terang" lagi dan
      // tombolnya seolah tidak berfungsi.
      var sekarang = akar.getAttribute('data-tema') || 'terang';
      var berikut = sekarang === 'gelap' ? 'terang' : 'gelap';
      akar.setAttribute('data-tema', berikut);
      tombolTema.setAttribute('aria-pressed', String(berikut === 'gelap'));

      try { localStorage.setItem(kunci, berikut); } catch (e) {}
    });
  }

  /*
   * ── bingkai tanpa gambar ───────────────────────────────────────────
   *
   * Selama tangkapan layarnya belum ada, bingkainya menampilkan keterangan
   * "letakkan berkas ini di sini" — bukan ikon gambar rusak.
   *
   * Pemeriksaannya tidak bisa sekali di awal saja: gambar di panel yang
   * tersembunyi memakai loading="lazy", jadi peramban belum mencoba memuatnya
   * dan `error` belum pernah terjadi. Karena itu tiap gambar diperiksa ulang
   * saat panelnya ditampilkan.
   */
  function periksa(img) {
    if (!img || !img.complete) return;

    var bingkai = img.parentElement;

    if (img.naturalWidth) {
      bingkai.classList.remove('kosong');
    } else {
      bingkai.classList.add('kosong');
      bingkai.setAttribute('data-berkas', img.getAttribute('data-berkas') || '');
    }
  }

  var gambar = [].slice.call(document.querySelectorAll('.bingkai img'));

  gambar.forEach(function (img) {
    img.addEventListener('load', function () { periksa(img); });
    img.addEventListener('error', function () { periksa(img); });
    periksa(img);
  });

  /* ── peraga tangkapan layar ────────────────────────────────────────── */
  var peraga = document.getElementById('peraga');

  if (peraga) {
    var tab = [].slice.call(peraga.querySelectorAll('[role="tab"]'));
    var panel = [].slice.call(peraga.querySelectorAll('[role="tabpanel"]'));

    var tampilkan = function (i) {
      tab.forEach(function (t, n) { t.setAttribute('aria-selected', String(n === i)); });
      panel.forEach(function (p, n) { p.hidden = n !== i; });

      // Gambarnya baru mulai dimuat sekarang; periksa lagi setelah selesai.
      var img = panel[i].querySelector('img');
      if (img) {
        periksa(img);
        if (!img.complete) {
          img.addEventListener('load', function () { periksa(img); }, { once: true });
          img.addEventListener('error', function () { periksa(img); }, { once: true });
        }
      }
    };

    tab.forEach(function (t, i) {
      t.addEventListener('click', function () { tampilkan(i); });

      // Panah kiri/kanan berpindah tab, seperti tab pada umumnya.
      t.addEventListener('keydown', function (e) {
        var arah = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!arah) return;

        e.preventDefault();
        var j = (i + arah + tab.length) % tab.length;
        tampilkan(j);
        tab[j].focus();
      });
    });

    tampilkan(0);
  }
})();
