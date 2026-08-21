/*
 * Peta pool di halaman Kontak.
 *
 * Satu peta Leaflet berisi seluruh pool sekaligus, di atas ubin OpenStreetMap.
 * Leaflet-nya di-host sendiri, jadi satu-satunya yang dipanggil dari luar
 * adalah ubin petanya.
 *
 * Daftar pool di bawah peta tetap tautan biasa ke Google Maps, jadi tanpa
 * skrip ini halaman masih berguna — hanya tidak interaktif.
 */
(function () {
  var wadah = document.getElementById('peta-leaflet');
  if (!wadah || typeof L === 'undefined') return;

  var titik;
  try {
    titik = JSON.parse(wadah.getAttribute('data-peta-titik'));
  } catch (e) {
    return;
  }
  if (!titik || !titik.length) return;

  var peta = L.map(wadah, {
    scrollWheelZoom: false,   // supaya menggulir halaman tidak malah men-zoom peta
    zoomControl: true,
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(peta);

  /* Penanda digambar dengan CSS, bukan gambar PNG bawaan Leaflet, supaya
     warnanya mengikuti warna aksen situs dan ikut berubah di mode gelap. */
  function ikon(pusat) {
    return L.divIcon({
      className: 'peta-pin' + (pusat ? ' is-pusat' : ''),
      html: '<span class="peta-pin-titik"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });
  }

  function aman(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var penanda = {};

  titik.forEach(function (t) {
    var isi = '<b>' + aman(t.nama) + (t.pusat ? ' <span class="peta-tag">pusat</span>' : '') + '</b>';
    if (t.alamat) isi += '<br>' + aman(t.alamat);
    if (t.unit) isi += '<br>Pool: ' + aman(t.unit) + ' unit';
    isi += '<br><a href="' + aman(t.maps) + '" target="_blank" rel="noopener noreferrer">Buka rute di Google Maps &rarr;</a>';

    var m = L.marker([t.lat, t.lng], { icon: ikon(t.pusat), title: t.nama })
      .addTo(peta)
      .bindPopup(isi)
      .bindTooltip(t.nama, { permanent: true, direction: 'top', offset: [0, -10], className: 'peta-label-pin' });

    penanda[t.nama] = m;
  });

  /*
   * Semua pool masuk layar, dengan sedikit ruang di tepinya.
   *
   * Leaflet menghitung ukuran petanya sekali saat dipasang. Wadahnya di sini
   * ikut tinggi kolom di sebelahnya, jadi ukuran itu bisa masih salah saat
   * peta dibuat — akibatnya seluruh penanda menumpuk di pojok kiri atas.
   * Karena itu ukurannya disegarkan lalu pas-nya dihitung ulang, dan diulangi
   * setiap kali wadahnya berubah ukuran — kecuali kalau pengunjung sudah
   * menggeser petanya sendiri.
   */
  var batas = L.latLngBounds(titik.map(function (t) { return [t.lat, t.lng]; }));
  var disentuh = false;

  function pas() {
    peta.invalidateSize({ animate: false });

    if (titik.length > 1) {
      peta.fitBounds(batas, { padding: [46, 46], animate: false });
    } else {
      peta.setView([titik[0].lat, titik[0].lng], 13);
    }
  }

  pas();
  requestAnimationFrame(pas);
  window.addEventListener('load', pas);

  peta.on('dragstart', function () { disentuh = true; });

  var kontrolZoom = wadah.querySelector('.leaflet-control-zoom');
  if (kontrolZoom) kontrolZoom.addEventListener('click', function () { disentuh = true; });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () {
      if (disentuh) {
        peta.invalidateSize({ animate: false });
      } else {
        pas();
      }
    }).observe(wadah);
  }

  /* Daftar pool di bawah peta jadi pemilihnya. Tautannya dibiarkan utuh:
     Ctrl/Cmd-klik tetap membuka Google Maps di tab baru seperti biasa. */
  var daftar = document.getElementById('peta-pilihan');
  if (!daftar) return;

  daftar.addEventListener('click', function (e) {
    var tautan = e.target.closest('a[data-peta-nama]');
    if (!tautan) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    var m = penanda[tautan.getAttribute('data-peta-nama')];
    if (!m) return;

    e.preventDefault();
    peta.setView(m.getLatLng(), Math.max(peta.getZoom(), 12), { animate: true });
    m.openPopup();

    Array.prototype.forEach.call(daftar.querySelectorAll('a'), function (a) {
      if (a === tautan) {
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  });
})();
