/* Pantau Karhutla — fitur tambahan:
   kualitas udara, bahaya kebakaran, lahan gambut, peringatan lokasi, kartu bagikan, CSV, embed, PWA, tren.
   Berjalan setelah skrip utama dan memakai fungsi/variabel globalnya (map, state, DATA, filtered, cv, dll). */
(function(){
"use strict";
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const params=new URLSearchParams(location.search);
const EMBED=params.get("embed")==="1";
const clamp=x=>Math.max(0,Math.min(1,x));
const DAYMS=864e5,WIB=7*3600e3;
const wibDay0=ms=>Math.floor((ms+WIB)/DAYMS)*DAYMS-WIB; // UTC ms of WIB midnight
const isoWib=ms=>new Date(ms+WIB).toISOString().slice(0,10);
const HARI3=["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
function dayLabel(k){if(k===0)return"Hari ini";if(k===1)return"Besok";const d=new Date(wibDay0(Date.now())+k*DAYMS+WIB);return HARI3[d.getUTCDay()]+" "+d.getUTCDate()}
function loading(on,txt){const ld=$("loading");if(on){$("loadingTxt").textContent=txt;ld.hidden=false}else ld.hidden=true}

/* ---------- modal ---------- */
let lastFocus=null;
function openModal(title,html){lastFocus=document.activeElement;$("mTitle").textContent=title;$("mBody").innerHTML=html;$("modal").hidden=false;setTimeout(()=>{const f=$("mBody").querySelector("button,select,input,a");(f||$("mClose")).focus()},30)}
function closeModal(){$("modal").hidden=true;$("mBody").innerHTML="";if(lastFocus&&lastFocus.focus)lastFocus.focus()}
$("mClose").onclick=closeModal;
$("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("modal").hidden){e.stopPropagation();closeModal()}},true);

/* =====================================================================
   1. KUALITAS UDARA (PM2.5, kategori ISPU)
   ===================================================================== */
const ISPU=[
 [15.5,"Baik","ispu1","Udara bersih. Aman beraktivitas di luar ruangan."],
 [55.4,"Sedang","ispu2","Balita, lansia, ibu hamil, dan penderita asma atau penyakit jantung sebaiknya mengurangi aktivitas berat di luar."],
 [150.4,"Tidak sehat","ispu3","Kelompok rentan hindari aktivitas di luar. Yang lain kurangi aktivitas berat dan pakai masker (N95/KN95 lebih baik dari masker kain)."],
 [250.4,"Sangat tidak sehat","ispu4","Semua orang sebaiknya tetap di dalam ruangan dengan jendela tertutup. Pakai masker N95 bila harus keluar."],
 [1e9,"Berbahaya","ispu5","Tetap di dalam ruangan tertutup. Kelompok rentan pertimbangkan pindah sementara ke tempat berudara bersih. Segera ke fasilitas kesehatan bila sesak napas."]];
function ispu(pm){if(pm==null||!isFinite(pm))return null;const i=ISPU.findIndex(x=>pm<=x[0]);return {i,lbl:ISPU[i][1],v:ISPU[i][2],tip:ISPU[i][3]}}
function qChip(q,txt){return q?'<span class="chip-q q-'+q.v+'">'+esc(txt||q.lbl)+'</span>':'<span class="chip-q" style="background:var(--line)">–</span>'}
function seriesAvg(tm,v,a,b){let s=0,n=0;for(let k=0;k<tm.length;k++)if(tm[k]>a&&tm[k]<=b&&v[k]!=null){s+=v[k];n++}return n?s/n:null}
function aqFromJson(p){
  const tm=p.hourly.time.map(s=>Date.parse(s+":00Z")),v=p.hourly.pm2_5,now=Date.now(),d0=wibDay0(now);
  const d=[seriesAvg(tm,v,now-DAYMS,now)];for(let k=1;k<=3;k++)d.push(seriesAvg(tm,v,d0+k*DAYMS-1,d0+(k+1)*DAYMS-1));
  let hi=-1,bd=1e15;tm.forEach((t,k)=>{const x=Math.abs(t-now);if(x<bd){bd=x;hi=k}});
  return {d,hour:hi>=0?v[hi]:null};
}
const AQ_URL=(lats,lons)=>"https://air-quality-api.open-meteo.com/v1/air-quality?latitude="+lats.join(",")+"&longitude="+lons.join(",")+"&hourly=pm2_5&past_days=1&forecast_days=4&timezone=GMT";
let AQ=null,aqP=null,airOn=false,airK=0;
function loadAQ(){
  if(AQ&&Date.now()-AQ.t<30*60e3)return Promise.resolve(AQ);if(aqP)return aqP;
  aqP=fetch(AQ_URL(TOWNS.map(t=>t[2].toFixed(2)),TOWNS.map(t=>t[3].toFixed(2)))).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
   .then(j=>{const arr=Array.isArray(j)?j:[j];AQ={t:Date.now(),pts:arr.map((p,i)=>Object.assign({t:TOWNS[i]},aqFromJson(p)))};aqP=null;return AQ})
   .catch(e=>{aqP=null;throw e});
  return aqP;
}
const AQ1=new Map();
function aqAt(lat,lon){const k=lat.toFixed(1)+","+lon.toFixed(1);const c=AQ1.get(k);if(c&&Date.now()-c.t<30*60e3)return c.p;
  const p=fetch(AQ_URL([lat.toFixed(2)],[lon.toFixed(2)])).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(j=>aqFromJson(Array.isArray(j)?j[0]:j)).catch(e=>{AQ1.delete(k);throw e});
  AQ1.set(k,{t:Date.now(),p});return p}
function fmtPm(x){return x==null?"–":Math.round(x)+" µg/m³"}
let aqShowAll=false;
function renderAir(){
  const box=$("airBox");if(!box)return;
  if(!AQ){box.innerHTML='<p class="hint">Memuat kualitas udara…</p>';return}
  const pts=AQ.pts.filter(p=>p.d[0]!=null);
  const sorted=pts.slice().sort((a,b)=>b.d[0]-a.d[0]);
  const bad=pts.filter(p=>ispu(p.d[0]).i>=2);
  const worst=sorted[0],wq=worst?ispu(worst.d[0]):null;
  let you="";
  if(state.user){const n=pts.map(p=>({p,k:km(state.user.lat,state.user.lon,p.t[2],p.t[3])})).sort((a,b)=>a.k-b.k)[0];
    if(n&&n.k<150){const q=ispu(n.p.d[0]);you='<div class="advice"><b>Di sekitar Anda ('+esc(n.p.t[0])+'): '+q.lbl+' · '+fmtPm(n.p.d[0])+'</b>'+esc(q.tip)+'</div>'}}
  const list=(aqShowAll?sorted:sorted.slice(0,6));
  box.innerHTML='<p class="lead" style="font-size:13px">'+(bad.length?'<b>'+bad.length+' kota</b> berstatus <b>tidak sehat</b> atau lebih buruk (rata-rata PM2.5 24 jam).':'Belum ada kota yang berstatus tidak sehat. Kualitas udara terburuk di <b>'+esc(worst?worst.t[0]:"–")+'</b>.')+'</p>'+you+
   '<div class="aqlist">'+list.map(p=>{const q=ispu(p.d[0]);return '<button type="button" class="aqrow" data-aq="'+p.t[2]+','+p.t[3]+'"><span><b>'+esc(p.t[0])+'</b><small>'+esc(p.t[1])+'</small></span><span class="pm">'+fmtPm(p.d[0])+'</span>'+qChip(q)+'</button>'}).join("")+'</div>'+
   (wq&&wq.i>=2&&!you?'<div class="advice"><b>Saran untuk status '+wq.lbl.toLowerCase()+'</b>'+esc(wq.tip)+'</div>':'')+
   '<div class="lnkrow" style="margin-top:10px"><button type="button" class="btn" id="aqMap">'+(airOn?"Sembunyikan dari peta":"Tampilkan di peta")+'</button><button type="button" class="btn" id="aqAll">'+(aqShowAll?"Ringkas":"Semua "+pts.length+" kota")+'</button></div>'+
   '<p class="caveat">PM2.5 dari model CAMS Copernicus (via Open-Meteo), dikelompokkan dengan batas ISPU. Ini perkiraan model, bukan alat ukur. Data resmi: <a href="https://ispu.kemenlh.go.id/" target="_blank" rel="noopener">ISPU KLH</a>.</p>';
  $("airAsOf").textContent="diperbarui "+fmtTime(AQ.t,7)+" WIB";
  $("aqMap").onclick=()=>setAir(!airOn);
  $("aqAll").onclick=()=>{aqShowAll=!aqShowAll;renderAir()};
}
$("airBox").addEventListener("click",e=>{const b=e.target.closest("[data-aq]");if(!b)return;const [la,lo]=b.dataset.aq.split(",").map(Number);if(!airOn)setAir(true);map.flyTo([la,lo],8,{duration:.8});if(innerWidth<=860)$("map").scrollIntoView({behavior:"smooth"})});
const airLayer=L.layerGroup();
function drawAir(){
  airLayer.clearLayers();if(!airOn||!AQ)return;
  AQ.pts.forEach(p=>{const v=p.d[airK];const q=ispu(v);if(!q)return;
    L.marker([p.t[2],p.t[3]],{keyboard:false,icon:L.divIcon({className:"",iconSize:[0,0],html:'<div class="aqm q-'+q.v+' '+q.v+'">'+Math.round(v)+'</div>'})})
     .bindTooltip('<b>'+esc(p.t[0])+'</b> · '+esc(p.t[1])+'<br>PM2.5 '+fmtPm(v)+' — <b>'+q.lbl+'</b><br><span style="color:var(--faint)">'+(airK===0?"Rata-rata 24 jam terakhir":"Prakiraan rata-rata "+(airK===1?"besok":"lusa"))+'</span>',{className:"ptip",direction:"top",offset:[0,-14]}).addTo(airLayer)});
}
function setAir(on){
  airOn=on;$("swAir").setAttribute("aria-checked",on);$("airCtl").hidden=!on;$("lgAir").hidden=!on;
  if(on){airLayer.addTo(map);loading(true,"Memuat kualitas udara…");loadAQ().then(()=>{drawAir();renderAir()}).catch(()=>toast("Kualitas udara belum bisa dimuat. Coba lagi nanti.")).finally(()=>loading(false))}
  else{map.removeLayer(airLayer)}
  if($("aqMap"))$("aqMap").textContent=on?"Sembunyikan dari peta":"Tampilkan di peta";
}
$("swAir").onclick=()=>setAir(!airOn);
document.querySelectorAll("[data-ak]").forEach(b=>b.onclick=()=>{airK=+b.dataset.ak;document.querySelectorAll("[data-ak]").forEach(x=>x.setAttribute("aria-pressed",x===b));drawAir()});

/* =====================================================================
   2. PRAKIRAAN BAHAYA KEBAKARAN
   Indeks sederhana: hari tanpa hujan (bobot 50), kelembapan minimum (25), suhu maksimum (10), angin (15);
   dikurangi bila hari itu hujan. Bukan FDRS resmi.
   ===================================================================== */
const FD=[[20,"Rendah","fd1"],[40,"Sedang","fd2"],[60,"Tinggi","fd3"],[1e9,"Ekstrem","fd4"]];
function fdOf(s){if(s==null)return null;const k=FD.findIndex(x=>s<x[0]);return {i:k,lbl:FD[k][1],v:FD[k][2],s}}
function riskScore(dsr,rh,tx,ws,pr){let s=Math.min(dsr,30)/30*50+clamp((75-rh)/45)*25+clamp((tx-28)/8)*10+clamp(ws/30)*15;if(pr>=10)s*=.25;else if(pr>=3)s*=.5;return Math.round(s)}
function riskPoints(){
  const P=[];for(let la=5.5;la>=-10.5;la-=1)for(let lo=95.5;lo<=140.5;lo+=1){const p=findProv(lo,la);if(p)P.push({lat:la,lon:lo,prov:p.name})}
  const have=new Set(P.map(p=>p.prov));
  [...new Set(PROV_SHAPES.map(s=>s.name))].forEach(name=>{if(have.has(name))return;const t=TOWNS.find(t=>{const q=findProv(t[3],t[2]);return q&&q.name===name});const s=PROV_SHAPES.find(x=>x.name===name);
    P.push({lat:t?t[2]:(s.b[1]+s.b[3])/2,lon:t?t[3]:(s.b[0]+s.b[2])/2,prov:name,small:true})});
  return P;
}
let RISK=null,riskP=null,riskOn=false,riskK=0;
function loadRisk(){
  if(RISK&&Date.now()-RISK.t<3*3600e3)return Promise.resolve(RISK);if(riskP)return riskP;
  const P=riskPoints();
  const url="https://api.open-meteo.com/v1/forecast?latitude="+P.map(p=>p.lat.toFixed(2)).join(",")+"&longitude="+P.map(p=>p.lon.toFixed(2)).join(",")+"&daily=precipitation_sum,relative_humidity_2m_min,temperature_2m_max,wind_speed_10m_max&past_days=30&forecast_days=7&timezone=Asia%2FJakarta";
  riskP=fetch(url).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(j=>{
    const arr=Array.isArray(j)?j:[j];const today=isoWib(Date.now());
    P.forEach((p,i)=>{const D=arr[i].daily;const i0=D.time.indexOf(today);let dsr=0;p.days=[];
      for(let k=0;k<D.time.length;k++){const pr=D.precipitation_sum[k]??0;dsr=pr>=3?0:dsr+1;
        if(k>=i0&&k<i0+7){const s=riskScore(dsr,D.relative_humidity_2m_min[k]??80,D.temperature_2m_max[k]??28,D.wind_speed_10m_max[k]??0,pr);p.days.push({s,dsr,rh:D.relative_humidity_2m_min[k],tx:D.temperature_2m_max[k],pr,ws:D.wind_speed_10m_max[k]})}}});
    const byProv={};P.forEach(p=>{(byProv[p.prov]||(byProv[p.prov]=[])).push(p)});
    const prov=Object.keys(byProv).map(name=>{const ps=byProv[name];const days=[0,1,2,3,4,5,6].map(k=>{const ss=ps.map(p=>p.days[k]?p.days[k].s:null).filter(x=>x!=null).sort((a,b)=>a-b);if(!ss.length)return null;return {max:ss[ss.length-1],p75:ss[Math.floor(ss.length*.75)]}});return {name,days,n:ps.length}});
    RISK={t:Date.now(),P,prov};riskP=null;return RISK}).catch(e=>{riskP=null;throw e});
  return riskP;
}
function provRiskVal(pr,k){const d=pr.days[k];return d?(pr.n>=3?d.p75:d.max):null}
function riskStrip(vals){return '<div class="rdays">'+vals.map((_,k)=>'<span>'+(k===0?"Hr ini":k===1?"Besok":dayLabel(k).split(" ")[0])+'</span>').join("")+'</div><div class="rstrip">'+vals.map(v=>{const f=fdOf(v);return f?'<span class="q-'+f.v+' '+f.v+'" title="'+f.lbl+' (skor '+v+')">'+f.lbl[0]+'</span>':'<span style="background:var(--line)"></span>'}).join("")+'</div>'}
function renderRisk(){
  const box=$("riskBox"),pbox=$("riskProv");if(!box)return;
  if(!RISK){box.innerHTML='<p class="hint">Menghitung prakiraan bahaya kebakaran…</p>';if(pbox)pbox.innerHTML='<p class="hint">Menghitung…</p>';return}
  const pr=RISK.prov.slice().sort((a,b)=>(provRiskVal(b,0)||0)-(provRiskVal(a,0)||0));
  const cnt=k=>{const c=[0,0,0,0];pr.forEach(p=>{const f=fdOf(provRiskVal(p,k));if(f)c[f.i]++});return c};
  const c0=cnt(0),c1=cnt(1);
  const sent=c=>c[3]?'<b>'+c[3]+' provinsi ekstrem</b>'+(c[2]?', '+c[2]+' tinggi':''):c[2]?'<b>'+c[2]+' provinsi tinggi</b>':'tidak ada provinsi berstatus tinggi';
  box.innerHTML='<p class="lead" style="font-size:13px">Hari ini '+sent(c0)+'. Besok '+sent(c1)+'.</p>'+
   '<div class="aqlist">'+pr.slice(0,5).map(p=>'<button type="button" class="aqrow" data-rprov="'+esc(p.name)+'" style="grid-template-columns:minmax(0,1fr) 150px"><span><b>'+esc(p.name)+'</b><small>'+fdOf(provRiskVal(p,0)).lbl+' hari ini</small></span>'+riskStrip(p.days.map((_,k)=>provRiskVal(p,k)))+'</button>').join("")+'</div>'+
   '<div class="lnkrow" style="margin-top:10px"><button type="button" class="btn" id="rkMap">'+(riskOn?"Sembunyikan dari peta":"Tampilkan di peta")+'</button><button type="button" class="btn" data-go="wilayah">Semua provinsi →</button></div>'+
   '<p class="caveat">Indeks sederhana dari jumlah hari tanpa hujan, kelembapan, suhu, dan angin (model cuaca Open-Meteo). Lahan gambut kering bisa terbakar meski indeks sedang. Bukan peringatan resmi; lihat <a href="https://www.bmkg.go.id/" target="_blank" rel="noopener">BMKG</a>.</p>';
  $("rkMap").onclick=()=>setRisk(!riskOn);
  if(pbox)pbox.innerHTML='<div class="tscroll"><table class="rtab"><thead><tr><th>Provinsi</th>'+[0,1,2,3,4,5,6].map(k=>'<th style="text-align:center">'+(k===0?"Hari ini":k===1?"Besok":dayLabel(k))+'</th>').join("")+'</tr></thead><tbody>'+
    pr.map(p=>'<tr data-prov="'+esc(p.name)+'" tabindex="0"><td>'+esc(p.name)+'</td>'+p.days.map((_,k)=>{const v=provRiskVal(p,k),f=fdOf(v);return '<td class="c">'+(f?'<span class="q-'+f.v+' '+f.v+'" title="'+f.lbl+' (skor '+v+')">'+f.lbl[0]+'</span>':'')+'</td>'}).join("")+'</tr>').join("")+'</tbody></table></div>'+
    '<p class="caveat">R = rendah, S = sedang, T = tinggi, E = ekstrem. Nilai provinsi = kondisi di 25% wilayah terkeringnya. Klik provinsi untuk menyaring peta.</p>';
}
$("riskBox").addEventListener("click",e=>{const b=e.target.closest("[data-rprov]");if(b){toggleProv(b.dataset.rprov,false);if(!riskOn)setRisk(true)}});
$("riskProv").addEventListener("click",e=>{const r=e.target.closest("tr[data-prov]");if(r){toggleProv(r.dataset.prov,false);if(innerWidth<=860)$("map").scrollIntoView({behavior:"smooth"})}});
const riskLayer=L.layerGroup();
function drawRisk(){
  riskLayer.clearLayers();if(!riskOn||!RISK)return;
  RISK.P.forEach(p=>{const d=p.days[riskK];if(!d)return;const f=fdOf(d.s);const col=cv("--"+f.v);
    const tip='<b>'+esc(p.prov)+'</b><br>Bahaya <b>'+f.lbl.toLowerCase()+'</b> (skor '+d.s+') · '+dayLabel(riskK).toLowerCase()+'<br>'+d.dsr+' hari tanpa hujan · kelembapan min '+Math.round(d.rh)+'% · suhu maks '+Math.round(d.tx)+'°C';
    const lay=p.small?L.circleMarker([p.lat,p.lon],{radius:9,stroke:false,fillColor:col,fillOpacity:.55}):L.rectangle([[p.lat-.5,p.lon-.5],[p.lat+.5,p.lon+.5]],{stroke:false,fillColor:col,fillOpacity:.32,interactive:true});
    lay.bindTooltip(tip,{className:"ptip",sticky:true}).addTo(riskLayer)});
}
function buildRiskCtl(){const c=$("riskCtl");c.innerHTML='<span class="lbl">Bahaya</span>'+[0,1,2,3,4,5,6].map(k=>'<button type="button" data-rk="'+k+'" aria-pressed="'+(k===riskK)+'">'+dayLabel(k)+'</button>').join("");
  c.querySelectorAll("[data-rk]").forEach(b=>b.onclick=()=>{riskK=+b.dataset.rk;c.querySelectorAll("[data-rk]").forEach(x=>x.setAttribute("aria-pressed",x===b));drawRisk()})}
function setRisk(on){
  riskOn=on;$("swRisk").setAttribute("aria-checked",on);$("riskCtl").hidden=!on;$("lgRisk").hidden=!on;
  if(on){buildRiskCtl();riskLayer.addTo(map);loading(true,"Menghitung bahaya kebakaran…");loadRisk().then(()=>{drawRisk();renderRisk()}).catch(()=>toast("Prakiraan bahaya belum bisa dimuat. Coba lagi nanti.")).finally(()=>loading(false))}
  else map.removeLayer(riskLayer);
  if($("rkMap"))$("rkMap").textContent=on?"Sembunyikan dari peta":"Tampilkan di peta";
}
$("swRisk").onclick=()=>setRisk(!riskOn);
function riskNear(lat,lon){if(!RISK)return null;let b=null,bd=1e9;RISK.P.forEach(p=>{const k=km(lat,lon,p.lat,p.lon);if(k<bd){bd=k;b=p}});return bd<120?b:null}

/* =====================================================================
   3. LAHAN GAMBUT (tile GFW, dibaca per piksel untuk menandai titik api)
   ===================================================================== */
const PEAT_URL="https://tiles.globalforestwatch.org/gfw_peatlands/v20230315/default/{z}/{x}/{y}.png";
const peatLayer=L.tileLayer(PEAT_URL,{pane:"peat",opacity:.6,maxNativeZoom:12,maxZoom:12,attribution:"Gambut: Miettinen dkk. 2016 / GFW"});
let peatOn=false;const PT=new Map(),PZ=8;
function tileXY(lat,lon,z){const n=2**z,x=(lon+180)/360*n,r=lat*Math.PI/180,y=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n;return [Math.floor(x),Math.floor(y),Math.floor((x%1)*256),Math.floor((y%1)*256)]}
function peatTile(x,y){const k=x+"/"+y;if(PT.has(k))return PT.get(k);
  const p=fetch(PEAT_URL.replace("{z}",PZ).replace("{x}",x).replace("{y}",y)).then(r=>{if(r.status===404)return null;if(!r.ok)throw new Error("HTTP "+r.status);return r.blob()}).then(async b=>{if(!b)return null;const bm=await createImageBitmap(b);const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d");g.drawImage(bm,0,0);const d=g.getImageData(0,0,256,256).data;const a=new Uint8Array(65536);for(let i=0;i<65536;i++)a[i]=d[i*4+3];return a}).catch(()=>{PT.delete(k);return undefined});
  PT.set(k,p);return p}
async function isPeat(lat,lon){const [x,y,px,py]=tileXY(lat,lon,PZ);const a=await peatTile(x,y);if(a===undefined)return undefined;if(!a)return false;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=Math.min(255,Math.max(0,px+dx)),Y=Math.min(255,Math.max(0,py+dy));if(a[Y*256+X]>100)return true}return false}
let peatBusy=false;
async function tagPeat(){
  if(peatBusy)return;peatBusy=true;
  try{const todo=DATA.filter(d=>d.peat===undefined);
    const byT=new Map();todo.forEach(d=>{const [x,y]=tileXY(d.lat,d.lon,PZ);const k=x+"/"+y;(byT.get(k)||byT.set(k,[]).get(k)).push(d)});
    const keys=[...byT.keys()];let i=0;
    if(keys.length>4)loading(true,"Memeriksa lahan gambut…");
    async function w(){while(i<keys.length){const k=keys[i++];for(const d of byT.get(k)){const v=await isPeat(d.lat,d.lon);if(v!==undefined)d.peat=v}}}
    await Promise.all([w(),w(),w(),w(),w(),w()]);
  }finally{peatBusy=false;loading(false)}
  renderPeatLine();
}
function renderPeatLine(){
  let el=$("peatLine");
  if(!peatOn){if(el)el.remove();return}
  if(!el){el=document.createElement("p");el.id="peatLine";el.className="peatline";const st=document.querySelector("#p-ringkasan .stats");st.after(el)}
  const list=filtered();const known=list.filter(d=>d.peat!==undefined),pe=known.filter(d=>d.peat);
  el.innerHTML=known.length?'<b>'+fmtNum(pe.length)+' titik api ('+Math.round(pe.length/Math.max(1,known.length)*100)+'%)</b> berada di lahan gambut. Api gambut bisa membara di bawah permukaan, sulit dipadamkan, dan menjadi sumber utama kabut asap.':'Memeriksa lahan gambut…';
}
function setPeat(on){peatOn=on;$("swPeat").setAttribute("aria-checked",on);$("lgPeat").hidden=!on;if(on){peatLayer.addTo(map);tagPeat()}else map.removeLayer(peatLayer);renderPeatLine()}
$("swPeat").onclick=()=>setPeat(!peatOn);

/* =====================================================================
   4. PERINGATAN LOKASI (disimpan di perangkat; notifikasi browser)
   ===================================================================== */
let WATCH=LS.get("pk_watch",null);
const watchLayer=L.layerGroup().addTo(map);
function inWatch(d){return WATCH&&km(WATCH.lat,WATCH.lon,d.lat,d.lon)<=WATCH.r}
function hotKey(d){return d.lat.toFixed(3)+","+d.lon.toFixed(3)+","+d.ms}
function drawWatch(){watchLayer.clearLayers();$("lgWatch").hidden=!WATCH;if(!WATCH)return;
  L.circle([WATCH.lat,WATCH.lon],{radius:WATCH.r*1000,color:cv("--accent"),weight:1.5,dashArray:"6 5",fill:true,fillOpacity:.04,interactive:false}).addTo(watchLayer);
  L.circleMarker([WATCH.lat,WATCH.lon],{radius:4,color:cv("--accent"),weight:2,fillColor:cv("--panel"),fillOpacity:1,interactive:false}).addTo(watchLayer)}
function watchHits(){if(!WATCH)return[];const since=Date.now()-DAYMS;return DATA.filter(d=>d.ms>since&&inWatch(d)).sort((a,b)=>b.ms-a.ms)}
function renderWatch(){
  const el=$("watchSec");if(!el)return;
  if(!WATCH){el.innerHTML='<h2>Peringatan di sekitar Anda</h2><p class="lead" style="font-size:13px">Pilih lokasi dan radius, lalu dapatkan notifikasi saat ada titik api baru di sekitarnya.</p><div class="lnkrow"><button type="button" class="btn primary" id="watchBtn">Atur peringatan</button></div>';$("watchBtn").onclick=openWatch;return}
  const hits=watchHits(),nw=hits.filter(d=>WATCH.fresh&&WATCH.fresh.includes(hotKey(d)));
  el.innerHTML='<div class="watchcard"><div class="wh"><h2>Area pantauan Anda</h2><small style="color:var(--faint)">'+(WATCH.notify&&"Notification" in window&&Notification.permission==="granted"?"Notifikasi aktif":"Notifikasi mati")+'</small></div>'+
   '<div><span class="big'+(hits.length?" hot":"")+'">'+fmtNum(hits.length)+'</span> titik api dalam '+WATCH.r+' km dari <b>'+esc(WATCH.label)+'</b> (24 jam terakhir)'+(nw.length?'<span class="newpill">'+nw.length+' baru</span>':'')+'</div>'+
   (hits.length?'<div class="list">'+hits.slice(0,3).map(d=>'<button type="button" class="item" data-id="'+d.id+'"><span class="sw" style="background:'+frpColor(d.frp)+'"></span><span class="w"><b>'+esc(placeName(d))+'</b><span>± '+Math.round(km(WATCH.lat,WATCH.lon,d.lat,d.lon))+' km ke '+arah(bearing(WATCH.lat,WATCH.lon,d.lat,d.lon))+'</span></span><span class="r"><span class="tm">'+fmtTime(d.ms,d.off)+' '+d.zn+'</span><span class="ago">'+relNow(d.ms)+'</span></span></button>').join("")+'</div>':'<p class="hint">Tidak ada titik api di area ini. Kami akan memberi tahu bila muncul.</p>')+
   '<div class="lnkrow"><button type="button" class="btn" id="watchMap">Lihat di peta</button><button type="button" class="btn" id="watchEdit">Ubah</button><button type="button" class="btn" id="watchDel">Hapus</button></div></div>';
  $("watchMap").onclick=()=>{map.flyTo([WATCH.lat,WATCH.lon],WATCH.r<=10?11:WATCH.r<=25?10:WATCH.r<=50?9:8,{duration:.8});if(innerWidth<=860)$("map").scrollIntoView({behavior:"smooth"})};
  $("watchEdit").onclick=openWatch;
  $("watchDel").onclick=()=>{WATCH=null;LS.del("pk_watch");drawWatch();renderWatch();toast("Area pantauan dihapus")};
}
function openWatch(){
  const towns=TOWNS.slice().sort((a,b)=>a[0].localeCompare(b[0],"id"));
  const cur=WATCH||{r:25,notify:true};
  openModal("Atur peringatan titik api",
   '<p class="lead" style="font-size:13px;margin:0">Kami memeriksa data baru setiap 15 menit. Bila ada titik api baru di area Anda, akan muncul notifikasi.</p>'+
   '<div class="fld"><span>Lokasi</span><div class="lnkrow" style="margin:0"><button type="button" class="btn" id="wGps">Gunakan lokasi saya (GPS)</button><button type="button" class="btn" id="wCenter">Tengah peta saat ini</button></div>'+
   '<select id="wTown"><option value="">… atau pilih kota/kabupaten</option>'+towns.map((t,i)=>'<option value="'+t[2]+','+t[3]+'|'+esc(t[0])+'">'+esc(t[0])+' — '+esc(t[1])+'</option>').join("")+'</select><small id="wPicked" style="color:var(--muted)">'+(WATCH?"Saat ini: "+esc(WATCH.label):"Belum dipilih")+'</small></div>'+
   '<div class="fld"><span>Radius</span><select id="wR">'+[10,25,50,100].map(r=>'<option value="'+r+'"'+(r===cur.r?" selected":"")+'>'+r+' km</option>').join("")+'</select></div>'+
   '<label class="chk"><input type="checkbox" id="wNotif"'+(cur.notify?" checked":"")+'><span>Kirim notifikasi di perangkat ini<br><small style="color:var(--faint)">Bekerja selama situs atau aplikasi terbuka (termasuk di tab latar belakang). Lokasi hanya disimpan di perangkat Anda.</small></span></label>'+
   '<div class="actions" style="grid-template-columns:1fr 1fr"><button type="button" class="btn primary" id="wSave">Simpan</button><button type="button" class="btn" id="wCancel">Batal</button></div>');
  let pick=WATCH?{lat:WATCH.lat,lon:WATCH.lon,label:WATCH.label}:null;
  const setPick=(p)=>{pick=p;$("wPicked").textContent="Dipilih: "+p.label};
  $("wGps").onclick=()=>{if(!navigator.geolocation){toast("Perangkat tidak mendukung GPS");return}$("wPicked").textContent="Mencari lokasi…";navigator.geolocation.getCurrentPosition(pos=>{const la=pos.coords.latitude,lo=pos.coords.longitude;const nt=nearestTown(la,lo);setPick({lat:la,lon:lo,label:"Lokasi saya"+(nt.d<60?" (dekat "+nt.t[0]+")":"")})},()=>{$("wPicked").textContent="Lokasi tidak bisa diakses. Pilih kota dari daftar."},{enableHighAccuracy:false,timeout:10000})};
  $("wCenter").onclick=()=>{const c=map.getCenter();const nt=nearestTown(c.lat,c.lng);setPick({lat:c.lat,lon:c.lng,label:nt.d<40?"Sekitar "+nt.t[0]:"Titik "+c.lat.toFixed(2)+", "+c.lng.toFixed(2)})};
  $("wTown").onchange=e=>{if(!e.target.value)return;const [ll,nm]=e.target.value.split("|");const [la,lo]=ll.split(",").map(Number);setPick({lat:la,lon:lo,label:nm})};
  $("wCancel").onclick=closeModal;
  $("wSave").onclick=async()=>{
    if(!pick){$("wPicked").textContent="Pilih lokasi dulu.";return}
    const notify=$("wNotif").checked;
    if(notify&&"Notification" in window&&Notification.permission==="default"){try{await Notification.requestPermission()}catch(e){}}
    WATCH={lat:pick.lat,lon:pick.lon,label:pick.label,r:+$("wR").value,notify,seen:[],fresh:[]};
    WATCH.seen=watchHits().map(hotKey);LS.set("pk_watch",WATCH);
    closeModal();drawWatch();renderWatch();
    toast(notify&&"Notification" in window&&Notification.permission==="denied"?"Tersimpan. Notifikasi diblokir browser; aktifkan di pengaturan situs.":"Peringatan aktif untuk "+WATCH.label);
  };
}
$("watchBtn2").onclick=openWatch;
async function notify(title,body,url){
  try{if(!("Notification" in window)||Notification.permission!=="granted")return;
    const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
    const opt={body,icon:"/icon-192.png",badge:"/favicon-32.png",tag:"pk-watch",renotify:true,data:{url}};
    if(reg&&reg.showNotification)reg.showNotification(title,opt);else new Notification(title,opt)}catch(e){}
}
function checkWatch(){
  if(!WATCH||!SOURCE.live)return;
  const hits=watchHits(),keys=hits.map(hotKey),seen=new Set(WATCH.seen||[]);
  const nw=hits.filter(d=>!seen.has(hotKey(d)));
  WATCH.seen=keys;WATCH.fresh=nw.length?nw.map(hotKey):(WATCH.fresh||[]).filter(k=>keys.includes(k));LS.set("pk_watch",WATCH);
  if(nw.length&&WATCH.notify){const d=nw[0];notify(nw.length+" titik api baru dekat "+WATCH.label,(nw.length>1?"Terdekat: ":"")+placeName(d)+", ± "+Math.round(km(WATCH.lat,WATCH.lon,d.lat,d.lon))+" km, pukul "+fmtTime(d.ms,d.off)+" "+d.zn+".",location.origin+"/?titik="+d.lat.toFixed(4)+","+d.lon.toFixed(4))}
  renderWatch();
}

/* =====================================================================
   5. KARTU BAGIKAN (gambar ringkasan)
   ===================================================================== */
async function makeCard(){
  try{await document.fonts.load('800 60px "Plus Jakarta Sans"');await document.fonts.load('500 30px "Plus Jakarta Sans"')}catch(e){}
  const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  const F=(w,s)=>w+" "+s+'px "Plus Jakarta Sans", system-ui, sans-serif';
  const col=n=>cv(n);
  g.fillStyle=col("--sea");g.fillRect(0,0,W,H);
  const list=filtered();
  // header
  g.fillStyle=col("--fg");g.font=F(800,44);g.textBaseline="top";g.fillText("PANTAU",64,64);const pw=g.measureText("PANTAU ").width;g.fillStyle=col("--accent");g.fillText("KARHUTLA",64+pw,64);
  g.fillStyle=col("--muted");g.font=F(500,28);g.fillText(fmtDate(Date.now(),7)+" · "+fmtTime(Date.now(),7)+" WIB",64,122);
  // big number
  g.fillStyle=col("--fg");g.font=F(800,150);g.fillText(fmtNum(list.length),60,175);
  g.fillStyle=col("--muted");g.font=F(500,34);g.fillText("titik api terdeteksi "+(state.comp?"di konsesi "+(state.comp.length>34?state.comp.slice(0,33)+"…":state.comp):"di "+(state.prov||"Indonesia")),64,340);g.fillText("dalam "+winLabel(state.win),64,382);
  // map
  const box={x:40,y:450,w:1000,h:430};const b=state.prov?(PROV_SHAPES.filter(s=>s.name===state.prov).reduce((a,s)=>[Math.min(a[0],s.b[0]),Math.min(a[1],s.b[1]),Math.max(a[2],s.b[2]),Math.max(a[3],s.b[3])],[180,90,-180,-90])):[95,-11,141.2,6];
  const sc=Math.min(box.w/(b[2]-b[0]),box.h/(b[3]-b[1]));const ox=box.x+(box.w-(b[2]-b[0])*sc)/2,oy=box.y+(box.h-(b[3]-b[1])*sc)/2;
  const P=(lon,lat)=>[ox+(lon-b[0])*sc,oy+(b[3]-lat)*sc];
  g.save();g.beginPath();g.rect(box.x,box.y,box.w,box.h);g.clip();
  g.fillStyle=col("--land");g.strokeStyle=col("--prov-line");g.lineWidth=1;
  IDN.features.forEach(f=>{const gm=f.geometry;const polys=gm.type==="Polygon"?[gm.coordinates]:gm.coordinates;polys.forEach(poly=>{g.beginPath();poly.forEach(ring=>{ring.forEach(([x,y],i)=>{const [px,py]=P(x,y);i?g.lineTo(px,py):g.moveTo(px,py)});g.closePath()});g.fill("evenodd");g.stroke()})});
  const rr=state.prov?5:3.2;list.slice().sort((a,b)=>a.frp-b.frp).forEach(d=>{const [px,py]=P(d.lon,d.lat);g.beginPath();g.arc(px,py,rr,0,Math.PI*2);g.fillStyle=frpHex(d.frp);g.globalAlpha=.9;g.fill()});g.globalAlpha=1;
  g.restore();
  // top provinces
  const by={};list.forEach(d=>{if(d.prov)by[d.prov]=(by[d.prov]||0)+1});const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,state.prov?0:5);
  let y=915;
  if(top.length){g.fillStyle=col("--faint");g.font=F(700,24);g.fillText("TERBANYAK DI",64,y);y+=42;const mx=top[0][1];
    top.forEach(([n,v])=>{g.fillStyle=col("--fg");g.font=F(600,30);g.fillText(n,64,y);g.textAlign="right";g.fillText(fmtNum(v),1016,y);g.textAlign="left";
      g.fillStyle=col("--line");g.fillRect(64,y+40,952,8);g.fillStyle=col("--accent");g.fillRect(64,y+40,952*v/mx,8);y+=66})}
  else{const conc=list.filter(d=>d.conc).length;g.fillStyle=col("--fg");g.font=F(600,32);g.fillText(fmtNum(conc)+" titik di area konsesi perusahaan",64,y+10);
    const big=list.slice().sort((a,b)=>b.frp-a.frp)[0];if(big){g.fillText("Api terbesar: "+Math.round(big.frp)+" MW di "+placeName(big),64,y+60)}}
  // footer
  g.fillStyle=col("--line");g.fillRect(64,H-110,952,2);
  g.fillStyle=col("--muted");g.font=F(500,26);g.fillText("pantau-karhutla.vercel.app",64,H-84);g.textAlign="right";g.fillText("Data: NASA FIRMS",1016,H-84);g.textAlign="left";
  return new Promise(res=>c.toBlob(b=>res(b),"image/png"));
}
async function openCard(){
  if(!DATA.length){toast("Data belum dimuat");return}
  loading(true,"Membuat gambar…");let blob;try{blob=await makeCard()}finally{loading(false)}
  const url=URL.createObjectURL(blob);const name="pantau-karhutla-"+isoWib(Date.now())+".png";
  const file=new File([blob],name,{type:"image/png"});
  const canShare=navigator.canShare&&navigator.canShare({files:[file]});
  openModal("Gambar ringkasan",'<img class="cardprev" src="'+url+'" alt="Pratinjau gambar ringkasan titik api"><div class="actions" style="grid-template-columns:1fr 1fr">'+(canShare?'<button type="button" class="btn primary" id="cShare">Bagikan</button>':'')+'<a class="btn'+(canShare?'':' primary')+'" href="'+url+'" download="'+name+'">Unduh gambar</a></div><p class="caveat" style="margin:0">Gambar mengikuti saringan yang sedang aktif (rentang waktu dan provinsi).</p>');
  if(canShare)$("cShare").onclick=()=>navigator.share({files:[file],title:"Pantau Karhutla",text:fmtNum(filtered().length)+" titik api di "+(state.prov||"Indonesia")+" dalam "+winLabel(state.win)+". "+location.origin}).catch(()=>{});
}
$("cardBtn").onclick=openCard;

/* =====================================================================
   6. UNDUH CSV
   ===================================================================== */
function downloadCSV(){
  const list=filtered().slice().sort((a,b)=>b.ms-a.ms);
  const q=v=>{const s=v==null?"":String(v);return /[",\n;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const head=["waktu_utc","tanggal_lokal","jam_lokal","zona","lintang","bujur","provinsi","lokasi","frp_mw","kekuatan","keyakinan","satelit","lintasan","jumlah_deteksi","perusahaan_konsesi","grup","jenis_konsesi","lahan_gambut"];
  const rows=list.map(d=>{const lp=localParts(d.ms,d.off);return [new Date(d.ms).toISOString(),lp.yr+"-"+pad(lp.mon+1)+"-"+pad(lp.date),fmtTime(d.ms,d.off),d.zn,d.lat.toFixed(5),d.lon.toFixed(5),d.prov||"",placeName(d),d.frp.toFixed(1),FRP_LBL[frpLv(d.frp)],CONF_LBL[d.conf],d.sat,d.dn==="D"?"siang":d.dn==="N"?"malam":"",d.n||1,d.conc?d.conc.company:"",d.conc&&d.conc.group||"",d.conc&&d.conc.type||"",d.peat===undefined?"":d.peat?"ya":"tidak"].map(q).join(",")});
  const blob=new Blob(["﻿"+head.join(",")+"\n"+rows.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="titik-api-"+(state.prov?state.prov.toLowerCase().replace(/\s+/g,"-")+"-":"")+isoWib(Date.now())+".csv";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast(fmtNum(list.length)+" titik api diunduh");
}
$("csvBtn").onclick=downloadCSV;$("csvBtn2").onclick=downloadCSV;

/* =====================================================================
   7. SEMATKAN (embed)
   ===================================================================== */
let embMode="all";
function embedUrl(){let u="https://pantau-karhutla.vercel.app/?embed=1";if(embMode==="prov"&&state.prov)u+="&provinsi="+encodeURIComponent(state.prov);return u}
function renderEmbed(){const u=embedUrl();$("embedCode").value='<iframe src="'+u+'" width="100%" height="520" style="border:0;border-radius:12px" loading="lazy" title="Peta titik api karhutla — Pantau Karhutla"></iframe>';$("embedPrev").href=u.replace("https://pantau-karhutla.vercel.app","");
  const pb=document.querySelector('[data-emb="prov"]');pb.disabled=!state.prov;pb.textContent=state.prov?"Hanya "+state.prov:"Provinsi terpilih";if(!state.prov&&embMode==="prov")embMode="all";
  document.querySelectorAll("[data-emb]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.emb===embMode))}
document.querySelectorAll("[data-emb]").forEach(b=>b.onclick=()=>{embMode=b.dataset.emb;renderEmbed()});
$("embedCopy").onclick=()=>copyText($("embedCode").value,"Kode sematan disalin");
if(EMBED){
  document.documentElement.classList.add("embed");$("embedBar").hidden=false;
  const p=new URLSearchParams(location.search);p.delete("embed");$("embedLink").href="/"+(p.toString()?"?"+p:"");
  $("legend").open=false;setTimeout(()=>map.invalidateSize(),50);
}
let provParamDone=false;
function applyProvParam(){if(provParamDone)return;provParamDone=true;const pv=params.get("provinsi");if(pv&&PROV_SHAPES.some(s=>s.name===pv)&&state.prov!==pv)toggleProv(pv,false)}

/* =====================================================================
   8. PWA (service worker & tombol pasang)
   ===================================================================== */
let deferredPrompt=null;
if("serviceWorker" in navigator&&!EMBED&&location.protocol==="https:"){navigator.serviceWorker.register("/sw.js").catch(()=>{})}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installNote").textContent=""});
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
function renderInstall(){const n=$("installNote");if(standalone()){$("installBtn").disabled=true;$("installBtn").textContent="Sudah terpasang";n.textContent="";return}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);if(!deferredPrompt)n.textContent=ios?"Di iPhone/iPad: buka di Safari, ketuk tombol Bagikan, lalu pilih “Tambah ke Layar Utama”.":"Bila tombol tidak bereaksi, buka menu browser (⋮) lalu pilih “Instal aplikasi” atau “Tambahkan ke layar utama”."}
$("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(e){}deferredPrompt=null}renderInstall()};
window.addEventListener("appinstalled",()=>{toast("Pantau Karhutla terpasang");renderInstall()});
renderInstall();

/* =====================================================================
   9. TREN (arsip FIRMS VIIRS S-NPP sejak 2015) — data/trend.js dimuat saat tab dibuka
   ===================================================================== */
let TR=null,trP=null,trProv="";
function loadTrend(){if(TR)return Promise.resolve(TR);if(trP)return trP;trP=new Promise((res,rej)=>{const s=document.createElement("script");s.src="data/trend.js?v=20261104a";s.onload=()=>{TR=window.TREND_DATA||null;TR?res(TR):rej(new Error("kosong"))};s.onerror=()=>{trP=null;rej(new Error("gagal memuat"))};document.head.appendChild(s)});return trP}
const BLN3=BULAN.map(b=>b.slice(0,3));
function trSeries(prov){ // {ym:n}
  if(prov)return TR.M[prov]||{};const o={};Object.values(TR.M).forEach(m=>{for(const k in m)o[k]=(o[k]||0)+m[k]});return o}
function svgLine(series,opts){ // series: [{name,color,vals[12],dash}]
  const W=600,H=220,L0=44,R0=10,T0=10,B0=26,mx=Math.max(1,...series.flatMap(s=>s.vals.filter(v=>v!=null)));
  const nice=v=>{const p=10**Math.floor(Math.log10(v));const m=v/p;return (m<=1?1:m<=2?2:m<=5?5:10)*p};const top=nice(mx);
  const x=i=>L0+i*(W-L0-R0)/11,y=v=>T0+(H-T0-B0)*(1-v/top);
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(opts.label)+'">';
  for(let k=0;k<=4;k++){const v=top*k/4;s+='<line x1="'+L0+'" x2="'+(W-R0)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+cv("--line")+'" stroke-width="1"/><text x="'+(L0-6)+'" y="'+(y(v)+4)+'" font-size="11" text-anchor="end" fill="'+cv("--faint")+'">'+(v>=1000?(v/1000).toLocaleString("id-ID")+"rb":Math.round(v))+'</text>'}
  BLN3.forEach((b,i)=>{s+='<text x="'+x(i)+'" y="'+(H-8)+'" font-size="11" text-anchor="middle" fill="'+cv("--faint")+'">'+b+'</text>'});
  series.forEach(se=>{const pts=se.vals.map((v,i)=>v==null?null:[x(i),y(v)]);let d="";pts.forEach((p,i)=>{if(!p)return;d+=(d&&pts[i-1]?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)});
    s+='<path d="'+d+'" fill="none" stroke="'+se.color+'" stroke-width="'+(se.w||2.2)+'" stroke-linejoin="round" stroke-linecap="round"'+(se.dash?' stroke-dasharray="'+se.dash+'"':'')+'/>';
    if(se.dots)pts.forEach(p=>{if(p)s+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3" fill="'+se.color+'"/>'})});
  return s+'</svg>'}
function renderTrend(){
  const box=$("trenBox");
  if(!TR){box.innerHTML='<div class="sec"><p class="hint">Memuat arsip tren…</p></div>';loadTrend().then(renderTrend).catch(()=>{box.innerHTML='<div class="sec"><p class="hint">Arsip tren belum bisa dimuat. Coba muat ulang halaman.</p></div>'});return}
  const S=trSeries(trProv);const Y0=+TR.start.slice(0,4),asOf=TR.asOf,yNow=+asOf.slice(0,4),mNow=+asOf.slice(5,7),dNow=+asOf.slice(8,10);
  const years=[];for(let y=Y0;y<=yNow;y++)years.push(y);
  const yTot=y=>{let t=0;for(let m=1;m<=12;m++)t+=S[y+"-"+pad(m)]||0;return t};
  // same period (1 Jan → asOf day): full months + share of the current month from the national daily series
  const ySame=y=>{let t=0;for(let m=1;m<mNow;m++)t+=S[y+"-"+pad(m)]||0;
    const cm=S[y+"-"+pad(mNow)]||0;if(y===yNow)return t+cm;
    // portion of month mNow up to day dNow, from national daily data
    let a=0,b=0;const dim=new Date(Date.UTC(y,mNow,0)).getUTCDate();for(let d=1;d<=dim;d++){const v=TR.D[y+"-"+pad(mNow)+"-"+pad(d)]||0;b+=v;if(d<=dNow)a+=v}
    return t+(b?cm*a/b:cm*dNow/dim)};
  const prevYears=years.filter(y=>y<yNow);
  const avgSame=prevYears.reduce((a,y)=>a+ySame(y),0)/prevYears.length;
  const cur=ySame(yNow);const pct=avgSame?Math.round((cur/avgSame-1)*100):0;
  const worstY=prevYears.slice().sort((a,b)=>yTot(b)-yTot(a))[0];
  const avg5=[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>{const ys=prevYears.slice(-5);return ys.reduce((a,y)=>a+(S[y+"-"+pad(m)]||0),0)/ys.length});
  const thisY=[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>m<=mNow?(S[yNow+"-"+pad(m)]||0):null);
  const mx=Math.max(1,...years.map(yTot));
  const provs=Object.keys(TR.M).sort((a,b)=>a.localeCompare(b,"id"));
  // ranking (12 bulan terakhir)
  const yms=[];{let y=yNow,m=mNow;for(let k=0;k<12;k++){yms.push(y+"-"+pad(m));m--;if(!m){m=12;y--}}}
  const rank=Object.entries(TR.CM).map(([c,o])=>[c,yms.reduce((a,k)=>a+(o[k]||0),0)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,15);
  const rmx=rank.length?rank[0][1]:1;
  const repYears=prevYears.slice(-10);
  const repeat=Object.entries(TR.CY).map(([c,o])=>{const yrs=repYears.filter(y=>(o[y]||0)>=10);return {c,yrs,tot:repYears.reduce((a,y)=>a+(o[y]||0),0)}}).filter(x=>x.yrs.length>=6).sort((a,b)=>b.yrs.length-a.yrs.length||b.tot-a.tot).slice(0,15);
  const grp=c=>{const s=CONC.find(x=>x.company===c);return s&&s.group?s.group:(s&&s.cid&&window.COMPANY_PROFILES&&window.COMPANY_PROFILES[s.cid]?window.COMPANY_PROFILES[s.cid].group:"")};
  box.innerHTML=
   '<div class="sec"><div class="sortbar"><h2 style="flex:1">Tren titik api '+Y0+'–'+yNow+'</h2><select class="tsel" id="trProv" aria-label="Pilih wilayah"><option value="">Seluruh Indonesia</option>'+provs.map(p=>'<option'+(p===trProv?" selected":"")+'>'+esc(p)+'</option>').join("")+'</select></div>'+
    '<div class="kpi"><div><div class="k">'+yNow+' s.d. '+dNow+' '+BLN3[mNow-1]+'</div><div class="v">'+fmtNum(Math.round(cur))+'</div><div class="s"><span class="'+(pct>0?"up":"down")+'">'+(pct>0?"+":"")+pct+'%</span> dibanding rata-rata periode sama '+prevYears[0]+'–'+prevYears[prevYears.length-1]+'</div></div>'+
    '<div><div class="k">Tahun terparah</div><div class="v">'+worstY+'</div><div class="s">'+fmtNum(yTot(worstY))+' deteksi setahun</div></div></div></div>'+
   '<div class="sec"><h2>Per tahun <small>deteksi satelit</small></h2><div class="minibars" style="height:120px">'+years.map(y=>{const t=yTot(y),sm=ySame(y);return '<div title="'+y+': '+fmtNum(t)+' deteksi'+(y<yNow?' (s.d. '+dNow+' '+BLN3[mNow-1]+': '+fmtNum(Math.round(sm))+')':' (berjalan)')+'"><i style="height:'+(t/mx*100)+'%;'+(y===yNow?'':'opacity:.45')+'"></i><span>'+String(y).slice(2)+'</span></div>'}).join("")+'</div>'+
    '<p class="caveat">Batang terang = '+yNow+' (sampai '+dNow+' '+BULAN[mNow-1]+'). Arahkan kursor untuk angka tiap tahun.</p></div>'+
   '<div class="sec"><h2>Per bulan</h2>'+svgLine([
      {name:"Rata-rata 5 tahun",color:cv("--faint"),vals:avg5,dash:"5 4",w:2},
      {name:"2015",color:"#c0504d",vals:[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>S["2015-"+pad(m)]||0),w:1.6},
      {name:"2019",color:"#b88a00",vals:[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>S["2019-"+pad(m)]||0),w:1.6},
      {name:String(yNow),color:cv("--accent"),vals:thisY,w:3,dots:true}],{label:"Grafik jumlah titik api per bulan"})+
    '<div class="lgd"><span><i style="background:'+cv("--accent")+'"></i>'+yNow+'</span><span><i style="background:'+cv("--faint")+'"></i>Rata-rata '+prevYears.slice(-5)[0]+'–'+prevYears[prevYears.length-1]+'</span><span><i style="background:#c0504d"></i>2015 (kebakaran besar)</span><span><i style="background:#b88a00"></i>2019</span></div></div>'+
   (trProv?'':'<div class="sec"><h2>Konsesi dengan titik api terbanyak <small>12 bulan terakhir</small></h2><div class="rank">'+rank.map(([c,n],i)=>'<button type="button" data-tco="'+esc(c)+'"><span class="no">'+(i+1)+'</span><span><b>'+esc(c)+'</b><small>'+esc(grp(c)||"Grup tidak tercatat")+'</small><div class="bar" style="width:'+(n/rmx*100)+'%"></div></span><span class="n">'+fmtNum(n)+'</span></button>').join("")+'</div></div>'+
    '<div class="sec"><h2>Terbakar berulang <small>'+repYears[0]+'–'+repYears[repYears.length-1]+'</small></h2><p class="lead" style="font-size:13px">Konsesi dengan minimal 10 deteksi titik api dalam setahun, terjadi di 6 tahun atau lebih dari 10 tahun terakhir.</p><div class="rank">'+repeat.map((x,i)=>'<button type="button" data-tco="'+esc(x.c)+'"><span class="no">'+(i+1)+'</span><span><b>'+esc(x.c)+'</b><small>'+esc(grp(x.c)||"Grup tidak tercatat")+'</small><div class="yrs">'+repYears.map(y=>'<i class="'+(x.yrs.includes(y)?"on":"")+'" title="'+y+': '+fmtNum(TR.CY[x.c][y]||0)+'"></i>').join("")+'</div></span><span class="n">'+x.yrs.length+' th</span></button>').join("")+'</div></div>')+
   '<div class="sec"><p class="caveat">Sumber: arsip NASA FIRMS satelit VIIRS S-NPP (data standar s.d. '+TR.spEnd+', setelahnya data cepat/NRT), semua tingkat keyakinan, hanya titik di daratan provinsi Indonesia. Satu kebakaran bisa terdeteksi berkali-kali, jadi angka ini menunjukkan intensitas, bukan jumlah kejadian. Titik api di konsesi <b>tidak membuktikan</b> perusahaan sebagai penyebab. Data diperbarui sampai '+dNow+' '+BULAN[mNow-1]+' '+yNow+'.</p></div>';
  $("trProv").onchange=e=>{trProv=e.target.value;renderTrend()};
}
$("trenBox").addEventListener("click",e=>{const b=e.target.closest("[data-tco]");if(b)openCompany(b.dataset.tco)});
document.querySelector(".tabs").addEventListener("click",e=>{const b=e.target.closest("[role=tab]");if(b&&b.dataset.tab==="tren")renderTrend()});

/* =====================================================================
   HOOKS ke skrip utama
   ===================================================================== */
onHook("detail",d=>{
  const wx=$("wxBox");if(!wx)return;const sec=wx.closest(".sec");
  // kotak gambut
  const cb=document.querySelector("#detailView .conc-box");
  if(cb&&!$("peatBox")){cb.insertAdjacentHTML("afterend",'<div id="peatBox"></div>');
    const show=v=>{const el=$("peatBox");if(el&&v)el.innerHTML='<div class="peatbox"><b>Di lahan gambut.</b> Api gambut bisa membara di bawah permukaan selama berminggu-minggu dan menghasilkan asap tebal.</div>'};
    if(d.peat!==undefined)show(d.peat);else isPeat(d.lat,d.lon).then(v=>{if(v!==undefined)d.peat=v;if(state.sel===d.id)show(v)})}
  sec.insertAdjacentHTML("afterend",'<div class="sec" id="xAir"><h2>Kualitas udara di lokasi ini</h2><div id="xAirBox"><p class="hint">Memuat…</p></div></div><div class="sec" id="xRisk"><h2>Bahaya kebakaran di sekitar lokasi</h2><div id="xRiskBox"><p class="hint">Memuat…</p></div></div><div class="sec"><h2>Bantuan terdekat</h2><div class="lnkrow" style="margin-top:4px">'+
    [["rumah sakit","Rumah sakit"],["puskesmas","Puskesmas"],["pemadam kebakaran","Pemadam kebakaran"],["BPBD","Kantor BPBD"]].map(([q,l])=>'<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent(q)+'/@'+d.lat.toFixed(4)+','+d.lon.toFixed(4)+',11z">'+l+' ↗</a>').join("")+'</div><p class="caveat">Darurat: telepon <a href="tel:112">112</a> atau pemadam kebakaran <a href="tel:113">113</a>.</p></div>');
  aqAt(d.lat,d.lon).then(a=>{const el=$("xAirBox");if(!el||state.sel!==d.id)return;const q=ispu(a.d[0]);
    el.innerHTML='<div class="aqlist">'+["24 jam terakhir","Besok","Lusa"].map((l,k)=>{const qq=ispu(a.d[k]);return '<div class="aqrow" style="cursor:default"><span><b>'+l+'</b></span><span class="pm">'+fmtPm(a.d[k])+'</span>'+qChip(qq)+'</div>'}).join("")+'</div>'+(q?'<div class="advice"><b>'+q.lbl+'</b>'+esc(q.tip)+'</div>':'')+'<p class="hint">PM2.5 model CAMS (Open-Meteo), skala ISPU.</p>'}).catch(()=>{const el=$("xAirBox");if(el)el.innerHTML='<p class="hint">Kualitas udara belum bisa dimuat.</p>'});
  loadRisk().then(()=>{const el=$("xRiskBox");if(!el||state.sel!==d.id)return;const p=riskNear(d.lat,d.lon);if(!p){el.innerHTML='<p class="hint">Tidak ada data untuk lokasi ini.</p>';return}
    const t=p.days[0];el.innerHTML=riskStrip(p.days.map(x=>x.s))+'<p class="hint" style="margin-top:8px">Hari ini: '+t.dsr+' hari tanpa hujan berarti, kelembapan minimum '+Math.round(t.rh)+'%, suhu maks '+Math.round(t.tx)+'°C. Data sel ±100 km di sekitar titik.</p>'}).catch(()=>{const el=$("xRiskBox");if(el)el.innerHTML='<p class="hint">Prakiraan belum bisa dimuat.</p>'});
});
onHook("company",(name,c)=>{
  const el=$("detailView");if(!el)return;
  const anchor=[...el.querySelectorAll(".sec")].find(s=>s.querySelector("h2")&&/Izin konsesi/.test(s.querySelector("h2").textContent));if(!anchor)return;
  anchor.insertAdjacentHTML("beforebegin",'<div class="sec" id="coHist"><h2>Riwayat titik api <small>per tahun</small></h2><p class="hint">Memuat arsip…</p></div>');
  loadTrend().then(()=>{const box=$("coHist");if(!box||state.cview!==name)return;const o=TR.CY[name]||{};const Y0=+TR.start.slice(0,4),yN=+TR.asOf.slice(0,4);const ys=[];for(let y=Y0;y<=yN;y++)ys.push(y);
    const mx=Math.max(1,...ys.map(y=>o[y]||0));const tot=ys.reduce((a,y)=>a+(o[y]||0),0);
    box.innerHTML='<h2>Riwayat titik api <small>'+Y0+'–'+yN+'</small></h2>'+(tot?'<div class="minibars">'+ys.map(y=>{const v=o[y]||0;return '<div title="'+y+': '+fmtNum(v)+' deteksi"><i class="'+(v?"":"z")+'" style="height:'+(v/mx*100)+'%"></i><span>'+String(y).slice(2)+'</span></div>'}).join("")+'</div><p class="caveat">Total '+fmtNum(tot)+' deteksi satelit VIIRS di area konsesi ini sejak '+Y0+'. Tahun terbanyak: '+ys.slice().sort((a,b)=>(o[b]||0)-(o[a]||0))[0]+'.</p>':'<p class="hint">Tidak ada titik api tercatat di area konsesi ini sejak '+Y0+'.</p>')}).catch(()=>{const b=$("coHist");if(b)b.remove()});
});
onHook("update",()=>{renderWatch();drawWatch();renderEmbed();if(peatOn){tagPeat();renderPeatLine()}});
onHook("data",()=>{checkWatch();applyProvParam();if(peatOn)tagPeat()});
onHook("theme",()=>{drawAir();drawRisk();drawWatch();if(state.tab==="tren"&&TR)renderTrend()});

/* ---------- boot ---------- */
renderWatch();drawWatch();renderEmbed();
if(!EMBED){
  loadAQ().then(renderAir).catch(()=>{$("airBox").innerHTML='<p class="hint">Kualitas udara belum bisa dimuat. Coba lagi nanti.</p>'});
  loadRisk().then(renderRisk).catch(()=>{$("riskBox").innerHTML='<p class="hint">Prakiraan bahaya belum bisa dimuat. Coba lagi nanti.</p>';$("riskProv").innerHTML=""});
  setInterval(()=>{if(document.visibilityState!=="visible")return;loadAQ().then(()=>{renderAir();drawAir()}).catch(()=>{})},30*60e3);
}
if(params.get("provinsi")&&DATA.length)setTimeout(applyProvParam,500);
window.PK_X={setAir,setRisk,setPeat,openWatch,openCard,downloadCSV,renderTrend};
})();
