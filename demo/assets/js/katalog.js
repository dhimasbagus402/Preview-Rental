/* Katalog filtering.

   The mockup drew the category chips as static pills. Here they actually
   filter: chips narrow by category, the pool <select> narrows by depot, and
   the two combine. Everything is client-side over the markup already on the
   page, so the catalogue still reads fine with JavaScript off — it just
   shows every unit. */
(function () {
  'use strict';

  /* Tunggu sampai data/content.json selesai dimuat, supaya tarif yang
   dipakai adalah tarif terbaru dari panel admin. */
  var boot = window.Content && window.Content.onReady
    ? window.Content.onReady
    : function (cb) { document.addEventListener('DOMContentLoaded', cb); };

  boot(function () {
    var grid = document.getElementById('katalog');
    if (!grid) return;

    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-kategori-filter]'));
    var pool = document.getElementById('pool');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-kategori]'));
    var empty = document.getElementById('katalog-kosong');
    var count = document.getElementById('katalog-jumlah');

    /* Kategori dan pool bisa datang dari URL, mis. tautan kategori di footer
       (?kategori=excavator). Tanpa membacanya di sini, tautan itu membuka
       katalog dengan seluruh unit dan filternya terlihat tidak bekerja. */
    var params = new URLSearchParams(window.location.search);
    var dariUrl = params.get('kategori');
    var poolDariUrl = params.get('pool');

    var tersedia = chips.map(function (c) { return c.dataset.kategoriFilter; });
    var active = dariUrl && tersedia.indexOf(dariUrl) !== -1 ? dariUrl : 'semua';

    if (pool && poolDariUrl) {
      var adaPool = Array.prototype.some.call(pool.options, function (o) {
        return o.value === poolDariUrl;
      });
      if (adaPool) pool.value = poolDariUrl;
    }

    function apply() {
      var wantPool = pool ? pool.value : 'semua';
      var shown = 0;

      cards.forEach(function (card) {
        var okCat = active === 'semua' || card.dataset.kategori === active;
        var okPool = wantPool === 'semua' || card.dataset.pool === wantPool;
        var visible = okCat && okPool;
        card.hidden = !visible;
        if (visible) shown++;
      });

      if (empty) empty.hidden = shown !== 0;
      if (count) {
        count.textContent = shown === cards.length
          ? 'Menampilkan semua ' + cards.length + ' unit'
          : 'Menampilkan ' + shown + ' dari ' + cards.length + ' unit';
      }

      chips.forEach(function (chip) {
        var on = chip.dataset.kategoriFilter === active;
        chip.classList.toggle('btn-primary', on);
        chip.classList.toggle('btn-secondary', !on);
        chip.setAttribute('aria-pressed', String(on));
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        active = chip.dataset.kategoriFilter;
        apply();
      });
    });

    if (pool) pool.addEventListener('change', apply);

    apply();
  });
})();
