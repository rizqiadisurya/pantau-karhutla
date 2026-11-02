// Logo & foto perusahaan/grup. Logo: Wikimedia Commons/Wikipedia atau ikon situs resmi.
// Foto: Wikimedia Commons (lisensi bebas). Semua sudah dicek manual: hanya gambar yang benar-benar terkait.
(function(){
const C=f=>({src:"https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(f)+"?width=240",page:"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(f.replace(/ /g,"_")),by:"Wikimedia Commons"});
const W=f=>({src:"https://en.wikipedia.org/wiki/Special:FilePath/"+encodeURIComponent(f)+"?width=240",page:"https://en.wikipedia.org/wiki/File:"+encodeURIComponent(f),by:"Wikipedia"});
const I=d=>({src:"https://www.google.com/s2/favicons?domain="+d+"&sz=128",page:"https://"+d,by:"ikon situs resmi",icon:true});
const P=(f,cap)=>({f,cap});
const SINAR=[P("Plaza Sinar Mas - panoramio.jpg","Plaza Sinar Mas, Jakarta"),P("Sinar Mas Center, Shanghai.jpg","Sinar Mas Center, Shanghai")];
const APP={logo:C("Asia Pulp & Paper (APP) logo.svg"),logoOf:"Asia Pulp & Paper (APP)",web:"https://app.co.id",photos:[P("Pelabuhan PT Indah Kiat Pulp Papper.jpg","Pelabuhan pabrik PT Indah Kiat Pulp & Paper (APP)"),...SINAR]};
window.COMPANY_MEDIA={
 "gar-smart":{logo:C("Sinarmas-Logo.png"),logoOf:"Sinar Mas",web:"https://goldenagri.com.sg",photos:SINAR},
 "app-sinar-mas":APP,"arara-abadi":APP,"wirakarya-sakti":APP,"bumi-mekar-hijau":APP,"bumi-andalas-permai":APP,"finnantara-intiga":APP,
 "wilmar":{logo:C("Wilmar International Logo.svg"),logoOf:"Wilmar International",web:"https://www.wilmar-international.com"},
 "astra-agro-lestari":{logo:C("Logo of PT Astra International Tbk terbaru 2025.png"),logoOf:"Grup Astra",web:"https://www.astra-agro.co.id",photos:[P("Menara Astra.jpg","Menara Astra, Jakarta (kantor pusat Grup Astra)")]},
 "lonsum":{logo:I("londonsumatra.com"),logoOf:"Lonsum",web:"https://www.londonsumatra.com",photos:[P("Lonsum Medan building-01.jpg","Gedung Lonsum, Medan"),P("PT PP London Sumatra Indonesia.jpg","Kantor PT PP London Sumatra Indonesia, Medan"),P("Lonsum medan 1.jpg","Gedung Lonsum, Medan")]},
 "sd-guthrie-minamas":{logo:I("sdguthrie.com"),logoOf:"SD Guthrie",web:"https://www.sdguthrie.com"},
 "klk-indonesia":{logo:W("Kuala_Lumpur_Kepong_Berhad.svg"),logoOf:"Kuala Lumpur Kepong Berhad",web:"https://www.klk.com.my"},
 "musim-mas":{logo:W("Musim_Mas_Logo.png"),logoOf:"Musim Mas",web:"https://www.musimmas.com",photos:[P("PT.MUSIM MAS ESTATE 5 PANGKALAN LESUNG - panoramio.jpg","Kebun Musim Mas Estate 5, Pangkalan Lesung, Riau")]},
 "asian-agri-apical":{logo:W("AALogo.jpg"),logoOf:"Asian Agri",web:"https://www.asianagri.com"},
 "bumitama":{logo:I("bumitama-agri.com"),logoOf:"Bumitama Agri",web:"https://www.bumitama-agri.com"},
 "eagle-high":{logo:I("eaglehighplantations.com"),logoOf:"Eagle High Plantations",web:"https://www.eaglehighplantations.com"},
 "triputra-agro":{logo:I("tap-agri.com"),logoOf:"Triputra Agro Persada",web:"https://www.tap-agri.com"},
 "sawit-sumbermas":{logo:I("ssms.co.id"),logoOf:"Sawit Sumbermas Sarana",web:"https://www.ssms.co.id"},
 "cisadane-sawit-raya":{logo:I("csr.co.id"),logoOf:"Cisadane Sawit Raya",web:"https://www.csr.co.id"},
 "ptpn-iv-palmco":{logo:I("ptpn4.co.id"),logoOf:"PTPN IV",web:"https://www.ptpn4.co.id"},
 "genting-plantations":{logo:I("gentingplantations.com"),logoOf:"Genting Plantations",web:"https://www.gentingplantations.com"},
 "april-rapp":{logo:C("APRIL Group logo 2021.png"),logoOf:"APRIL Group",web:"https://www.aprilasia.com",photos:[P("Pabrikrapp-1.jpg","Pabrik RAPP di Pangkalan Kerinci, Riau")]},
 "toba-pulp-lestari":{logo:I("tobapulp.com"),logoOf:"Toba Pulp Lestari",web:"https://www.tobapulp.com",photos:[P("DIKELOLA TPL.jpg","Area yang dikelola TPL"),P("TPL DAN KEHUTANAN.jpg","Papan penanda TPL di area hutan")]},
 "sumitomo-forestry-wsl-mti":{logo:C("Sumitomo Forestry logo.svg"),logoOf:"Sumitomo Forestry",web:"https://sfc.jp",photos:[P("Sumitomo Forestry Tsukuba Labo.JPG","Laboratorium Sumitomo Forestry, Tsukuba, Jepang")]},
 "musi-hutan-persada":{logo:C("Marubeni Logo.svg"),logoOf:"Marubeni (induk MHP)",web:"https://www.marubeni.com",photos:[P("Marubeni Head Office Building.jpg","Kantor pusat Marubeni, Tokyo")]},
 "inhutani":{logo:I("perhutani.co.id"),logoOf:"Perum Perhutani",web:"https://www.perhutani.co.id",photos:[P("Kantor Perum Perhutani Kuningan.jpg","Kantor Perum Perhutani, Kuningan"),P("Kantor Perhutani Jombang-1.jpg","Kantor Perhutani, Jombang")]},
 "medco-selaras-inti-semesta":{logo:C("Logo MedcoEnergi.png"),logoOf:"Medco",web:"https://www.medcogroup.co.id",photos:[P("Gedung Perkantoran MEDCO - panoramio.jpg","Gedung perkantoran Medco, Jakarta")]}
};
window.COMPANY_MEDIA_C=C;
})();
