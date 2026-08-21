/* Kolom rupiah di panel admin.
 *
 * <input type="number"> tidak bisa menampilkan pemisah ribuan, jadi kolom uang
 * dibuat type="text" dan diformat di sini: 1500000 tampil sebagai 1.500.000.
 *
 * Server tetap membersihkan sendiri titiknya (App\Support\Uang), sehingga
 * angkanya tetap benar walau JavaScript mati — kolomnya cuma tampil polos. */
(function () {
  'use strict';

  function angkaSaja(teks) {
    return String(teks).replace(/\D+/g, '');
  }

  function format(angka) {
    if (angka === '') return '';
    return Number(angka).toLocaleString('id-ID');
  }

  /* Menghitung ulang posisi kursor: menambah titik menggeser teks ke kanan,
     tanpa ini kursor melompat ke akhir setiap kali mengetik di tengah. */
  function pasang(input) {
    var render = function (jagaKursor) {
      var sebelum = input.value;
      var posisi = input.selectionStart;
      var digitSebelumKursor = angkaSaja(sebelum.slice(0, posisi)).length;

      var angka = angkaSaja(sebelum);
      var hasil = format(angka);
      if (hasil === sebelum) return;

      input.value = hasil;

      if (!jagaKursor) return;

      var lewat = 0, baru = 0;
      while (baru < hasil.length && lewat < digitSebelumKursor) {
        if (/\d/.test(hasil[baru])) lewat++;
        baru++;
      }
      input.setSelectionRange(baru, baru);
    };

    input.addEventListener('input', function () { render(true); });
    input.addEventListener('blur', function () { render(false); });
    render(false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[data-uang]').forEach(pasang);
  });
})();
