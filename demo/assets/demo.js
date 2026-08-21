/* Demo statis: mencegat apa pun yang butuh server, lalu menjelaskannya.
   Dibuat oleh `php artisan demo:ekspor`. */
(function () {
  'use strict';

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

  /* Formulir dibiarkan terlihat apa adanya - yang dicegat pengirimannya. */
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    beritahu('Datanya beku, jadi pengiriman tidak diproses. Di aplikasi ' +
             'sungguhan, isian ini tersimpan dan langsung muncul di panel.');
  }, true);

  document.addEventListener('click', function (e) {
    var mati = e.target.closest('[data-demo-mati]');
    if (mati) {
      e.preventDefault();
      beritahu('Halaman ini tidak ikut disertakan dalam demo.');
      return;
    }

    var tombol = e.target.closest('button[type="submit"], input[type="submit"]');
    if (tombol && !tombol.form) {
      e.preventDefault();
      beritahu('Tindakan ini mengubah data, jadi dimatikan di demo.');
    }
  });
})();