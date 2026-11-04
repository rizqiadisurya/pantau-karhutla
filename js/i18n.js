/* Pantau Karhutla — English interface.
   Indonesian is the source language. In English mode this file swaps the shared word lists and formatters,
   then translates every text node and label on the page (including content rendered later) with a phrase
   dictionary plus patterns for sentences that contain numbers or names. */
(function(){
"use strict";
let lang="id";
try{const q=new URLSearchParams(location.search).get("lang");if(q==="en"||q==="id"){lang=q;localStorage.setItem("pk_lang",q)}else lang=localStorage.getItem("pk_lang")||"id"}catch(e){}
const btn=document.getElementById("langBtn");
if(btn){btn.textContent=lang==="en"?"ID":"EN";btn.title=lang==="en"?"Ganti ke Bahasa Indonesia":"Switch to English";btn.setAttribute("aria-label",btn.title);
  btn.onclick=()=>{const nl=lang==="en"?"id":"en";try{localStorage.setItem("pk_lang",nl)}catch(e){}const u=new URL(location.href);u.searchParams.delete("lang");location.replace(u.toString())}}
window.PK_LANG=lang;
window.PK_T=s=>s;
if(lang!=="en")return;
document.documentElement.lang="en";

/* ---------- shared vocab & formatters ---------- */
BULAN.splice(0,12,"January","February","March","April","May","June","July","August","September","October","November","December");
HARI.splice(0,7,"Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
const DIRS=["north","northeast","east","southeast","south","southwest","west","northwest"];
ARAH.splice(0,8,...DIRS);MATA.splice(0,8,...DIRS);
Object.assign(FRP_LBL,{1:"Small",2:"Medium",3:"Large",4:"Very large"});
Object.assign(CONF_LBL,{h:"High",n:"Nominal",l:"Low"});
const WMO_EN={"Cerah":"Clear","Cerah berawan":"Mostly clear","Berawan sebagian":"Partly cloudy","Berawan":"Cloudy","Berkabut":"Foggy","Gerimis ringan":"Light drizzle","Gerimis":"Drizzle","Gerimis lebat":"Heavy drizzle","Hujan ringan":"Light rain","Hujan sedang":"Moderate rain","Hujan lebat":"Heavy rain","Hujan":"Rain","Hujan lokal ringan":"Light showers","Hujan lokal":"Showers","Hujan lokal lebat":"Heavy showers","Badai petir":"Thunderstorm"};
Object.values(WMO).forEach(v=>{if(WMO_EN[v[0]])v[0]=WMO_EN[v[0]]});
const nf=new Intl.NumberFormat("en-US");
window.fmtNum=n=>nf.format(n);
window.fmtJt=n=>(n/1e6).toLocaleString("en-US",{maximumFractionDigits:1,minimumFractionDigits:1})+" M";
window.relNow=ms=>{const m=Math.round((Date.now()-ms)/60000);if(m<1)return"just now";if(m<60)return m+" min ago";const h=Math.floor(m/60);if(h<24)return h+" h ago";const d=Math.floor(h/24);return d+(d===1?" day ago":" days ago")};
window.winLabel=w=>w<24?"last "+w+" hours":w===24?"last 24 hours":"last "+(w/24)+" days";
try{const BN={peta:"Dark map",satelit:"Satellite",hybrid:"Satellite + labels",terrain:"Terrain",jalan:"Streets",asap:"Today's smoke"};Object.keys(BN).forEach(k=>{if(BASES[k])BASES[k].nm=BN[k]})}catch(e){}
try{const EN=window.COMPANY_PROFILES_EN||{};Object.keys(EN).forEach(k=>{if(PROFILES[k])Object.assign(PROFILES[k],EN[k])})}catch(e){}
try{const S=window.COMPANY_PROFILES||{};Object.values(S).forEach(p=>{if(p.sector)p.sector=p.sector.replace("Kelapa sawit","Oil palm").replace("Pulp & kertas","Pulp & paper").replace("Hutan tanaman industri","Industrial timber plantation")})}catch(e){}

/* ---------- phrase dictionary ---------- */
const D={
"Pantau":"Pantau","Titik api kebakaran hutan & lahan dari satelit":"Forest & land fire hotspots from satellites",
"Cari lokasi atau perusahaan":"Search a place or company","Cari provinsi, kota/kabupaten, atau perusahaan":"Search province, city/regency, or company",
"Dekat saya: cari titik api terdekat dari lokasi Anda":"Near me: find the hotspots closest to you","Cari titik api terdekat dari lokasi Anda":"Find the hotspots closest to you","Dekat saya":"Near me",
"Ganti ke mode terang":"Switch to light mode","Ganti ke mode gelap":"Switch to dark mode","Mode terang/gelap":"Light/dark mode",
"Data langsung NASA FIRMS, diperbarui otomatis setiap 15 menit":"Live NASA FIRMS data, refreshed automatically every 15 minutes","Tentang data":"About the data",
"Live":"Live","Arsip":"Archive","Memuat…":"Loading…","Peta titik api":"Hotspot map","Perbesar":"Zoom in","Perkecil":"Zoom out","Tampilkan seluruh Indonesia":"Show all of Indonesia",
"Rentang waktu":"Time range","6 jam":"6 h","24 jam":"24 h","3 hari":"3 days","7 hari":"7 days","Lapisan":"Layers","Peta":"Map","Lapisan peta":"Map layers","Jenis peta":"Map type","Tampilkan di peta":"Show on map",
"Foto kebakaran":"Fire photos","Foto satelit 8 area api terbesar":"Satellite photos of the 8 largest fire areas","Batas konsesi perusahaan":"Company concession boundaries","Kebun sawit & hutan tanaman industri":"Oil palm & industrial timber plantations",
"Arah angin":"Wind direction","Panah menunjuk ke mana angin (dan asap) bertiup":"Arrows point where the wind (and smoke) is blowing",
"Kualitas udara (PM2.5)":"Air quality (PM2.5)","Tingkat polusi asap per kota, skala ISPU":"Smoke pollution per city, ISPU scale","Kualitas udara":"Air quality",
"Bahaya kebakaran":"Fire danger","Prakiraan 7 hari dari kondisi cuaca":"7-day forecast from weather conditions","Lahan gambut":"Peatland","Sebaran gambut (Miettinen dkk. 2016, via GFW)":"Peat extent (Miettinen et al. 2016, via GFW)",
"Tingkat keyakinan deteksi":"Detection confidence","Tingkat keyakinan":"Confidence","Semua":"All","Sedang ke atas":"Nominal and up","Tinggi saja":"High only",
"Makin tinggi keyakinan, makin kecil kemungkinan titik itu bukan api (misalnya atap panas atau pantulan).":"The higher the confidence, the less likely the point is not a fire (e.g. a hot roof or reflection).",
"Lalu lintas real-time butuh kunci API layanan peta berbayar.":"Real-time traffic needs an API key from a paid map service.",
"Waktu peta angin":"Wind map time","Angin":"Wind","Sekarang":"Now","Besok":"Tomorrow","Lusa":"In 2 days","+3 hari":"+3 days","Waktu peta kualitas udara":"Air quality map time","Udara":"Air","Hari prakiraan bahaya kebakaran":"Fire danger forecast day","Bahaya":"Danger",
"Memuat data terbaru…":"Loading latest data…","Memuat data…":"Loading data…","Memuat peta angin…":"Loading wind map…","Memuat kualitas udara…":"Loading air quality…","Menghitung bahaya kebakaran…":"Calculating fire danger…","Memeriksa lahan gambut…":"Checking peatland…","Membuat gambar…":"Creating image…",
"Legenda":"Legend","Kekuatan api":"Fire intensity","Kecil":"Small","Sedang":"Moderate","Besar":"Large","Sangat besar":"Very large","Baru terdeteksi (≤ 2 jam)":"Newly detected (≤ 2 h)",
"Area konsesi perusahaan":"Company concession area","Konsesi yang dipilih":"Selected concession","Arah angin (makin panjang makin kencang)":"Wind direction (longer = stronger)","Udara: baik → berbahaya":"Air: good → hazardous","Bahaya: rendah → ekstrem":"Danger: low → extreme",
"Area pantauan Anda":"Your watch area","Lokasi Anda":"Your location","Putar ulang perkembangan titik api":"Replay how the hotspots developed","Jeda":"Pause",
"Grafik jumlah deteksi titik api dari waktu ke waktu. Klik untuk melihat kondisi pada jam tertentu.":"Chart of hotspot detections over time. Click to see a specific hour.",
"Informasi titik api":"Hotspot information","Bagian panel":"Panel sections","Ringkasan":"Summary","Wilayah":"Regions","Perusahaan":"Companies","Titik api":"Hotspots","Tren":"Trends","Info":"Info",
"Seberapa dekat api dari Anda?":"How close are the fires to you?","Lihat titik api terdekat dari lokasi Anda.":"See the hotspots nearest to your location.","Cek lokasi saya":"Check my location",
"Lihat per provinsi":"View by province","Provinsi terdampak":"Provinces affected","Lihat titik ini":"View this hotspot","Api terbesar":"Largest fire","Lihat per perusahaan":"View by company","Di area konsesi":"In concessions",
"Peringatan di sekitar Anda":"Alerts near you","Pilih lokasi dan radius, lalu dapatkan notifikasi saat ada titik api baru di sekitarnya.":"Choose a place and radius, then get notified when new hotspots appear nearby.","Atur peringatan":"Set up alerts",
"berstatus":"are","tidak sehat":"unhealthy","atau lebih buruk (rata-rata PM2.5 24 jam).":"or worse (24-hour mean PM2.5).",
"Baik":"Good","Tidak sehat":"Unhealthy","Sangat tidak sehat":"Very unhealthy","Berbahaya":"Hazardous",
"Udara bersih. Aman beraktivitas di luar ruangan.":"Clean air. Outdoor activity is safe.",
"Balita, lansia, ibu hamil, dan penderita asma atau penyakit jantung sebaiknya mengurangi aktivitas berat di luar.":"Young children, the elderly, pregnant women and people with asthma or heart disease should limit strenuous outdoor activity.",
"Kelompok rentan hindari aktivitas di luar. Yang lain kurangi aktivitas berat dan pakai masker (N95/KN95 lebih baik dari masker kain).":"Vulnerable groups should avoid outdoor activity. Everyone else should limit strenuous activity and wear a mask (N95/KN95 is better than cloth).",
"Semua orang sebaiknya tetap di dalam ruangan dengan jendela tertutup. Pakai masker N95 bila harus keluar.":"Everyone should stay indoors with windows closed. Wear an N95 mask if you must go out.",
"Tetap di dalam ruangan tertutup. Kelompok rentan pertimbangkan pindah sementara ke tempat berudara bersih. Segera ke fasilitas kesehatan bila sesak napas.":"Stay in a closed room. Vulnerable groups should consider moving temporarily to a place with clean air. Seek medical care right away if breathing becomes difficult.",
"PM2.5 dari model CAMS Copernicus (via Open-Meteo), dikelompokkan dengan batas ISPU. Ini perkiraan model, bukan alat ukur. Data resmi:":"PM2.5 from the CAMS Copernicus model (via Open-Meteo), grouped with Indonesia's ISPU thresholds. These are model estimates, not sensor readings. Official data:",
"ISPU KLH":"ISPU (Ministry of Environment)","Sembunyikan dari peta":"Hide from map","Ringkas":"Show less","prakiraan 7 hari":"7-day forecast","Hari ini":"Today","Ini":"Today","Hr ini":"Today","Bsk":"Tmrw",
". Besok":". Tomorrow","tidak ada provinsi berstatus tinggi":"no provinces at high danger","Semua provinsi →":"All provinces →",
"Indeks sederhana dari jumlah hari tanpa hujan, kelembapan, suhu, dan angin (model cuaca Open-Meteo). Lahan gambut kering bisa terbakar meski indeks sedang. Bukan peringatan resmi; lihat":"A simple index from days without rain, humidity, temperature and wind (Open-Meteo weather model). Dry peat can burn even at a moderate index. Not an official warning; see",
"Rendah":"Low","Tinggi":"High","Ekstrem":"Extreme",
"Dampak kesehatan":"Health impact","Kasus ISPA akibat asap":"Smoke-related respiratory infections (ISPA)","Penduduk Indonesia":"Population of Indonesia","Lihat penduduk & ISPA per provinsi →":"See population & ISPA by province →",
"Foto satelit terbaru":"Latest satellite photos","Memuat foto satelit…":"Loading satellite photo…","Foto belum tersedia untuk tanggal ini":"No photo available for this date yet",
"Foto warna asli satelit NOAA-20 (±375 m per piksel) dari NASA. Titik merah = api, kabut putih kecokelatan = asap. Klik foto untuk detail.":"True-colour NOAA-20 satellite photos (±375 m per pixel) from NASA. Red dots = fire, brownish-white haze = smoke. Click a photo for details.",
"Bagikan ringkasan":"Share a summary","Buat gambar ringkasan titik api hari ini, siap dikirim ke WhatsApp, Instagram, atau media sosial lain.":"Create a summary image of today's hotspots, ready for WhatsApp, Instagram or other social media.",
"Buat gambar ringkasan":"Create summary image","Unduh data (CSV)":"Download data (CSV)","Darurat & lapor kebakaran":"Emergency & reporting fires","Layanan darurat":"Emergency services","Pemadam kebakaran":"Fire brigade","Ambulans / medis":"Ambulance / medical","BNPB (bencana)":"BNPB (disasters)",
"Melihat api atau asap tebal? Hubungi 112 atau 113. Laporkan juga ke BPBD atau posko Manggala Agni setempat. Jangan mendekati api sendiri.":"See fire or thick smoke? Call 112 or 113. Also report it to the local BPBD (disaster agency) or Manggala Agni fire-brigade post. Do not approach the fire yourself.",
"Per provinsi":"By province","Urutkan":"Sort","Kasus ISPA":"ISPA cases","Klik provinsi untuk menyaring peta. Angka ISPA dari Kemenkes, penduduk dari Dukcapil.":"Click a province to filter the map. ISPA figures from the Ministry of Health, population from the Civil Registry (Dukcapil).",
"Provinsi":"Province","Penduduk":"Population","Kasus ISPA per 1.000 penduduk":"ISPA cases per 1,000 people","per 1.000":"per 1,000","Kemenkes":"Ministry of Health","rincian provinsi":"province breakdown","Dukcapil":"Dukcapil",
"Bahaya kebakaran per provinsi":"Fire danger by province","R = rendah, S = sedang, T = tinggi, E = ekstrem. Nilai provinsi = kondisi di 25% wilayah terkeringnya. Klik provinsi untuk menyaring peta.":"L = low, M = moderate, H = high, E = extreme. A province's value reflects its driest 25% of area. Click a province to filter the map.",
"Titik api di area konsesi":"Hotspots in concessions","Titik api di dalam area konsesi berarti api terdeteksi di lahan yang izinnya dipegang perusahaan tersebut. Ini":"A hotspot inside a concession means fire was detected on land licensed to that company. This","belum membuktikan":"does not prove","siapa penyebab kebakarannya.":"who caused the fire.",
"Nama perusahaan dari data izin pemerintah yang dipublikasikan Global Forest Watch (sawit 2012, HTI 2021). Pemilik bisa sudah berganti.":"Company names come from government permit data published by Global Forest Watch (oil palm 2012, timber plantations 2021). Owners may have changed.",
"Daftar titik api":"Hotspot list","Urutkan daftar":"Sort list","Terbaru":"Newest","Terbesar":"Largest","Unduh daftar titik api sesuai saringan sebagai CSV":"Download the filtered hotspot list as CSV","Unduh CSV":"Download CSV",
"Memuat arsip tren…":"Loading trend archive…","Status data":"Data status","Data langsung dari NASA FIRMS.":"Live data from NASA FIRMS.","Cara membaca peta":"How to read the map",
"Apa itu titik api?":"What is a hotspot?","Titik api (hotspot) adalah area seluas ±375 × 375 meter yang dideteksi satelit jauh lebih panas dari sekitarnya. Kebanyakan berasal dari kebakaran hutan dan lahan, tapi bisa juga dari pembakaran sampah atau industri. Perlu dicek di lapangan untuk memastikan.":"A hotspot is an area of about 375 × 375 metres that a satellite detects as much hotter than its surroundings. Most are forest and land fires, but some come from burning waste or industry. Ground checks are needed to confirm.",
"Seberapa “live” datanya?":"How “live” is the data?","Halaman ini mengecek data baru dari NASA FIRMS setiap 15 menit, juga saat Anda kembali membuka tab ini. Titik api baru muncul setiap kali satelit VIIRS (S-NPP, NOAA-20, NOAA-21) melintas, sekitar enam kali sehari di atas Indonesia, dengan jeda pemrosesan NASA sekitar 1–3 jam setelah satelit lewat. Jadi angka bisa sama selama beberapa jam di antara lintasan satelit, dan itu normal.":"This page checks NASA FIRMS for new data every 15 minutes, and whenever you return to the tab. New hotspots appear each time a VIIRS satellite (S-NPP, NOAA-20, NOAA-21) passes, about six times a day over Indonesia, with 1–3 hours of NASA processing after each pass. So the numbers can stay the same for a few hours between passes — that is normal.",
"Kenapa ada wilayah yang tampil 0 padahal sedang terbakar?":"Why does an area show 0 while it is burning?","Satelit hanya melintas sekitar dua kali sehari (±13.30 dan ±01.30 waktu setempat). Awan atau asap tebal bisa menutupi api, dan api gambut sering membara di bawah permukaan sehingga tidak terdeteksi. Pilih rentang 3 atau 7 hari untuk melihat riwayat yang lebih lengkap.":"Each satellite passes only about twice a day (around 13:30 and 01:30 local time). Clouds or thick smoke can hide fires, and peat fires often smoulder underground where they are not detected. Choose 3 or 7 days to see a fuller history.",
"Kenapa angka 3 dan 7 hari disebut “lokasi api”?":"Why are 3- and 7-day counts called “fire locations”?","Satu kebakaran bisa terdeteksi berkali-kali oleh tiga satelit dalam sehari. Agar peta tetap ringan dan mudah dibaca, untuk rentang 3 dan 7 hari deteksi yang berjarak ±2 km pada hari yang sama digabung menjadi satu lokasi. Rentang 6 dan 24 jam menampilkan setiap deteksi.":"One fire can be detected many times by three satellites in a day. To keep the map light and readable, for 3 and 7 days detections within ±2 km on the same day are merged into one location. The 6- and 24-hour ranges show every detection.",
"Apa arti kekuatan api?":"What does fire intensity mean?","Diukur dari daya radiasi api (FRP) dalam megawatt. Kecil di bawah 5 MW, sedang 5–20 MW, besar 20–60 MW, dan sangat besar di atas 60 MW. Makin besar, biasanya makin luas atau makin panas apinya.":"It is measured as fire radiative power (FRP) in megawatts: small below 5 MW, medium 5–20 MW, large 20–60 MW and very large above 60 MW. Higher values usually mean a wider or hotter fire.",
"Apakah perusahaan di area konsesi pasti bersalah?":"Is a company with hotspots in its concession necessarily at fault?","Tidak. Peta hanya menunjukkan api terdeteksi di dalam batas izin perusahaan. Penyebab kebakaran ditentukan lewat penyelidikan resmi. Data batas sawit berasal dari 2012 dan HTI dari 2021, sehingga sebagian pemilik mungkin sudah berganti.":"No. The map only shows fire detected inside a company's permit boundary. The cause of a fire is determined by official investigation. Oil palm boundaries date from 2012 and timber plantations from 2021, so some owners may have changed.",
"Apakah lokasi saya disimpan?":"Is my location stored?","Tidak. Fitur “Dekat saya” menghitung jarak di perangkat Anda sendiri. Lokasi tidak dikirim ke server mana pun.":"No. “Near me” calculates distances on your own device. Your location is not sent to any server.",
"Pasang di HP & peringatan":"Install on your phone & alerts","Pasang Pantau Karhutla seperti aplikasi agar cepat dibuka, tetap tampil saat sinyal lemah, dan bisa memberi notifikasi titik api baru di sekitar lokasi yang Anda pantau.":"Install Pantau Karhutla like an app so it opens fast, still works on a weak signal, and can notify you of new hotspots near the place you watch.",
"Pasang aplikasi":"Install app","Sudah terpasang":"Already installed","Atur peringatan lokasi":"Set up location alerts",
"Bila tombol tidak bereaksi, buka menu browser (⋮) lalu pilih “Instal aplikasi” atau “Tambahkan ke layar utama”.":"If the button does nothing, open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.",
"Di iPhone/iPad: buka di Safari, ketuk tombol Bagikan, lalu pilih “Tambah ke Layar Utama”.":"On iPhone/iPad: open in Safari, tap Share, then choose “Add to Home Screen”.",
"Sematkan peta di situs Anda":"Embed the map on your site","Untuk media dan organisasi: tempelkan kode ini di halaman Anda. Peta selalu menampilkan data terbaru.":"For media and organisations: paste this code into your page. The map always shows the latest data.",
"Wilayah peta sematan":"Embedded map area","Seluruh Indonesia":"All of Indonesia","Provinsi terpilih":"Selected province","Salin kode":"Copy code","Lihat contoh ↗":"Preview ↗","Kode sematan disalin":"Embed code copied",
"Sumber data":"Data sources","— titik api VIIRS (S-NPP, NOAA-20, NOAA-21), diambil otomatis setiap 15 menit.":"— VIIRS hotspots (S-NPP, NOAA-20, NOAA-21), fetched automatically every 15 minutes.","— foto satelit harian.":"— daily satellite imagery.",
"— batas konsesi sawit (Kemenhut 2012) & HTI (KLHK 2021); nama grup dari":"— oil palm (Ministry of Forestry 2012) and timber plantation (Ministry of Environment & Forestry 2021) concession boundaries; group names from",
"Kemenkes RI — kasus ISPA; Ditjen Dukcapil — jumlah penduduk (rincian di tab Wilayah).":"Ministry of Health — ISPA cases; Civil Registry (Dukcapil) — population (details in the Regions tab).",
"— arah angin & prakiraan cuaca (model cuaca global, CC BY 4.0). Untuk peringatan resmi, lihat":"— wind and weather forecasts (global weather model, CC BY 4.0). For official warnings, see",
"— PM2.5 dari model":"— PM2.5 from the","(CC BY 4.0), dikategorikan dengan batas ISPU (Permen LHK No. 14/2020). Untuk ISPU resmi, lihat":"model (CC BY 4.0), categorised with ISPU thresholds (Minister of Environment Regulation 14/2020). For the official ISPU, see",
"Prakiraan bahaya kebakaran — indeks sederhana Pantau Karhutla dari hari tanpa hujan, kelembapan, suhu, dan angin (Open-Meteo). Bukan FDRS resmi; lihat":"Fire danger forecast — a simple Pantau Karhutla index from days without rain, humidity, temperature and wind (Open-Meteo). Not the official FDRS; see",
"— peta lahan gambut (Miettinen dkk. 2016, CC BY 4.0).":"— peatland map (Miettinen et al. 2016, CC BY 4.0).","Arsip NASA FIRMS VIIRS S-NPP (sejak 2015) — statistik tren di tab Tren.":"NASA FIRMS VIIRS S-NPP archive (since 2015) — trend statistics in the Trends tab.",
"Natural Earth — batas wilayah; Esri — peta dasar satelit, terrain & jalan.":"Natural Earth — boundaries; Esri — satellite, terrain & street basemaps.",
"Muat data sendiri":"Load your own data","Untuk peneliti atau jurnalis: muat file CSV dari":"For researchers or journalists: load a CSV file from","atau batas konsesi GeoJSON. File hanya dibaca di peramban Anda.":"or concession boundaries as GeoJSON. Files are only read in your browser.","Muat CSV FIRMS":"Load FIRMS CSV","Muat GeoJSON konsesi":"Load concession GeoJSON",
"Tutup":"Close","Buka":"Open","Kembali":"Back","Detail titik api":"Hotspot details","Keyakinan":"Confidence","deteksi satelit":"satellite detection","Sekitar 10 km":"Within 10 km","Di dalam area konsesi":"Inside a concession",
"Profil perusahaan & semua titik apinya →":"Company profile & all its hotspots →","Tidak berada di area konsesi perusahaan yang tercatat.":"Not inside any recorded company concession.","Foto satelit":"Satellite photo","(terbaru)":"(latest)",
"Foto hari sebelumnya":"Previous day's photo","‹ Sebelumnya":"‹ Previous","Foto hari berikutnya":"Next day's photo","Berikutnya ›":"Next ›",
"Area ±65 × 65 km berpusat di titik ini. Titik merah = api. Kalau tertutup awan, coba hari sebelumnya.":"An area of ±65 × 65 km centred on this hotspot. Red dots = fire. If it is cloudy, try an earlier day.",
"Angin & cuaca":"Wind & weather","Asap berpotensi terbawa ke arah":"Smoke is likely to drift","menuju":"towards",", menuju":", towards","dan":"and","Prakiraan 5 hari":"5-day forecast","basah":"wet","kering":"dry",
"Angin hampir tenang, asap cenderung mengendap di sekitar lokasi api.":"The wind is almost calm, so smoke tends to settle around the fire.","Memuat data angin dan cuaca…":"Loading wind and weather…",
"Data model cuaca Open-Meteo, bukan pengamatan stasiun. Untuk peringatan resmi, lihat":"Open-Meteo weather model data, not station observations. For official warnings, see",
"Kualitas udara di lokasi ini":"Air quality at this location","24 jam terakhir":"Last 24 hours","PM2.5 model CAMS (Open-Meteo), skala ISPU.":"PM2.5 from the CAMS model (Open-Meteo), ISPU scale.","Kualitas udara belum bisa dimuat.":"Air quality could not be loaded.",
"Bahaya kebakaran di sekitar lokasi":"Fire danger around this location","Bantuan terdekat":"Nearest help","Rumah sakit ↗":"Hospitals ↗","Puskesmas ↗":"Health centres ↗","Pemadam kebakaran ↗":"Fire stations ↗","Kantor BPBD ↗":"Disaster agency (BPBD) ↗","Darurat: telepon":"Emergency: call","atau pemadam kebakaran":"or the fire brigade",
"Di lahan gambut.":"On peatland.","Api gambut bisa membara di bawah permukaan selama berminggu-minggu dan menghasilkan asap tebal.":"Peat fires can smoulder underground for weeks and produce thick smoke.",
"Penduduk provinsi":"Province population","Koordinat":"Coordinates","Satelit":"Satellite","Bagikan titik ini":"Share this hotspot","Salin koordinat":"Copy coordinates","Buka di Google Maps":"Open in Google Maps","Koordinat disalin":"Coordinates copied",
"Profil perusahaan":"Company profile","Hutan tanaman industri":"Industrial timber plantation","Kebun sawit":"Oil palm plantation","Pemegang konsesi":"Concession holder","Luas konsesi":"Concession area","Deteksi terakhir":"Last detection","tidak ada":"none","Lihat di peta":"Show on map","Bagikan":"Share",
"Galeri & tautan":"Gallery & links","Situs resmi ↗":"Official website ↗","Foto kantor di Google Maps ↗":"Office photos on Google Maps ↗","Belum ada foto berlisensi bebas untuk perusahaan ini. Lihat foto kantor dan lokasinya lewat Google Maps.":"No freely licensed photos for this company yet. See office photos and location on Google Maps.",
"Izin konsesi":"Concession permits","Profil grup":"Group profile","Grup induk":"Parent group","Status":"Status","Pemilik":"Owners","menurut laporan publik":"according to public reports","Luas lahan grup":"Group land area","Sertifikasi":"Certification",
"Kebijakan nol deforestasi":"No-deforestation policy","Riwayat kebakaran":"Fire history","Catatan dari laporan publik":"Notes from public reports","Sumber profil":"Profile sources","Cek data resmi":"Check official records",
"Susunan direksi, komisaris, dan pemegang saham resmi tercatat di":"The official board of directors, commissioners and shareholders are registered in","Kementerian Hukum. Cari dengan nama perusahaan di atas.":"of the Ministry of Law. Search with the company name above.","Cari di AHU Online":"Search AHU Online",
"Penting:":"Important:","titik api di area konsesi tidak membuktikan perusahaan menjadi penyebab kebakaran. Data izin sawit berasal dari 2012 dan HTI dari 2021, sehingga pemegang izin bisa sudah berganti. Profil grup dirangkum dari laporan publik yang dicantumkan.":"a hotspot in a concession does not prove the company caused the fire. Oil palm permit data dates from 2012 and timber plantations from 2021, so the permit holder may have changed. Group profiles are summarised from the public reports listed.",
"Profil grup untuk perusahaan ini belum tersedia di data kami. Nama perusahaan berasal dari data izin pemerintah yang dipublikasikan Global Forest Watch.":"We do not have a group profile for this company yet. The company name comes from government permit data published by Global Forest Watch.",
"Perusahaan lain di grup ini dengan titik api":"Other companies in this group with hotspots","Titik api terbaru":"Latest hotspots","Tidak ada":"None","Tidak ada titik api pada saringan ini.":"No hotspots match this filter.","Tidak ada titik api yang cocok dengan saringan. Coba rentang waktu yang lebih panjang.":"No hotspots match the filter. Try a longer time range.","Tidak ada titik api di area konsesi pada rentang ini.":"No hotspots in concessions for this range.",
"Grup tidak tercatat":"Group not recorded","Swasta (tertutup)":"Private","Tbk / tercatat di bursa":"Listed company","BUMN":"State-owned","Swasta":"Private",
"Atur peringatan titik api":"Set up hotspot alerts","Kami memeriksa data baru setiap 15 menit. Bila ada titik api baru di area Anda, akan muncul notifikasi.":"We check for new data every 15 minutes. If a new hotspot appears in your area, you will get a notification.",
"Lokasi":"Location","Gunakan lokasi saya (GPS)":"Use my location (GPS)","Tengah peta saat ini":"Current map centre","… atau pilih kota/kabupaten":"… or choose a city/regency","Belum dipilih":"Not selected","Radius":"Radius","Kirim notifikasi di perangkat ini":"Send notifications on this device",
"Bekerja selama situs atau aplikasi terbuka (termasuk di tab latar belakang). Lokasi hanya disimpan di perangkat Anda.":"Works while the site or app is open (including in a background tab). Your location is only stored on your device.",
"Simpan":"Save","Batal":"Cancel","Ubah":"Edit","Hapus":"Delete","Mencari lokasi…":"Finding location…","Pilih lokasi dulu.":"Choose a location first.","Lokasi tidak bisa diakses. Pilih kota dari daftar.":"Location unavailable. Choose a city from the list.",
"Notifikasi aktif":"Notifications on","Notifikasi mati":"Notifications off","Area pantauan dihapus":"Watch area removed","Tidak ada titik api di area ini. Kami akan memberi tahu bila muncul.":"No hotspots in this area. We will let you know if any appear.",
"Gambar ringkasan":"Summary image","Bagikan":"Share","Unduh gambar":"Download image","Gambar mengikuti saringan yang sedang aktif (rentang waktu dan provinsi).":"The image follows the active filters (time range and province).","Data belum dimuat":"Data not loaded yet",
"Peta angin belum bisa dimuat. Coba lagi nanti.":"The wind map could not be loaded. Please try again later.","Kualitas udara belum bisa dimuat. Coba lagi nanti.":"Air quality could not be loaded. Please try again later.","Prakiraan bahaya belum bisa dimuat. Coba lagi nanti.":"The fire danger forecast could not be loaded. Please try again later.","Prakiraan belum bisa dimuat.":"Forecast could not be loaded.",
"Tidak ada data untuk lokasi ini.":"No data for this location.","Menghitung…":"Calculating…","Menghitung prakiraan bahaya kebakaran…":"Calculating fire danger forecast…","Memuat…":"Loading…",
"Tren titik api":"Hotspot trends","Seluruh Indonesia ":"All of Indonesia","File sendiri":"Own file","Tahun terparah":"Worst year","Per tahun":"Per year","deteksi satelit ":"satellite detections","Per bulan":"Per month","Konsesi dengan titik api terbanyak":"Concessions with the most hotspots","12 bulan terakhir":"last 12 months","Terbakar berulang":"Repeatedly burned",
"Konsesi dengan minimal 10 deteksi titik api dalam setahun, terjadi di 6 tahun atau lebih dari 10 tahun terakhir.":"Concessions with at least 10 hotspot detections in a year, in 6 or more of the last 10 years.","Riwayat titik api":"Hotspot history","per tahun":"per year","Memuat arsip…":"Loading archive…",
"Arsip tren belum bisa dimuat. Coba muat ulang halaman.":"The trend archive could not be loaded. Try reloading the page.","Pilih wilayah":"Choose area",
"Tidak ditemukan. Coba nama provinsi, kabupaten, atau perusahaan lain.":"Not found. Try another province, regency or company name.","Kabupaten":"Regency","Kota":"City",
"Klik untuk menyaring":"Click to filter","Klik untuk profil perusahaan":"Click for company profile","Asap hari ini":"Today's smoke","Peta gelap":"Dark map","Satelit + label":"Satellite + labels","Jalan":"Streets","Terrain":"Terrain",
"Di luar daratan Indonesia":"Outside Indonesia's land area","Di luar daratan":"Outside the land area","Tidak diketahui":"Unknown","Perusahaan tanpa nama":"Unnamed company","Lihat status data":"See data status","Data dari file":"Data from file",
"Izin lokasi ditolak. Aktifkan izin lokasi di peramban untuk memakai fitur ini.":"Location permission denied. Allow location access in your browser to use this feature.","Lokasi tidak bisa ditentukan. Coba lagi di tempat dengan sinyal lebih baik.":"Your location could not be determined. Try again somewhere with a better signal.","Peramban ini tidak mendukung lokasi.":"This browser does not support location.",
"Titik api di tautan ini sudah tidak ada di data terbaru.":"The hotspot in this link is no longer in the latest data.","Hapus semua":"Clear all","Tampilkan":"Show","Peta sudah disaring ke konsesi ini.":"The map is already filtered to this concession.",
"Crafted by":"Crafted by","Lahan gambut ":"Peatland","Hari prakiraan":"Forecast day","Ganti ke Bahasa Indonesia":"Ganti ke Bahasa Indonesia","Switch to English":"Switch to English",
"Rabu":"Wednesday","sumber:":"source:","Sumber:":"Source:","lintasan siang":"daytime pass","lintasan malam":"night-time pass","Gabungan":"Merged","titik api":"hotspots","titik":"hotspots","perusahaan":"companies"
};
/* ---------- patterns (numbers, names, dates inside sentences) ---------- */
const N="([\\d.,]+)";
const P=[
[new RegExp("^"+N+" titik api$"),"$1 hotspots"],[new RegExp("^"+N+" titik$"),"$1 hotspots"],[new RegExp("^\\("+N+" titik\\)\\.$"),"($1 hotspots)."],[new RegExp("^"+N+" titik lain$"),"$1 others"],
[/^terdeteksi di (.+?) dalam (.+?)\.( Terbanyak di)?( Ditampilkan sampai pukul (.+?)\.)?$/,(m,w,b,t,_,c)=>"detected "+(w.startsWith("konsesi ")?"in the concession of "+w.slice(8):"in "+w)+" in the "+wl(b)+"."+(t?" Most are in":"")+(c?" Shown up to "+c+".":"")],
[/^\((.+) lokasi\)\.$/,"($1 locations)."],[/^(.+) lokasi api$/,"$1 fire locations"],[/^\(gabungan (.+) deteksi satelit\)$/,"(merged from $1 satellite detections)"],[/^Ditampilkan sampai pukul (.+)\.$/,"Shown up to $1."],
[/^Tidak ada titik api di (.+?) dalam (.+?)\. Coba rentang 3 atau 7 hari\.$/,(m,w,b)=>"No hotspots "+(w.startsWith("konsesi ")?"in the concession of "+w.slice(8):"in "+w)+" in the "+wl(b)+". Try 3 or 7 days."],
[/^(.+) · lokasi$/,(m,a)=>T(a)+" · locations"],
[/^(.+) titik api VIIRS dalam (.+?)\. Halaman ini mengambil data baru otomatis setiap 15 menit; terakhir (.+?) \(pukul (.+?)\), berikutnya sekitar (\d+) menit lagi\. Deteksi satelit terbaru: (.+?)\. Satelit melintasi Indonesia sekitar pukul 12\.00–14\.00 dan 00\.00–02\.00 WIB\.$/,(m,a,b,c,d,e,f)=>a+" VIIRS hotspots in the "+wl(b)+". This page fetches new data automatically every 15 minutes; last "+c+" (at "+d+"), next in about "+e+" min. Latest satellite detection: "+f+". Satellites pass over Indonesia around 12:00–14:00 and 00:00–02:00 WIB."],
[/^Menampilkan arsip deteksi satelit$/,"Showing archived satellite detections"],[/^(\w+, \d+ \w+ \d{4}) pukul (.+?)\. (.*)$/,(m,a,b,c)=>a+" at "+b+". "+T(c)],
[/^Data live belum tersedia \((.+)\)\. Menampilkan arsip terakhir\.$/,"Live data not available yet ($1). Showing the latest archive."],
[/^\*Kasus ISPA terkait asap karhutla per provinsi per (.+?) \((.+?) kasus\); total terbaru (.+?) kasus per (.+?)\. Jambi belum dirinci\. Penduduk Kaltim termasuk Kaltara, Papua dan Papua Barat termasuk provinsi pemekaran\. Sumber:$/,"*Smoke-related ISPA cases by province as of $1 ($2 cases); latest total $3 cases as of $4. Jambi not broken down yet. East Kalimantan population includes North Kalimantan; Papua and West Papua include the newly split provinces. Sources:"],
[/^([\d.,]+) konsesi kebun sawit & HTI\.$/,"$1 oil palm & timber plantation concessions."],
[/^\(himpunan data\), termasuk laporan WALHI (\d+) “(.+)”$/,"(dataset), including WALHI's $1 report “$2”"],[/^\(himpunan data\)(.*)$/,"(dataset)$1"],
[/^Profil di IDX \((.+)\)$/,"Profile on IDX ($1)"],
[/^terdeteksi di Indonesia dalam (.+?)\. Terbanyak di$/,(m,a)=>"detected in Indonesia in the "+wl(a)+". Most are in"],
[/^Jumlah deteksi per (jam|\d+ jam) \(WIB\)$/,(m,a)=>"Detections per "+(a==="jam"?"hour":a.replace(" jam"," hours"))+" (WIB)"],[/^dalam (.+)$/,(m,a)=>"in the "+wl(a)],
[/^Batas wilayah: Natural Earth · Titik api: NASA FIRMS(.*)$/,(m,a)=>"Boundaries: Natural Earth · Hotspots: NASA FIRMS"+a.replace("Gambut:","Peat:").replace("dkk.","et al.")],
[/^terdeteksi di (.+?) dalam (.+?)\.?$/,(m,a,b)=>"detected in "+a+" in the "+wl(b)+"."],
[/^Terbanyak: (.+)$/,"Most: $1"],[/^Foto satelit: (.+)$/,"Satellite photo: $1"],[/^Foto satelit area titik api, (.+)$/,"Satellite photo of the hotspot area, $1"],
[new RegExp("^"+N+" perusahaan$"),"$1 companies"],[new RegExp("^"+N+" perusahaan · (.+)$"),(m,a,b)=>a+" companies · "+T(b)],[/^\+(\d+) perusahaan lain\. Cari nama perusahaan di kotak pencarian\.$/,"+$1 more companies. Search for a company name in the search box."],
[/^diperbarui (.+)$/,"updated $1"],[/^· diperbarui (.+)$/,(m,a)=>"· updated "+T(a)],[new RegExp("^"+N+" kota$"),"$1 cities"],[/^Semua (\d+) kota$/,"All $1 cities"],[/^Saran untuk status (.+)$/,(m,a)=>"Advice for “"+T(a.charAt(0).toUpperCase()+a.slice(1))+"”"],
[/^Di sekitar Anda \((.+)\): (.+) · (.+)$/,(m,a,b,c)=>"Near you ("+a+"): "+T(b)+" · "+c],
[/^Belum ada kota yang berstatus tidak sehat\. Kualitas udara terburuk di$/,"No city is at unhealthy level. The worst air quality is in"],
[/^(\d+) provinsi (tinggi|ekstrem)$/,(m,a,b)=>a+(a==="1"?" province ":" provinces ")+(b==="tinggi"?"at high":"at extreme")],[/^, (\d+) tinggi$/,", $1 high"],
[/^(Rendah|Sedang|Tinggi|Ekstrem) hari ini$/,(m,a)=>T(a)+" today"],[/^(Rendah|Sedang|Tinggi|Ekstrem) \(skor (\d+)\)$/,(m,a,b)=>T(a)+" (score "+b+")"],
[/^(Min|Sen|Sel|Rab|Kam|Jum|Sab)( \d+)?$/,(m,a,b)=>({Min:"Sun",Sen:"Mon",Sel:"Tue",Rab:"Wed",Kam:"Thu",Jum:"Fri",Sab:"Sat"}[a])+(b||"")],
[/^data per (.+)$/,"data as of $1"],[/^per (\d+ \w+ \d{4}) · Dukcapil$/,"as of $1 · Civil Registry"],[/^citra (.+)$/,"imagery $1"],[/^\(per (.+)\)$/,"(as of $1)"],[/^(.+) \(per (\d+ \w+ \d{4})\)$/,"$1 (as of $2)"],
[new RegExp("^(\\d+) provinsi terdampak · Kemenkes$"),"$1 provinces affected · Ministry of Health"],[new RegExp("^"+N+" balita$"),"$1 under-fives"],[new RegExp("^± "+N+"/hari$"),"± $1/day"],
[/^([\d]+),(\d) juta$/,"$1.$2 million"],[/^([\d]+),(\d) jt(.*)$/,(m,a,b,c)=>a+"."+b+" M"+T(c)],[/^ ?\(termasuk (.+)\)$/,(m,a)=>" (incl. "+a+")"],
[/^(.+) · (\d+) (jam|menit|hari) lalu$/,(m,a,b,c)=>T(a)+" · "+b+(c==="jam"?" h ago":c==="menit"?" min ago":" days ago")],
[/^(\d+) (jam|menit|hari) lalu(.*)$/,(m,b,c,r)=>b+(c==="jam"?" h ago":c==="menit"?" min ago":" days ago")+T(r)],[/^baru saja$/,"just now"],[/^(\d+)[,.](\d)rb$/,"$1.$2k"],[/^(\d+)rb$/,"$1k"],
[/^(\d+) jam terakhir$/,"last $1 hours"],[/^(\d+) hari terakhir$/,"last $1 days"],
[/^Menampilkan (\d+) dari (.+) titik\. Saring per provinsi atau pakai pencarian untuk mempersempit\.$/,"Showing $1 of $2 hotspots. Filter by province or use search to narrow it down."],
[/^(.+) · ± (\d+) km dari (.+)$/,"$1 · ± $2 km from $3"],[/^± (\d+) km dari (.+)$/,"± $1 km from $2"],[/^Koordinat (.+)$/,"Coordinates $1"],
[/^(\d+) jam lalu · (.+)$/,"$1 h ago · $2"],[/^Saat terdeteksi, (.+)$/,"At detection, $1"],
[/^Angin dari (.+?), (\d+) km\/jam \((.+)\)$/,(m,a,b,c)=>"Wind from the "+a+", "+b+" km/h ("+({"tenang":"calm","lemah":"light","sedang":"moderate","kencang":"strong","sangat kencang":"very strong"}[c]||c)+")"],
[/^Hembusan (\d+) km\/jam$/,"Gusts $1 km/h"],[/^Kelembapan (\d+)%$/,"Humidity $1%"],[/^(\d+)% hujan(.*)$/,(m,a,b)=>a+"% rain"+b],[/^Angin dominan dari (.+)$/,"Prevailing wind from the $1"],
[/^Angin dari (.+), (\d+) km\/jam$/,"Wind from the $1, $2 km/h"],[/^Angin dari (.+), (\d+) km\/jam(.*)$/,"Wind from the $1, $2 km/h$3"],
[/^(\w+) · lintasan (siang|malam)$/,(m,a,b)=>a+" · "+(b==="siang"?"daytime":"night-time")+" pass"],
[/^Gabungan (.+) deteksi satelit dalam ±2 km pada hari yang sama\. Waktu dan kekuatan diambil dari deteksi terkuat\.$/,"Merged from $1 satellite detections within ±2 km on the same day. Time and intensity are from the strongest detection."],
[/^± (\d+) km ke arah (.+) dari lokasi Anda\.$/,"± $1 km to the $2 of your location."],
[/^Hari ini: (\d+) hari tanpa hujan berarti, kelembapan minimum (\d+)%, suhu maks (\d+)°C\. Data sel ±100 km di sekitar titik\.$/,"Today: $1 days without significant rain, minimum humidity $2%, max temperature $3°C. Data for the ±100 km cell around the hotspot."],
[/^Hapus saringan (.+)$/,(m,a)=>"Remove filter "+T(a)],[/^Konsesi: (.+)$/,"Concession: $1"],[/^Provinsi: (.+)$/,"Province: $1"],[/^Keyakinan: (.+)$/,(m,a)=>"Confidence: "+({"tinggi saja":"high only","sedang ke atas":"nominal and up"}[a]||a)],[/^Sampai pukul (.+)$/,"Until $1"],[/^Sampai$/,"Until"],
[/^Logo (.+) · sumber: (.+)$/,"Logo of $1 · source: $2"],[/^Logo: (.+)$/,"Logo: $1"],[/^Logo (?!of )(.+)$/,"Logo of $1"],[/^Grup (.+)$/,(m,a)=>"Group "+a.replace(/ · /g," · ")],
[/^(\d+) area izin$/,(m,a)=>a+(a==="1"?" permit area":" permit areas")],[/^(\d+) area$/,(m,a)=>a+(a==="1"?" area":" areas")],[/^(\d+) foto$/,(m,a)=>a+(a==="1"?" photo":" photos")],[/^\+(\d+) area lain$/,"+$1 more areas"],
[/^(.+) ha total$/,"$1 ha total"],
[/^Foto dari Wikimedia Commons \(lisensi bebas\)\. Klik untuk melihat pemotret & lisensi\.( Foto menunjukkan grup\/induk, belum tentu kantor (.+)\.)?$/,(m,a,b)=>"Photos from Wikimedia Commons (free licences). Click to see the photographer & licence."+(b?" Photos show the group/parent, not necessarily the office of "+b+".":"")],
[/^Tidak ada titik api di konsesi (.+) dalam (.+)\. Coba rentang 3 atau 7 hari\.$/,(m,a,b)=>"No hotspots in "+a+"'s concession in the "+T(b)+". Try 3 or 7 days."],
[/^(.+) titik lain\. Peta sudah disaring ke konsesi ini\.$/,"$1 more hotspots. The map is already filtered to this concession."],
[/^(.+) · (Kebun sawit|Hutan tanaman industri)(.*)$/,(m,a,b,c)=>a+" · "+T(b)+c],[/^(Kebun sawit|Hutan tanaman industri) · (.+)$/,(m,a,b)=>T(a)+" · "+b.replace(/^Grup /,"Group ")],
[/^Sumber: Kementerian Kehutanan (\d+) via Global Forest Watch$/,"Source: Ministry of Forestry $1 via Global Forest Watch"],[/^Sumber: (.+)$/,"Source: $1"],
[/^(.+) 2021 via Global Forest Watch$/,"$1 2021 via Global Forest Watch"],
[/^(\d+) titik api dalam (\d+) km dari$/,"$1 hotspots within $2 km of"],[/^titik api dalam (\d+) km dari$/,"hotspots within $1 km of"],[/^\(24 jam terakhir\)$/,"(last 24 hours)"],[/^(\d+) baru$/,"$1 new"],
[/^± (\d+) km ke (.+)$/,"± $1 km to the $2"],[/^Saat ini: (.+)$/,"Current: $1"],[/^Dipilih: (.+)$/,"Selected: $1"],[/^(\d+) km$/,"$1 km"],
[/^Peringatan aktif untuk (.+)$/,"Alerts on for $1"],[/^Tersimpan\. Notifikasi diblokir browser; aktifkan di pengaturan situs\.$/,"Saved. Notifications are blocked by the browser; enable them in site settings."],
[/^Hanya (.+)$/,"Only $1"],[/^(.+) titik api diunduh$/,"$1 hotspots downloaded"],[/^(.+) titik api dimuat dari file$/,"$1 hotspots loaded from file"],
[/^(.+) titik api dalam radius 50 km dari (.+)$/,"$1 hotspots within 50 km of $2"],[/^(.+) titik api dalam radius 50 km$/,"$1 hotspots within 50 km"],[/^Tidak ada titik api dalam radius 50 km$/,"No hotspots within 50 km"],
[/^(.+) s\.d\. (\d+) (\w+)$/,"$1 to $2 $3"],[/^dibanding rata-rata periode sama (\d+)–(\d+)$/,"vs. the average for the same period in $1–$2"],[/^(.+) deteksi setahun$/,"$1 detections in a year"],
[/^Batang terang = (\d+) \(sampai (.+)\)\. Arahkan kursor untuk angka tiap tahun\.$/,"The bright bar is $1 (to $2). Hover for each year's figure."],
[/^Rata-rata (\d+)–(\d+)$/,"Average $1–$2"],[/^(\d+) \(kebakaran besar\)$/,"$1 (major fires)"],[/^(\d+) th$/,"$1 yrs"],
[/^Total (.+) deteksi satelit VIIRS di area konsesi ini sejak (\d+)\. Tahun terbanyak: (\d+)\.$/,"In total $1 VIIRS satellite detections in this concession since $2. Peak year: $3."],
[/^Tidak ada titik api tercatat di area konsesi ini sejak (\d+)\.$/,"No hotspots recorded in this concession since $1."],
[/^(\d+): (.+) deteksi(.*)$/,(m,a,b,c)=>a+": "+b+" detections"+c.replace("(s.d.","(to").replace("(berjalan)","(ongoing)")],
[/^berada di lahan gambut\. Api gambut bisa membara di bawah permukaan, sulit dipadamkan, dan menjadi sumber utama kabut asap\.$/,"are on peatland. Peat fires can smoulder underground, are hard to extinguish and are the main source of haze."],
[/^(.+) titik api \((\d+)%\)$/,"$1 hotspots ($2%)"],
[/^Hari ini$/,"Today"],[/^Hari ini (.*)$/,(m,a)=>"Today "+T(a)],[/^Besok (.*)$/,(m,a)=>"Tomorrow "+T(a)],
[/^Sumber: arsip NASA FIRMS/,null],
[/^Kalimantan|^Sumatera|^Sulawesi|^Jawa|^Papua|^Maluku|^Nusa Tenggara|^Bali|^Aceh|^Riau|^Jambi|^Bengkulu|^Lampung|^Banten|^Gorontalo|^DKI|^DI /,null]
];
const CTX=[[".compass",{U:"N",T:"E",S:"S",B:"W"}],[".rstrip,.rtab td.c",{R:"L",S:"M",T:"H",E:"E"}]];
function wl(a){const t=T(a);return t.charAt(0).toLowerCase()+t.slice(1)}
function T(s){
  if(!s)return s;
  const lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0],t=s.trim();if(!t)return s;
  if(Object.prototype.hasOwnProperty.call(D,t))return lead+D[t]+trail;
  for(const [re,rep] of P){if(re.test(t)){if(rep===null)return s;return lead+t.replace(re,rep)+trail}}
  if(/ · Grup /.test(t))return lead+t.replace(/ · Grup /g," · Group ")+trail;
  return s;
}
window.PK_T=T;
const DONE=new WeakMap();
function trText(n){
  const v=n.nodeValue;if(DONE.get(n)===v)return;
  const p=n.parentNode;if(!p||p.nodeName==="SCRIPT"||p.nodeName==="STYLE"||p.nodeName==="TEXTAREA")return;
  let out=null;const t=v.trim();
  if(t.length<=2&&p.closest){for(const [sel,map] of CTX){if(p.closest(sel)){if(map[t])out=v.replace(t,map[t]);break}}}
  if(out==null)out=T(v);
  DONE.set(n,out);if(out!==v)n.nodeValue=out;
}
const ATTRS=["placeholder","aria-label","title","alt"];
const ADONE=new WeakMap();
function trEl(el){if(!el.getAttribute)return;let m=ADONE.get(el);for(const a of ATTRS){const v=el.getAttribute(a);if(!v)continue;if(m&&m[a]===v)continue;const o=T(v);if(!m){m={};ADONE.set(el,m)}m[a]=o;if(o!==v)el.setAttribute(a,o)}}
function walk(root){
  if(root.nodeType===3){trText(root);return}
  if(root.nodeType!==1)return;
  if(root.nodeName==="SCRIPT"||root.nodeName==="STYLE")return;
  trEl(root);
  const it=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;
  while((n=it.nextNode())){if(n.nodeType===3)trText(n);else trEl(n)}
}
try{if(typeof DATA!=="undefined"&&DATA.length){update();renderSource()}}catch(e){}
walk(document.body);document.title=T(document.title);
const mo=new MutationObserver(list=>{for(const m of list){if(m.type==="characterData")trText(m.target);else if(m.type==="attributes")trEl(m.target);else m.addedNodes.forEach(walk)}});
mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
})();
