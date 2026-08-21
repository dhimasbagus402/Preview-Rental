/*
 * Menu tindakan per baris tabel.
 *
 * Dibangun dari <details>, jadi tanpa JavaScript pun tetap bisa dibuka dan
 * setiap butirnya tetap berupa tautan atau tombol form biasa. Skrip ini hanya
 * menambah tiga hal yang tidak bisa dilakukan CSS:
 *
 *  1. Panel dipindah ke position:fixed saat dibuka. Kartu tabel memakai
 *     overflow-x:auto, dan overflow pada satu sumbu memaksa sumbu lainnya
 *     ikut memotong — tanpa ini panel terpotong di baris paling bawah.
 *  2. Hanya satu menu terbuka pada satu waktu.
 *  3. Menutup lewat Escape, klik di luar, atau saat halaman digulir.
 */
(function () {
  function daftar() {
    return Array.prototype.slice.call(document.querySelectorAll('details.menu'));
  }

  function tutupSemua(kecuali) {
    daftar().forEach(function (d) {
      if (d !== kecuali && d.open) {
        d.open = false;
        bersihkan(d);
      }
    });
  }

  function bersihkan(d) {
    var panel = d.querySelector('.menu-panel');
    if (panel) panel.removeAttribute('style');
  }

  function tempatkan(d) {
    var panel = d.querySelector('.menu-panel');
    var tombol = d.querySelector('summary');
    if (!panel || !tombol) return;

    /*
     * Panel dikeluarkan dari alur LEBIH DULU, baru tombolnya diukur.
     * Selama panel masih position:absolute di dalam sel tabel, membukanya
     * melebarkan tabel itu dan menggeser tombolnya sendiri — koordinat yang
     * terbaca jadi milik tata letak yang sudah tidak ada lagi sesaat
     * kemudian, dan panelnya meleset beberapa belas piksel.
     */
    panel.style.position = 'fixed';
    panel.style.right = 'auto';
    panel.style.top = '-9999px';
    panel.style.left = '0';

    var r = tombol.getBoundingClientRect();

    // Menu tindakan rata kanan dengan tombolnya; panel bantuan yang jauh
    // lebih lebar dari pemicunya rata kiri, supaya tidak terlempar ke tepi
    // layar. Keduanya tetap dijaga agar utuh di dalam jendela.
    var kiri = panel.getAttribute('data-rata') === 'kiri'
      ? r.left
      : r.right - panel.offsetWidth;

    panel.style.left = Math.max(8, Math.min(
      Math.round(kiri),
      window.innerWidth - panel.offsetWidth - 8
    )) + 'px';

    var bawah = r.bottom + 6;
    // Kalau tidak muat di bawah, buka ke atas.
    panel.style.top = (bawah + panel.offsetHeight + 12 > window.innerHeight)
      ? Math.max(8, Math.round(r.top - panel.offsetHeight - 6)) + 'px'
      : Math.round(bawah) + 'px';
  }

  // `toggle` tidak menggelembung, jadi ditangkap pada fase capture.
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d.classList || !d.classList.contains('menu')) return;

    if (d.open) {
      tutupSemua(d);
      tempatkan(d);
    } else {
      bersihkan(d);
    }
  }, true);

  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('details.menu')) tutupSemua(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var terbuka = daftar().filter(function (d) { return d.open; })[0];
    if (!terbuka) return;
    terbuka.open = false;
    bersihkan(terbuka);
    var s = terbuka.querySelector('summary');
    if (s) s.focus();
  });

  // Panel yang sudah dipaku ke layar akan melayang lepas kalau halaman atau
  // tabelnya digulir, jadi tutup saja.
  window.addEventListener('resize', function () { tutupSemua(null); });
  window.addEventListener('scroll', function () { tutupSemua(null); }, true);
})();
