/*
 * Baris spesifikasi teknis yang ditambah sesuai kebutuhan.
 *
 * Server sudah mengirim baris yang berisi ditambah satu baris kosong, jadi
 * tanpa skrip ini formnya tetap bisa dipakai — hanya satu spesifikasi baru
 * per simpan. Tombol "Tambah" dan "Hapus" karenanya disembunyikan dari
 * server dan baru dimunculkan di sini: tombol yang tidak berfungsi lebih
 * buruk daripada tombol yang tidak ada.
 */
(function () {
  var daftar = document.getElementById('spec-daftar');
  var contoh = document.getElementById('spec-contoh');
  var tambah = document.getElementById('spec-tambah');
  if (!daftar || !contoh || !tambah) return;

  function baris() {
    return Array.prototype.slice.call(daftar.querySelectorAll('.baris-ulang'));
  }

  /*
   * Kolomnya hanya berlabel di kepala tabel, dan kepala itu tidak terhubung
   * ke input mana pun bagi pembaca layar. Jadi tiap input diberi namanya
   * sendiri, dinomori ulang setiap kali barisnya berubah.
   */
  function segarkan() {
    baris().forEach(function (r, i) {
      r.querySelectorAll('[data-spec]').forEach(function (input) {
        var jenis = input.getAttribute('data-spec') === 'label' ? 'Label' : 'Nilai';
        input.setAttribute('aria-label', jenis + ' spesifikasi baris ' + (i + 1));
      });

      var hapus = r.querySelector('[data-spec-hapus]');
      if (hapus) hapus.setAttribute('aria-label', 'Hapus spesifikasi baris ' + (i + 1));
    });

    // Tanpa baris tersisa, kepala tabelnya tidak ada gunanya.
    daftar.hidden = baris().length === 0;
  }

  daftar.querySelectorAll('[data-spec-hapus]').forEach(function (b) { b.hidden = false; });
  tambah.hidden = false;

  tambah.addEventListener('click', function () {
    var b = contoh.content.firstElementChild.cloneNode(true);
    daftar.hidden = false;
    daftar.appendChild(b);
    segarkan();

    var isian = b.querySelector('input');
    if (isian) isian.focus();
  });

  daftar.addEventListener('click', function (e) {
    var tombol = e.target.closest('[data-spec-hapus]');
    if (!tombol) return;

    tombol.closest('.baris-ulang').remove();
    segarkan();
    tambah.focus();
  });

  segarkan();
})();
