/* Demo statis: menyambungkan tautan yang tidak punya berkas, dan menjelaskan
   apa yang memang tidak bisa berjalan. Dibuat oleh `php artisan demo:ekspor`. */
(function () {
  'use strict';

  var ada = {};
  (window.DEMO_HALAMAN || []).forEach(function (h) { ada[h] = true; });

  function keTidakTersedia(tujuan) {
    location.href = 'tidak-tersedia.html'
      + (tujuan ? '?dari=' + encodeURIComponent(tujuan) : '');
  }

  /*
   * Sebagian tautan dibangun JavaScript saat halaman berjalan dan membawa
   * kueri - tombol "Lanjut ajukan sewa" di simulasi biaya, misalnya, jadi
   * `ajukan-sewa.html?unit=...&dur=...`. Berkas statis tidak punya kueri,
   * jadi kuerinya dibuang lalu nama berkasnya dicocokkan.
   */
  function berkasUntuk(href) {
    var tanpaJangkar = href.split('#')[0];

    if (ada[tanpaJangkar]) return tanpaJangkar;

    var tanpaKueri = tanpaJangkar.split('?')[0];

    return ada[tanpaKueri] ? tanpaKueri : null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;

    // Ctrl/Cmd/tengah: biarkan peramban membuka tab baru seperti biasa.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    var mati = a.getAttribute('data-demo-mati');
    if (mati) { e.preventDefault(); keTidakTersedia(mati); return; }

    var href = a.getAttribute('href');
    if (!href) return;

    /*
     * WhatsApp dicegat. Tautannya membawa rincian pesanan karangan ke nomor
     * yang tidak ada; melemparkan pengunjung ke sana bukan peragaan, hanya
     * membingungkan. Tombolnya tetap terlihat supaya fiturnya terlihat.
     */
    if (/wa\.me|api\.whatsapp\.com/i.test(href)) {
      e.preventDefault();
      beritahu('Di aplikasi sungguhan, tombol ini membuka WhatsApp dengan '
             + 'rincian pengajuan yang sudah terisi penuh. Di demo tidak '
             + 'dibuka: nomor dan pesanannya karangan.');
      return;
    }

    if (href.charAt(0) === '#'
        || /^(https?:|mailto:|tel:|data:)/i.test(href)
        || a.target === '_blank'
        || href.indexOf('../') === 0
        || href.indexOf('assets/') === 0
        || href.indexOf('uploads/') === 0) {
      return;
    }

    var berkas = berkasUntuk(href);

    if (!berkas) { e.preventDefault(); keTidakTersedia(href); return; }
    if (berkas !== href) { e.preventDefault(); location.href = berkas; }
  });

  /*
   * Formulir pengajuan sewa berujung di halaman konfirmasi contoh, supaya
   * alurnya utuh sampai akhir. Isinya tidak mencerminkan yang barusan diketik,
   * dan halaman itu mengatakannya sendiri.
   *
   * Formulir lain (kontak, tindakan di panel) tetap dicegat di tempat: pindah
   * halaman untuk setiap klik "Simpan" akan membuang konteks yang sedang
   * dilihat.
   */
  var catatan;

  function beritahu(pesan) {
    if (catatan) catatan.remove();

    catatan = document.createElement('div');
    catatan.className = 'demo-catatan';
    catatan.setAttribute('role', 'status');
    catatan.innerHTML = '<b>Demo statis</b>' + pesan;
    document.body.appendChild(catatan);

    setTimeout(function () {
      if (catatan) { catatan.remove(); catatan = null; }
    }, 4200);
  }

  document.addEventListener('submit', function (e) {
    e.preventDefault();

    var form = e.target;
    var pengajuan = form.querySelector('[name="unit[]"]') || form.querySelector('#skema-terpilih');

    if (pengajuan && ada['pengajuan-terkirim.html']) {
      location.href = 'pengajuan-terkirim.html';
      return;
    }

    beritahu('Datanya beku, jadi pengiriman tidak diproses. Di aplikasi '
           + 'sungguhan, isian ini tersimpan dan langsung muncul di panel.');
  }, true);

  document.addEventListener('click', function (e) {
    var tombol = e.target.closest('button[type="submit"], input[type="submit"]');

    if (tombol && !tombol.form) {
      e.preventDefault();
      beritahu('Tindakan ini mengubah data, jadi dimatikan di demo.');
    }
  });
})();