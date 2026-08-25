# Demo statis

Berkas di folder ini **dihasilkan otomatis** oleh:

```bash
docker compose exec app_preview php artisan demo:ekspor
```

Jangan disunting langsung — suntingannya akan hilang pada ekspor berikutnya. Kalau ada yang perlu diubah, ubah perintahnya di `backend/app/Console/Commands/EksporDemo.php`.

Halaman-halaman ini dirender oleh aplikasi yang sebenarnya memakai data pratinjau, lalu disimpan sebagai HTML biasa. Yang berjalan di peramban tetap hidup (simulasi biaya, peta, slideshow, menu, mode terang/gelap); yang butuh server dicegat dan dijelaskan.

Diekspor pada 25 Agu 2026, 03:26.
