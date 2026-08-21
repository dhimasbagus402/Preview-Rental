/*
 * Slideshow foto armada.
 *
 * Slide pertama sudah bertanda [data-aktif] dari server, jadi tanpa skrip ini
 * halaman tetap menampilkan satu foto — bukan kotak kosong. Yang ditambahkan
 * di sini hanya pergantiannya.
 *
 * Pergantian otomatis berhenti begitu pengunjung menyentuh kontrolnya, dan
 * tidak pernah dimulai kalau sistemnya minta gerakan dikurangi. Ia juga
 * berhenti saat kursor atau fokus keyboard berada di dalam slideshow, supaya
 * foto tidak berganti tepat ketika seseorang sedang membacanya.
 */
(function () {
  var JEDA = 5000;

  document.querySelectorAll('.armada').forEach(function (akar) {
    var slide = Array.prototype.slice.call(akar.querySelectorAll('.armada-slide'));
    if (slide.length < 2) return;

    var titik = Array.prototype.slice.call(akar.querySelectorAll('[data-armada-ke]'));
    var kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var indeks = 0;
    var timer = null;
    var diambilAlih = false;   // pengunjung sudah memakai kontrolnya

    function tampilkan(i) {
      indeks = (i + slide.length) % slide.length;

      slide.forEach(function (s, n) {
        var aktif = n === indeks;
        s.toggleAttribute('data-aktif', aktif);
        s.setAttribute('aria-hidden', aktif ? 'false' : 'true');
      });

      titik.forEach(function (t, n) {
        t.setAttribute('aria-selected', n === indeks ? 'true' : 'false');
      });

      hangatkan(indeks + 1);
    }

    /*
     * Slide selain yang pertama memakai loading="lazy" supaya halaman depan
     * tidak menarik semua foto sekaligus. Tapi slide tersembunyi tidak pernah
     * dianggap perlu dimuat, jadi fotonya baru mulai diunduh tepat saat
     * gilirannya tiba — dan petaknya sempat kosong. Jadi foto berikutnya
     * dihangatkan lebih dulu, satu langkah di depan.
     */
    function hangatkan(i) {
      var img = slide[(i + slide.length) % slide.length].querySelector('img');
      if (!img || img.dataset.hangat) return;
      img.dataset.hangat = '1';
      new Image().src = img.currentSrc || img.src;
    }

    function jalan() {
      if (timer || diambilAlih || kurangiGerak) return;
      timer = setInterval(function () { tampilkan(indeks + 1); }, JEDA);
    }

    function berhenti() {
      clearInterval(timer);
      timer = null;
    }

    function pindah(i) {
      diambilAlih = true;      // sekali disentuh, tidak berjalan sendiri lagi
      berhenti();
      tampilkan(i);
    }

    akar.addEventListener('click', function (e) {
      var tombol = e.target.closest('[data-armada], [data-armada-ke]');
      if (!tombol) return;

      var ke = tombol.getAttribute('data-armada-ke');
      if (ke !== null) return pindah(parseInt(ke, 10));

      pindah(indeks + (tombol.getAttribute('data-armada') === 'mundur' ? -1 : 1));
    });

    akar.addEventListener('mouseenter', berhenti);
    akar.addEventListener('mouseleave', jalan);
    akar.addEventListener('focusin', berhenti);
    akar.addEventListener('focusout', jalan);

    // Tab yang tidak terlihat tidak perlu terus berganti foto.
    document.addEventListener('visibilitychange', function () {
      document.hidden ? berhenti() : jalan();
    });

    // Saat halaman dibuka tampilkan() belum pernah dipanggil, jadi foto kedua
    // dihangatkan dari sini.
    hangatkan(1);
    jalan();
  });
})();
