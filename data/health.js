// Data kependudukan & kesehatan. Diperbarui manual dari rilis resmi.
// Untuk memperbarui: ubah angka di bawah, lalu commit ke GitHub (Vercel otomatis deploy).
window.HEALTH_DATA = {
  checked: "2026-10-26",
  population: {
    total: 290125073, male: 146402289, female: 143722784, asOf: "2026-06-30",
    source: "Ditjen Dukcapil Kemendagri (Semester I 2026)",
    url: "https://cnnindonesia.com/nasional/20260804155627-20-1388524/dirjen-dukcapil-catat-penduduk-ri-capai-290-juta-jiwa-per-juni-2026",
    byProvince: {
      "Jawa Barat": 52211020, "Jawa Timur": 42226212, "Jawa Tengah": 38649532, "Sumatera Utara": 15762983,
      "Banten": 13173618, "DKI Jakarta": 10881514, "Sulawesi Selatan": 9632745, "Lampung": 9272142,
      "Sumatera Selatan": 9220462, "Riau": 7258888, "Sumatera Barat": 5887418, "Nusa Tenggara Barat": 5820781,
      "Nusa Tenggara Timur": 5804428, "Aceh": 5715781, "Kalimantan Barat": 5710902, "Bali": 4404281,
      "Kalimantan Selatan": 4355278, "Kalimantan Timur": 4194958, "Jambi": 3906041, "DI Yogyakarta": 3762541,
      "Sulawesi Tengah": 3272504, "Sulawesi Tenggara": 2876526, "Kalimantan Tengah": 2869076, "Sulawesi Utara": 2665200,
      "Kep. Riau": 2334574, "Bengkulu": 2155162, "Maluku": 1961977, "Kep. Bangka Belitung": 1570074,
      "Sulawesi Barat": 1484768, "Papua Pegunungan": 1481059, "Maluku Utara": 1426571, "Papua Tengah": 1384227,
      "Gorontalo": 1263405, "Papua": 1122097, "Kalimantan Utara": 786228, "Papua Barat Daya": 632788,
      "Papua Selatan": 588837, "Papua Barat": 588491
    },
    // Batas wilayah di peta masih 34 provinsi lama; provinsi pemekaran digabung ke induknya.
    mapGroups: {
      "Kalimantan Timur": ["Kalimantan Timur", "Kalimantan Utara"],
      "Papua": ["Papua", "Papua Pegunungan", "Papua Tengah", "Papua Selatan"],
      "Papua Barat": ["Papua Barat", "Papua Barat Daya"]
    }
  },
  ispa: {
    total: 333470, balita: 75172, daily: 4520, asOf: "2026-10-23",
    provinces: ["Kalimantan Barat", "Kalimantan Selatan", "Kalimantan Tengah", "Kalimantan Timur", "Sumatera Selatan", "Riau", "Jambi"],
    source: "Kemenkes RI (Direktorat Kesehatan Lingkungan)",
    url: "https://www.jawapos.com/kesehatan/2610230070/kemenkes-333470-kasus-ispa-di-7-wilayah-terdampak-karhutla-harian-4520-kasus",
    byProvince: {
      asOf: "2026-10-12", total: 277075,
      source: "Kemenkes RI (Biro Komunikasi dan Pelayanan Publik)",
      url: "https://www.jawapos.com/amp/kesehatan/2610130389/terdampak-karhutla-kalimantan-selatan-catat-kasus-ispa-tertinggi-hingga-73392-kasus",
      cases: {
        "Kalimantan Selatan": 73392, "Sumatera Selatan": 72335, "Kalimantan Barat": 52201,
        "Riau": 31285, "Kalimantan Tengah": 24101, "Kalimantan Timur": 23761
      }
    }
  }
};
