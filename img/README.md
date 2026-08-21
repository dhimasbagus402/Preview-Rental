# Tangkapan layar untuk landing page

Letakkan delapan berkas di folder ini. Selama berkasnya belum ada, bingkainya
menampilkan keterangan "letakkan berkas ini di sini", bukan gambar rusak —
jadi halamannya tetap rapi saat dibuka.

| Berkas | Halaman | Cara mendapatkannya |
| --- | --- | --- |
| `01-beranda.png` | Beranda | `/` |
| `02-katalog.png` | Katalog alat | `/alat-berat` |
| `03-detail-unit.png` | Detail unit | `/alat-berat/komatsu-pc200-8` |
| `04-simulasi.png` | Simulasi biaya | `/simulasi-biaya` |
| `05-pengajuan.png` | Formulir pengajuan | `/ajukan-sewa` |
| `06-admin-rental.png` | Panel · Rental | `/admin/rental` |
| `07-admin-alat.png` | Panel · Alat | `/admin/alat` |
| `08-admin-tarif.png` | Panel · Tarif alat | `/admin/tarif` |

## Ukuran

**1280 × 800** (atau kelipatannya, mis. 2560 × 1600 untuk layar retina).
Bingkainya berbanding 16:10 dan memotong dari atas, jadi bagian atas halaman
yang paling penting untuk terlihat.

Nama berkas dan rasio sudah dipakai di `index.html`; kalau diganti, ganti juga
di sana.

## Pakai data preview, bukan data kerja Anda

Jangan mengambil tangkapan layar dari database yang Anda pakai sehari-hari —
di sana ada baris uji coba, alamat asal ketik, dan angka yang belum rapi.
Ada seeder khusus untuk ini yang mengisi data pratinjau yang bersih dan enak
dilihat, di database terpisah:

```bash
cd backend
docker compose --profile preview up -d
docker compose exec app_preview php artisan migrate:fresh --seed --seeder=PreviewSeeder --force
```

Situs pratinjau berjalan di **http://localhost:8002** dengan databasenya
sendiri; data kerja Anda di `:8001` tidak tersentuh sama sekali.

Akun panel untuk pratinjau: `demo@contoh.test` / `pratinjau123`.

Setelah semua tangkapan layar diambil:

```bash
docker compose --profile preview down -v
```

Rinciannya ada di `backend/README.md`, bagian "Data pratinjau".
