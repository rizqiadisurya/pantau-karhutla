# Pantau Karhutla

Peta titik panas kebakaran hutan dan lahan (karhutla) di Indonesia. Titik panas diambil langsung dari satelit NASA FIRMS setiap 15 menit, lalu dicocokkan dengan batas konsesi kebun sawit dan hutan tanaman industri untuk menampilkan perusahaan pemegang izinnya.

## Isi folder

| File | Fungsi |
|---|---|
| `index.html` | Halaman website (peta, panel, filter) |
| `api/fires.js` | Fungsi server Vercel yang mengambil data terbaru dari NASA FIRMS |
| `data/geo.js` | Batas provinsi Indonesia dan negara tetangga |
| `data/concessions.js` | Batas konsesi sawit & HTI beserta nama perusahaan |
| `data/archive.js` | Arsip titik panas (dipakai bila data live gagal diambil) |
| `vercel.json` | Pengaturan Vercel |

## Langkah 1 — Minta kunci API FIRMS (gratis, 2 menit)

1. Buka https://firms.modaps.eosdis.nasa.gov/api/map_key/
2. Masukkan email, lalu klik **Get MAP_KEY**.
3. Kunci (32 karakter) dikirim ke email. Simpan untuk langkah berikutnya.

## Langkah 2 — Online-kan di Vercel

### Cara A: lewat GitHub (tanpa terminal)

1. Masuk ke https://github.com/new dan buat repository baru, misalnya `pantau-karhutla`.
2. Di halaman repository, klik **uploading an existing file**, lalu seret **semua isi folder ini** (termasuk folder `api` dan `data`). Klik **Commit changes**.
3. Buka https://vercel.com/new, masuk dengan akun GitHub, lalu pilih **Import** pada repository tadi.
4. Sebelum menekan Deploy, buka bagian **Environment Variables** dan tambahkan:
   - Name: `FIRMS_MAP_KEY`
   - Value: kunci dari Langkah 1
5. Klik **Deploy**. Dalam ±1 menit website online di alamat seperti `pantau-karhutla.vercel.app`.

### Cara B: lewat terminal

Butuh Node.js 18+.

```bash
cd pantau-karhutla
npx vercel login
npx vercel                      # deploy pertama, ikuti pertanyaannya
npx vercel env add FIRMS_MAP_KEY production   # tempel kunci FIRMS
npx vercel --prod               # deploy ulang dengan kunci terpasang
```

## Langkah 3 — Cek

- Buka `https://<alamat-kamu>/api/fires`. Harus muncul data JSON berisi `rows`.
- Di halaman utama, label kanan atas berubah menjadi **Live · FIRMS**.
- Kalau label tetap **Arsip FIRMS**, panel kanan menampilkan alasannya. Biasanya karena `FIRMS_MAP_KEY` belum diisi atau belum di-deploy ulang setelah diisi (Vercel → Project → Deployments → Redeploy).

## Sumber data

- **Titik panas:** NASA FIRMS, VIIRS S-NPP / NOAA-20 / NOAA-21 (Near Real-Time), 24 jam terakhir.
- **Konsesi:** kebun sawit (HGU/IUP, Kementerian Kehutanan 2012) dan hutan tanaman industri (PBPH-HT, KLHK 2021), dipublikasikan Global Forest Watch; nama grup dari repositori Indonesia Land Watch (github.com/handichan/borneo-sumatra-land-watch).
- **Batas wilayah:** Natural Earth.
- **Citra satelit:** Esri World Imagery.

## Catatan penting

- Titik panas adalah piksel satelit (±375 m) yang lebih panas dari sekitarnya, jadi perlu verifikasi lapangan.
- Titik panas di dalam konsesi berarti api terdeteksi di lahan berizin perusahaan tersebut, **bukan bukti** perusahaan itu penyebabnya.
- Data konsesi sawit berasal dari 2012; pemilik sebagian konsesi mungkin sudah berganti.
- Untuk titik live, pencocokan ke konsesi memakai batas yang disederhanakan, sehingga titik yang sangat dekat garis batas bisa meleset.
