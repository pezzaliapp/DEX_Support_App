/* app.js — DEX-Edu Support App */
(()=>{
'use strict';

/* PWA install */
let deferredPrompt=null;
const btnInstall=document.getElementById('btnInstall');
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;if(btnInstall)btnInstall.disabled=false;});
btnInstall?.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;btnInstall.disabled=true;});
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}

/* Tabs */
const tabs=document.querySelectorAll('button.tab[data-tab]');
const panels={
  overview:document.getElementById('tab-overview'),
  science:document.getElementById('tab-science'),
  sim21:document.getElementById('tab-sim21'),
  array:document.getElementById('tab-array'),
  shield:document.getElementById('tab-shield'),
  uv:document.getElementById('tab-uv')
};
tabs.forEach(btn=>btn.addEventListener('click',()=>{
  tabs.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  Object.values(panels).forEach(p=>p.hidden=true);
  panels[btn.dataset.tab].hidden=false;
}));

/* 21-cm Toy Simulator */
const chart=document.getElementById('chart');const ctx=chart?.getContext('2d');
const freq=document.getElementById('freq');const beta=document.getElementById('beta');
const fVal=document.getElementById('freqVal');const bVal=document.getElementById('betaVal');
function draw21(){
  if(!chart) return;
  const W=chart.width,H=chart.height;ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='#2a3a7a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(40,H-30);ctx.lineTo(W-10,H-30);ctx.moveTo(40,10);ctx.lineTo(40,H-30);ctx.stroke();
  const fmin=10,fmax=50;const nu0=10,betaF=parseFloat(beta.value),A=10000;
  const gAmp=-0.3,gMu=28,gSigma=4;
  function X(f){return 40+(W-60)*(f-fmin)/(fmax-fmin)}
  function Y_K(T){const Tmin=-1.0,Tmax=15000;const y=(T-Tmin)/(Tmax-Tmin);return 10+(H-40)*(1-y)}
  ctx.beginPath();ctx.strokeStyle='#4aa3ff';ctx.lineWidth=2;
  for(let f=fmin;f<=fmax;f+=0.2){const T=A*Math.pow(f/nu0,-betaF);const x=X(f),y=Y_K(T);if(f===fmin)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();
  ctx.beginPath();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;
  for(let f=fmin;f<=fmax;f+=0.2){const T21=gAmp*Math.exp(-0.5*((f-gMu)/gSigma)**2);const x=X(f),y=Y_K(T21);if(f===fmin)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();
  const fsel=parseFloat(freq.value);const Tfg=A*Math.pow(fsel/nu0,-betaF);const T21=gAmp*Math.exp(-0.5*((fsel-gMu)/gSigma)**2);
  ctx.strokeStyle='#69d08f';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(X(fsel),10);ctx.lineTo(X(fsel),H-30);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#eaf1ff';ctx.font='12px system-ui';ctx.fillText('MHz',W-40,H-12);ctx.fillText('K',10,20);ctx.fillText(`Foreground ≈ ${Tfg.toFixed(0)} K`,W-200,20);ctx.fillText(`21‑cm ≈ ${T21.toFixed(2)} K`,W-200,36);
  fVal.textContent=fsel+' MHz';bVal.textContent=betaF.toFixed(2);
}
freq?.addEventListener('input',draw21);beta?.addEventListener('input',draw21);if(chart&&freq&&beta)draw21();

/* Array Planner */
const arrayView=document.getElementById('arrayView');const aCtx=arrayView?.getContext('2d');
const baselineView=document.getElementById('baselineView');const bCtx=baselineView?.getContext('2d');
const nAnt=document.getElementById('nAnt');const nVal=document.getElementById('nVal');const geom=document.getElementById('geom');

function genAntennas(N,type){
  const pts=[];
  if(type==='grid'){
    const side=Math.ceil(Math.sqrt(N));
    const s=1/Math.max(1,side-1);
    for(let i=0;i<side;i++){
      for(let j=0;j<side;j++){
        if(pts.length>=N) break;
        pts.push({x:i*s,y:j*s});
      }
    }
  }else if(type==='ring'){
    const rings=Math.max(2,Math.ceil(Math.sqrt(N)/3)+1);
    let used=0;
    for(let r=1;r<=rings;r++){
      const R=(r/(rings+0.3));
      const k=Math.max(6,Math.round((2*r/(rings*(rings+1)))*N));
      for(let t=0;t<k;t++){
        if(used>=N) break;
        const a=(t/k)*Math.PI*2;
        pts.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9,ring:r});
        used++;
      }
    }
    while(pts.length<N){
      const a=Math.random()*Math.PI*2;const R=0.95;
      pts.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9,ring:rings});
    }
  }else{
    for(let i=0;i<N;i++){pts.push({x:Math.random(),y:Math.random()});}
  }
  return pts.map(p=>({x:2*(p.x-0.5),y:2*(p.y-0.5),ring:p.ring||1}));
}

function drawArray(){
  if(!arrayView) return;
  const W=arrayView.width,H=arrayView.height;
  aCtx.clearRect(0,0,W,H);
  aCtx.fillStyle='#0a1330';aCtx.fillRect(0,0,W,H);
  aCtx.strokeStyle='#1f2f64';aCtx.strokeRect(10,10,W-20,H-20);
  const N=parseInt(nAnt.value);nVal.textContent=N;
  const pts=genAntennas(N,geom.value);
  pts.forEach(p=>{
    const x=W/2+p.x*(W*0.35);const y=H/2+p.y*(H*0.35);
    const hue=(210+p.ring*20)%360;
    aCtx.fillStyle=`hsl(${hue} 70% 82%)`;
    aCtx.beginPath();aCtx.arc(x,y,5,0,Math.PI*2);aCtx.fill();
    aCtx.strokeStyle='#0b1022';aCtx.lineWidth=1;aCtx.stroke();
  });
  const dists=[];
  for(let i=0;i<pts.length;i++){for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;dists.push(Math.sqrt(dx*dx+dy*dy));}}
  const bins=30,hist=new Array(bins).fill(0);
  dists.forEach(d=>{let k=Math.floor(d/Math.SQRT2*bins);if(k<0)k=0;if(k>=bins)k=bins-1;hist[k]++;});
  if(!baselineView) return;
  const w=baselineView.width,h=baselineView.height;
  bCtx.clearRect(0,0,w,h);
  bCtx.fillStyle='#0a1330';bCtx.fillRect(0,0,w,h);
  bCtx.strokeStyle='#1f2f64';bCtx.strokeRect(10,10,w-20,h-20);
  const maxv=Math.max(1,...hist);const barW=(w-60)/bins;
  for(let k=0;k<bins;k++){const val=hist[k]/maxv;const x=30+k*barW;const y=h-30 - val*(h-60);bCtx.fillStyle='#4aa3ff';bCtx.fillRect(x,y,barW-2,h-30-y);}
}
nAnt?.addEventListener('input',drawArray);geom?.addEventListener('change',drawArray);if(arrayView&&baselineView)drawArray();

/* RFI Shield */
const shield=document.getElementById('shieldView');const sCtx=shield?.getContext('2d');
const phase=document.getElementById('phase');const phaseVal=document.getElementById('phaseVal');
function drawShield(){
  if(!shield) return;
  const W=shield.width,H=shield.height;
  sCtx.clearRect(0,0,W,H);
  const grad=sCtx.createRadialGradient(W*0.5,0,10,W*0.5,H*0.7,H);
  grad.addColorStop(0,'#0f1a40');grad.addColorStop(1,'#0a1126');sCtx.fillStyle=grad;sCtx.fillRect(0,0,W,H);
  const Ex=W*0.2,Ey=H*0.5,Er=40;sCtx.fillStyle='#2b6cff';sCtx.beginPath();sCtx.arc(Ex,Ey,Er,0,Math.PI*2);sCtx.fill();
  const Mx=W*0.65,My=H*0.5,Mr=60;sCtx.fillStyle='#c8c8d0';sCtx.beginPath();sCtx.arc(Mx,My,Mr,0,Math.PI*2);sCtx.fill();
  sCtx.fillStyle='rgba(0,0,0,0.35)';sCtx.beginPath();sCtx.arc(Mx,My,Mr,-Math.PI/2,Math.PI/2);sCtx.lineTo(Mx,My);sCtx.closePath();sCtx.fill();
  const ang=parseFloat(phase.value)*Math.PI/180;phaseVal.textContent=parseInt(phase.value)+'°';sCtx.save();sCtx.translate(Mx,My);sCtx.rotate(ang);
  sCtx.strokeStyle='rgba(105,208,143,0.9)';sCtx.fillStyle='rgba(105,208,143,0.12)';sCtx.beginPath();sCtx.moveTo(-Mr-10,-20);sCtx.lineTo(W,-80);sCtx.lineTo(W,80);sCtx.lineTo(-Mr-10,20);sCtx.closePath();sCtx.fill();sCtx.stroke();sCtx.restore();
  sCtx.fillStyle='#eaf1ff';sCtx.font='12px system-ui';sCtx.fillText('Earth (RFI)',Ex-28,Ey-50);sCtx.fillText('Moon — far side',Mx-40,My-70);sCtx.fillText('Radio shadow (concept)',W*0.52,24);
}
phase?.addEventListener('input',drawShield);if(shield)drawShield();

/* Science Parameters */
const s_freq=document.getElementById('s_freq');
const s_freqVal=document.getElementById('s_freqVal');
const s_elem=document.getElementById('s_elem');
const s_elemVal=document.getElementById('s_elemVal');
const s_theta=document.getElementById('s_theta');
const s_thetaVal=document.getElementById('s_thetaVal');
const s_z=document.getElementById('s_z');
const s_lambda=document.getElementById('s_lambda');
const s_D=document.getElementById('s_D');
const s_fov=document.getElementById('s_fov');
const s_age=document.getElementById('s_age');

function Gyr(x){return `${x.toFixed(2)} Gyr`;}
function arcminToRad(m){return (m/60)*Math.PI/180;}
function lookbackGyr(z){
  if(z<=0) return 0;
  const H0=67.7;const H0_s=H0*1000/3.085677581e22;const tH=1/H0_s/ (3600*24*365.25*1e9);
  const Om=0.31,Ol=0.69;const n=600;const dz=z/n;let sum=0;
  for(let i=0;i<=n;i++){const zi=i*dz;const E=Math.sqrt(Om*Math.pow(1+zi,3)+Ol);const w=(i===0||i===n)?1:(i%2?4:2);sum+= w/((1+zi)*E);}
  return (dz/3)*sum*tH;
}
function updateScience(){
  if(!s_freq) return;
  const fMHz=parseFloat(s_freq.value);const d=parseFloat(s_elem.value);const theta_arcmin=parseFloat(s_theta.value);
  s_freqVal.textContent=`${fMHz} MHz`;s_elemVal.textContent=`${d} m`;s_thetaVal.textContent=`${theta_arcmin}′`;
  const z=1420/fMHz - 1; s_z.textContent=z.toFixed(2);
  const lambda=300/fMHz; s_lambda.textContent=`${lambda.toFixed(2)} m`;
  const theta=arcminToRad(theta_arcmin); const D=lambda/theta; s_D.textContent=`${D.toFixed(1)} m`;
  const fov_rad=lambda/d; const fov_deg=fov_rad*180/Math.PI; s_fov.textContent=`${fov_deg.toFixed(1)}°`;
  const tL=lookbackGyr(z); const age=Math.max(0,13.8 - tL); s_age.textContent=Gyr(age);
}
['input','change'].forEach(ev=>{s_freq?.addEventListener(ev,updateScience);s_elem?.addEventListener(ev,updateScience);s_theta?.addEventListener(ev,updateScience);});
updateScience();

})();

/* ---- Export Helpers ---- */
function currentScience(){
  if(!document.getElementById('s_freq')) return null;
  const fMHz=parseFloat(document.getElementById('s_freq').value);
  const d=parseFloat(document.getElementById('s_elem').value);
  const theta_arcmin=parseFloat(document.getElementById('s_theta').value);
  const z=1420/fMHz-1;
  const lambda=300/fMHz;
  const theta=(theta_arcmin/60)*Math.PI/180;
  const D=lambda/theta;
  const fov_deg=(lambda/d)*180/Math.PI;
  return { fMHz, d_m:d, theta_arcmin, z, lambda_m:lambda, baseline_required_m:D, fov_deg };
}
function currentArray(){
  // Recompute array using current UI values for consistency
  const N=parseInt(document.getElementById('nAnt').value);
  const g=document.getElementById('geom').value;
  const pts=(function(){
    const out=[];
    if(g==='grid'){
      const side=Math.ceil(Math.sqrt(N));
      const s=1/Math.max(1,side-1);
      for(let i=0;i<side;i++){
        for(let j=0;j<side;j++){
          if(out.length>=N) break;
          out.push({x:i*s,y:j*s});
        }
      }
    }else if(g==='ring'){
      const rings=Math.max(2,Math.ceil(Math.sqrt(N)/3)+1);
      let used=0;
      for(let r=1;r<=rings;r++){
        const R=(r/(rings+0.3));
        const k=Math.max(6,Math.round((2*r/(rings*(rings+1)))*N));
        for(let t=0;t<k;t++){
          if(used>=N) break;
          const a=(t/k)*Math.PI*2;
          out.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9,ring:r});
          used++;
        }
      }
      while(out.length<N){
        const a=Math.random()*Math.PI*2;const R=0.95;
        out.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9,ring:rings});
      }
    }else{
      for(let i=0;i<N;i++){out.push({x:Math.random(),y:Math.random()});}
    }
    return out.map(p=>({x:2*(p.x-0.5),y:2*(p.y-0.5),ring:p.ring||1}));
  })();
  // distances
  const dists=[];
  for(let i=0;i<pts.length;i++){for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;dists.push(Math.sqrt(dx*dx+dy*dy));}}
  // simple hist
  const bins=30,hist=new Array(bins).fill(0);
  dists.forEach(d=>{let k=Math.floor(d/Math.SQRT2*bins);if(k<0)k=0;if(k>=bins)k=bins-1;hist[k]++;});
  return { N, geometry:g, points:pts, baselines:dists, histogram:hist, bins };
}
function download(filename, mime, content){
  const blob=new Blob([content],{type:mime});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function downloadJSON(){
  const payload={ timestamp:new Date().toISOString(), science:currentScience(), array:currentArray() };
  download('dex_edu_export.json','application/json', JSON.stringify(payload,null,2));
}
function downloadCSV(){
  const A=currentArray();
  let csv='i,j,dx,dy,dist_norm\\n';
  const pts=A.points;
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const dx=(pts[i].x-pts[j].x).toFixed(6);
      const dy=(pts[i].y-pts[j].y).toFixed(6);
      const d=Math.sqrt((pts[i].x-pts[j].x)**2+(pts[i].y-pts[j].y)**2).toFixed(6);
      csv+=`${i},${j},${dx},${dy},${d}\\n`;
    }
  }
  download('dex_edu_baselines.csv','text/csv',csv);
}
function openReport(){
  const S=currentScience(); const A=currentArray();
  const html=`<!DOCTYPE html><html><head><meta charset='utf-8'><title>DEX-Edu Report</title>
  <style>body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:24px;color:#111}h1{margin:0 0 4px}small{color:#555}code{background:#f3f5f8;padding:2px 6px;border-radius:6px}table{border-collapse:collapse;margin-top:8px}td,th{border:1px solid #ccc;padding:6px 8px}</style></head>
  <body>
  <h1>DEX-Edu Support App — Report</h1>
  <small>Generated: ${new Date().toLocaleString()}</small>
  <h2>Science Parameters</h2>
  <ul>
    <li>f = <b>${S.fMHz} MHz</b> → z = <b>${S.z.toFixed(2)}</b>, λ = <b>${S.lambda_m.toFixed(2)} m</b></li>
    <li>θ = <b>${S.theta_arcmin}′</b> → baseline richiesta D ≈ <b>${S.baseline_required_m.toFixed(1)} m</b></li>
    <li>Elemento d = <b>${S.d_m} m</b> → FoV ≈ <b>${S.fov_deg.toFixed(1)}°</b></li>
  </ul>
  <h2>Array</h2>
  <p>N = <b>${A.N}</b>, geometria = <b>${A.geometry}</b></p>
  <p>Numero di baseline = ${A.baselines.length}</p>
  <h3>Prime 20 baseline</h3>
  <table><tr><th>#</th><th>dist_norm</th></tr>${
    A.baselines.slice(0,20).map((d,i)=>`<tr><td>${i+1}</td><td>${d.toFixed?d.toFixed(6):d}</td></tr>`).join('')
  }</table>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;
  const w=window.open('about:blank','_blank'); w.document.write(html); w.document.close();
}
document.getElementById('exportJSON')?.addEventListener('click',downloadJSON);
document.getElementById('exportCSV')?.addEventListener('click',downloadCSV);
document.getElementById('openReport')?.addEventListener('click',openReport);


/* uv-plane (qualitativo) */
const uvView=document.getElementById('uvView');const uvCtx=uvView?.getContext('2d');
const uv_span=document.getElementById('uv_span'); const uv_spanVal=document.getElementById('uv_spanVal');
const uv_rot=document.getElementById('uv_rot'); const uv_rotVal=document.getElementById('uv_rotVal');

function getScienceLambda(){
  const s=document.getElementById('s_freq');
  if(!s) return 10; // fallback: λ=10 m (≈30 MHz)
  const fMHz=parseFloat(s.value)||30;
  return 300/fMHz;
}
function getArrayPoints(){
  const N=parseInt(document.getElementById('nAnt').value);
  const g=document.getElementById('geom').value;
  // reuse generator from Array Planner
  function gen(N,type){
    const pts=[];
    if(type==='grid'){
      const side=Math.ceil(Math.sqrt(N)); const s=1/Math.max(1,side-1);
      for(let i=0;i<side;i++){ for(let j=0;j<side;j++){ if(pts.length>=N) break; pts.push({x:i*s,y:j*s}); } }
    }else if(type==='ring'){
      const rings=Math.max(2,Math.ceil(Math.sqrt(N)/3)+1);
      let used=0;
      for(let r=1;r<=rings;r++){
        const R=(r/(rings+0.3)); const k=Math.max(6,Math.round((2*r/(rings*(rings+1)))*N));
        for(let t=0;t<k;t++){ if(used>=N) break; const a=(t/k)*Math.PI*2; pts.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9}); used++; }
      }
      while(pts.length<N){ const a=Math.random()*Math.PI*2; const R=0.95; pts.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9}); }
    }else{ for(let i=0;i<N;i++){ pts.push({x:Math.random(),y:Math.random()}); } }
    return pts.map(p=>({x:2*(p.x-0.5),y:2*(p.y-0.5)}));
  }
  return gen(N,g);
}

function drawUV(){
  if(!uvView) return;
  const W=uvView.width,H=uvView.height;
  uvCtx.clearRect(0,0,W,H);
  uvCtx.fillStyle='#0a1330'; uvCtx.fillRect(0,0,W,H);
  uvCtx.strokeStyle='#1f2f64'; uvCtx.strokeRect(10,10,W-20,H-20);
  // axes
  uvCtx.strokeStyle='#20356e'; uvCtx.beginPath();
  uvCtx.moveTo(W/2,20); uvCtx.lineTo(W/2,H-20);
  uvCtx.moveTo(20,H/2); uvCtx.lineTo(W-20,H/2);
  uvCtx.stroke();
  const span=parseFloat(uv_span.value); uv_spanVal.textContent = span+' m';
  const rot=parseFloat(uv_rot.value)*Math.PI/180; uv_rotVal.textContent = parseInt(uv_rot.value)+'°';
  const lambda=getScienceLambda();
  // scale: pixels per |u| wavelength unit
  const K = (Math.min(W,H)-80)/ (2 * (span/lambda)); // tries to fit max baseline/λ into view
  const pts=getArrayPoints();
  // draw uv points (for each baseline add ± points)
  uvCtx.fillStyle='#eaf1ff';
  for(let i=0;i<pts.length;i++){
    for(let j=i+1;j<pts.length;j++){
      const bx = (pts[i].x - pts[j].x) * span; // m
      const by = (pts[i].y - pts[j].y) * span; // m
      // rotate
      const bxr =  bx*Math.cos(rot) - by*Math.sin(rot);
      const byr =  bx*Math.sin(rot) + by*Math.cos(rot);
      const u = bxr / lambda; const v = byr / lambda;
      const plot = (uu,vv)=>{
        const x = W/2 + uu*K;
        const y = H/2 - vv*K;
        if(x>20 and x<W-20 and y>20 and y<H-20){
          uvCtx.beginPath(); uvCtx.arc(x,y,2,0,Math.PI*2); uvCtx.fill();
        }
      };
      plot(u,v); plot(-u,-v);
    }
  }
  // labels
  uvCtx.fillStyle='#9fb0df'; uvCtx.font='12px system-ui';
  uvCtx.fillText('u (λ)', W-60, H/2 - 8);
  uvCtx.fillText('v (λ)', W/2 + 8, 28);
  uvCtx.fillText(`λ ≈ ${lambda.toFixed(2)} m  |  span=${span} m`, 24, 28);
}
uv_span?.addEventListener('input', drawUV);
uv_rot?.addEventListener('input', drawUV);
// Also redraw UV when science frequency or array settings change
document.getElementById('s_freq')?.addEventListener('input', drawUV);
document.getElementById('nAnt')?.addEventListener('input', drawUV);
document.getElementById('geom')?.addEventListener('change', drawUV);
drawUV();


// ===== Multilingual (IT default; EN/DE/PT) =====
(function(){
  const LANG = {
    it: {
      app_title:"DEX-Edu Support App — Dark-Ages EXplorer Educational Tool",
      brand:"DEX-Edu Support App",
      badge:"ispirata a DEX — Dark-Ages EXplorer",
      install:"⬇︎ Installa",
      nav_overview:"Overview",
      nav_science:"Science",
      nav_sim:"21‑cm Simulator",
      nav_array:"Array Planner",
      nav_uv:"uv‑plane",
      nav_shield:"RFI Shield",

      ov_h2:"Cos'è DEX — Dark-Ages EXplorer",
      ov_p1:"DEX (Dark-Ages EXplorer) è un concept europeo per un interferometro radio a ultra‑lunghe lunghezze d'onda (ULW) sulla <b>faccia nascosta della Luna</b> per sondare l'Universo primordiale (Dark Ages/Cosmic Dawn).",
      ov_legal:"<b>Nota legale:</b> questa app è un progetto indipendente a scopo educativo, ispirato al concept DEX — Dark-Ages EXplorer. Non è affiliata, sponsorizzata o approvata da ESA o dagli enti partner.",
      ov_goals:"Obiettivi",
      ov_g1:"Rilevare segnali debolissimi a 10–50 MHz (linea 21‑cm redshiftata).",
      ov_g2:"Sfruttare il silenzio radio naturale della faccia nascosta.",
      ov_g3:"Sviluppare tecnologie ULW a TRL elevato, con roadmap per missioni future.",
      ov_app:"Cosa offre questa app",
      ov_a1:"Simulatori didattici (segnale 21‑cm vs foreground).",
      ov_a2:"Planner semplificato per layout d’antenna e baseline.",
      ov_a3:"Visuale concettuale del “radio‑shadow” lunare.",

      export_h3:"Export & Report",
      btn_json:"Download JSON (science + array)",
      btn_csv:"Download CSV (baselines)",
      btn_report:"Apri Report stampabile",
      export_note:"I file includono i parametri correnti: frequenza, z, λ, baseline richiesta, FoV, layout antenne e istogramma baseline.",

      sc_h2:"Parametri Scientifici",
      sc_f:"Frequenza (MHz)",
      sc_d:"Diametro elemento d (m)",
      sc_theta:"Risoluzione desiderata θ (arcmin)",
      sc_note:"Assunzioni cosmologiche: H0=67.7 km/s/Mpc, Ωm=0.31, ΩΛ=0.69, età dell’Universo t₀≈13.8 Gyr.",
      sc_out:"Output",
      sc_red:"Redshift",
      sc_lambda:"Lunghezza d’onda",
      sc_D:"Baseline per θ",
      sc_fov:"FoV elemento",
      sc_age:"Età Universo all’epoca z",

      sim_h2:"21‑cm Toy Simulator",
      sim_f:"Frequenza (MHz)",
      sim_beta:"Indice spettrale foreground β",
      sim_legend:"Curva blu = foreground (potenza ≈ ν<sup>−β</sup>) • Curva bianca = segnale globale 21‑cm (modellazione qualitativa)",

      arr_h2:"Array Planner (toy)",
      arr_n:"Numero antenne",
      arr_geom:"Geometria",
      arr_grid:"Griglia",
      arr_ring:"Anelli",
      arr_rand:"Random",
      arr_note:"Le baseline sono distanze antenna‑antenna normalizzate (istogramma qualitativo, non uv‑coverage reale).",

      uv_h2:"uv‑plane (qualitativo)",
      uv_span:"Array span (m)",
      uv_rot:"Rotazione sintetica (°)",
      uv_note:"λ prende la frequenza dalla scheda Science. Scala e copertura sono illustrative.",

      sh_h2:"Lunar Far‑Side Radio Shield",
      sh_p:"Illustrazione concettuale del “cono d’ombra” radio rispetto alla Terra. Trascina il cursore per ruotare la geometria.",
      sh_phase:"Angolo di fase orbitale",

      foot_left:"MIT License • Offline‑ready PWA",
      foot_right:"Ispirata al concept DEX — uso educativo • Nessuna affiliazione ufficiale"
    },
    en: {
      app_title:"DEX‑Edu Support App — Dark‑Ages EXplorer Educational Tool",
      brand:"DEX‑Edu Support App",
      badge:"inspired by DEX — Dark‑Ages EXplorer",
      install:"⬇︎ Install",
      nav_overview:"Overview",
      nav_science:"Science",
      nav_sim:"21‑cm Simulator",
      nav_array:"Array Planner",
      nav_uv:"uv‑plane",
      nav_shield:"RFI Shield",

      ov_h2:"What is DEX — Dark‑Ages EXplorer",
      ov_p1:"DEX (Dark‑Ages EXplorer) is a European concept for an ultra‑long‑wavelength (ULW) radio interferometer on the <b>far side of the Moon</b> to probe the early Universe (Dark Ages/Cosmic Dawn).",
      ov_legal:"<b>Legal note:</b> this app is an independent educational project inspired by the DEX concept. It is not affiliated with, sponsored or endorsed by ESA or partner entities.",
      ov_goals:"Goals",
      ov_g1:"Detect extremely faint signals at 10–50 MHz (redshifted 21‑cm line).",
      ov_g2:"Exploit the natural radio silence of the lunar far side.",
      ov_g3:"Develop high‑TRL ULW technologies with a roadmap for future missions.",
      ov_app:"What this app offers",
      ov_a1:"Educational simulators (21‑cm signal vs foreground).",
      ov_a2:"Simplified planner for antenna layout and baselines.",
      ov_a3:"Conceptual view of the lunar “radio shadow”.",

      export_h3:"Export & Report",
      btn_json:"Download JSON (science + array)",
      btn_csv:"Download CSV (baselines)",
      btn_report:"Open printable report",
      export_note:"Files include current parameters: frequency, z, λ, required baseline, FoV, antenna layout and baseline histogram.",

      sc_h2:"Science Parameters",
      sc_f:"Frequency (MHz)",
      sc_d:"Element diameter d (m)",
      sc_theta:"Desired resolution θ (arcmin)",
      sc_note:"Cosmology assumptions: H0=67.7 km/s/Mpc, Ωm=0.31, ΩΛ=0.69, age of the Universe t₀≈13.8 Gyr.",
      sc_out:"Output",
      sc_red:"Redshift",
      sc_lambda:"Wavelength",
      sc_D:"Baseline for θ",
      sc_fov:"Element FoV",
      sc_age:"Universe age at z",

      sim_h2:"21‑cm Toy Simulator",
      sim_f:"Frequency (MHz)",
      sim_beta:"Foreground spectral index β",
      sim_legend:"Blue curve = foreground (power ≈ ν<sup>−β</sup>) • White curve = global 21‑cm signal (qualitative model)",

      arr_h2:"Array Planner (toy)",
      arr_n:"Number of antennas",
      arr_geom:"Geometry",
      arr_grid:"Grid",
      arr_ring:"Rings",
      arr_rand:"Random",
      arr_note:"Baselines are normalized antenna‑to‑antenna distances (qualitative histogram, not real uv‑coverage).",

      uv_h2:"uv‑plane (qualitative)",
      uv_span:"Array span (m)",
      uv_rot:"Synthetic rotation (°)",
      uv_note:"λ takes frequency from the Science panel. Scale and coverage are illustrative.",

      sh_h2:"Lunar Far‑Side Radio Shield",
      sh_p:"Concept illustration of the radio “shadow cone” relative to Earth. Drag the slider to rotate the geometry.",
      sh_phase:"Orbital phase angle",

      foot_left:"MIT License • Offline‑ready PWA",
      foot_right:"Inspired by DEX — educational use • No official affiliation"
    },
    de: {
      app_title:"DEX‑Edu Support App — Dark‑Ages‑EXplorer Lern‑Tool",
      brand:"DEX‑Edu Support App",
      badge:"inspiriert von DEX — Dark‑Ages EXplorer",
      install:"⬇︎ Installieren",
      nav_overview:"Überblick",
      nav_science:"Wissenschaft",
      nav_sim:"21‑cm‑Simulator",
      nav_array:"Array‑Planer",
      nav_uv:"uv‑Ebene",
      nav_shield:"RFI‑Schatten",

      ov_h2:"Was ist DEX — Dark‑Ages EXplorer",
      ov_p1:"DEX (Dark‑Ages EXplorer) ist ein europäisches Konzept für ein ULW‑Radiointerferometer auf der <b>Rückseite des Mondes</b>, um das frühe Universum (Dark Ages/Cosmic Dawn) zu untersuchen.",
      ov_legal:"<b>Rechtlicher Hinweis:</b> Diese App ist ein unabhängiges Bildungsprojekt, inspiriert vom DEX‑Konzept. Keine Verbindung, Förderung oder Billigung durch die ESA oder Partner.",
      ov_goals:"Ziele",
      ov_g1:"Nachweis extrem schwacher Signale bei 10–50 MHz (rotverschobene 21‑cm‑Linie).",
      ov_g2:"Nutzung der natürlichen Funkstille der Mondrückseite.",
      ov_g3:"Entwicklung von ULW‑Technologien mit hohem TRL und Roadmap für zukünftige Missionen.",
      ov_app:"Was diese App bietet",
      ov_a1:"Lehr‑Simulatoren (21‑cm‑Signal vs. Vordergrund).",
      ov_a2:"Vereinfachter Planer für Antennen‑Layout und Baselines.",
      ov_a3:"Konzeptuelle Ansicht des „Radio‑Schattens“ des Mondes.",

      export_h3:"Export & Bericht",
      btn_json:"JSON herunterladen (Science + Array)",
      btn_csv:"CSV herunterladen (Baselines)",
      btn_report:"Druckbaren Bericht öffnen",
      export_note:"Dateien enthalten aktuelle Parameter: Frequenz, z, λ, benötigte Basislinie, FoV, Antennen‑Layout und Baseline‑Histogramm.",

      sc_h2:"Wissenschaftliche Parameter",
      sc_f:"Frequenz (MHz)",
      sc_d:"Element‑Durchmesser d (m)",
      sc_theta:"Gewünschte Auflösung θ (Bogenminuten)",
      sc_note:"Kosmologie‑Annahmen: H0=67,7 km/s/Mpc, Ωm=0,31, ΩΛ=0,69, Alter des Universums t₀≈13,8 Gyr.",
      sc_out:"Ausgabe",
      sc_red:"Rotverschiebung",
      sc_lambda:"Wellenlänge",
      sc_D:"Basislinie für θ",
      sc_fov:"FoV des Elements",
      sc_age:"Universumsalter bei z",

      sim_h2:"21‑cm‑Spiel‑Simulator",
      sim_f:"Frequenz (MHz)",
      sim_beta:"Vordergrund‑Spektralindex β",
      sim_legend:"Blaue Kurve = Vordergrund (Leistung ≈ ν<sup>−β</sup>) • Weiße Kurve = globales 21‑cm‑Signal (qualitatives Modell)",

      arr_h2:"Array‑Planer (Spiel)",
      arr_n:"Anzahl Antennen",
      arr_geom:"Geometrie",
      arr_grid:"Gitter",
      arr_ring:"Ringe",
      arr_rand:"Zufällig",
      arr_note:"Baselines sind normalisierte Antennen‑Abstände (qualitatives Histogramm, keine reale uv‑Abdeckung).",

      uv_h2:"uv‑Ebene (qualitativ)",
      uv_span:"Array‑Spannweite (m)",
      uv_rot:"Synthetische Rotation (°)",
      uv_note:"λ übernimmt die Frequenz aus dem Science‑Panel. Maßstab und Abdeckung sind illustrativ.",

      sh_h2:"Radio‑Schatten der Mondrückseite",
      sh_p:"Konzeptdarstellung des Funk‑„Schattenkegels“ relativ zur Erde. Ziehe den Regler, um die Geometrie zu drehen.",
      sh_phase:"Orbitaler Phasenwinkel",

      foot_left:"MIT‑Lizenz • Offline‑fähige PWA",
      foot_right:"Inspiriert von DEX — Bildungseinsatz • Keine offizielle Verbindung"
    },
    pt: {
      app_title:"DEX‑Edu Support App — Ferramenta Educacional Dark‑Ages EXplorer",
      brand:"DEX‑Edu Support App",
      badge:"inspirada em DEX — Dark‑Ages EXplorer",
      install:"⬇︎ Instalar",
      nav_overview:"Visão geral",
      nav_science:"Ciência",
      nav_sim:"Simulador 21‑cm",
      nav_array:"Planejador de Array",
      nav_uv:"plano‑uv",
      nav_shield:"Sombra RFI",

      ov_h2:"O que é DEX — Dark‑Ages EXplorer",
      ov_p1:"DEX (Dark‑Ages EXplorer) é um conceito europeu para um interferômetro de rádio em comprimentos de onda ultra‑longos (ULW) no <b>lado oculto da Lua</b> para investigar o Universo primordial (Dark Ages/Cosmic Dawn).",
      ov_legal:"<b>Nota legal:</b> este app é um projeto educacional independente inspirado no conceito DEX. Não é afiliado, patrocinado ou endossado pela ESA ou parceiros.",
      ov_goals:"Objetivos",
      ov_g1:"Detectar sinais extremamente fracos em 10–50 MHz (linha de 21‑cm redshiftada).",
      ov_g2:"Aproveitar o silêncio de rádio natural do lado oculto lunar.",
      ov_g3:"Desenvolver tecnologias ULW de alto TRL, com roteiro para missões futuras.",
      ov_app:"O que este app oferece",
      ov_a1:"Simuladores educacionais (sinal de 21‑cm vs foreground).",
      ov_a2:"Planejador simplificado para layout de antenas e baselines.",
      ov_a3:"Visão conceitual da “sombra de rádio” lunar.",

      export_h3:"Exportar & Relatório",
      btn_json:"Baixar JSON (ciência + array)",
      btn_csv:"Baixar CSV (baselines)",
      btn_report:"Abrir relatório para impressão",
      export_note:"Arquivos incluem parâmetros atuais: frequência, z, λ, baseline requerida, FoV, layout de antenas e histograma de baselines.",

      sc_h2:"Parâmetros Científicos",
      sc_f:"Frequência (MHz)",
      sc_d:"Diâmetro do elemento d (m)",
      sc_theta:"Resolução desejada θ (min de arco)",
      sc_note:"Suposições cosmológicas: H0=67,7 km/s/Mpc, Ωm=0,31, ΩΛ=0,69, idade do Universo t₀≈13,8 Gyr.",
      sc_out:"Saída",
      sc_red:"Redshift",
      sc_lambda:"Comprimento de onda",
      sc_D:"Baseline para θ",
      sc_fov:"FoV do elemento",
      sc_age:"Idade do Universo em z",

      sim_h2:"Simulador 21‑cm (lúdico)",
      sim_f:"Frequência (MHz)",
      sim_beta:"Índice espectral do foreground β",
      sim_legend:"Curva azul = foreground (potência ≈ ν<sup>−β</sup>) • Curva branca = sinal global de 21‑cm (modelo qualitativo)",

      arr_h2:"Planejador de Array (lúdico)",
      arr_n:"Número de antenas",
      arr_geom:"Geometria",
      arr_grid:"Grade",
      arr_ring:"Anéis",
      arr_rand:"Aleatório",
      arr_note:"Baselines são distâncias normalizadas entre antenas (histograma qualitativo, não cobertura uv real).",

      uv_h2:"plano‑uv (qualitativo)",
      uv_span:"Extensão do array (m)",
      uv_rot:"Rotação sintética (°)",
      uv_note:"λ usa a frequência do painel Ciência. Escala e cobertura são ilustrativas.",

      sh_h2:"Sombra de Rádio no Lado Oculto da Lua",
      sh_p:"Ilustração conceitual do “cone de sombra” de rádio em relação à Terra. Arraste o controle para rotacionar a geometria.",
      sh_phase:"Ângulo de fase orbital",

      foot_left:"Licença MIT • PWA pronta para offline",
      foot_right:"Inspirada no DEX — uso educacional • Sem afiliação oficial"
    }
  };

  const sel = document.getElementById('langSel');
  const htmlEl = document.documentElement;

  function applyLang(lang){
    const dict = LANG[lang] || LANG.it;
    // Update title
    const titleEl = document.querySelector('title[data-i18n="app_title"]');
    if(titleEl) titleEl.textContent = dict.app_title;
    // Replace textContent for [data-i18n]
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(dict[key] !== undefined){
        el.textContent = dict[key];
      }
    });
    // Replace innerHTML for [data-i18n-html]
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{
      const key = el.getAttribute('data-i18n-html');
      if(dict[key] !== undefined){
        el.innerHTML = dict[key];
      }
    });
    // Keep current tab label styles
    // Update lang attribute and store
    htmlEl.setAttribute('lang', lang);
    try{ localStorage.setItem('dex_lang', lang); }catch(_){}
  }

  // Hook select
  if(sel){
    sel.addEventListener('change', ()=> applyLang(sel.value));
    // init from storage or default 'it'
    let lang = 'it';
    try{ lang = localStorage.getItem('dex_lang') || 'it'; }catch(_){}
    sel.value = lang;
    applyLang(lang);
  }
})();
