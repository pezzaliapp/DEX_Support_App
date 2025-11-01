/* app.js — DEX Support App (no external libs) */
(() => {
  'use strict';

  // ---- PWA install ----
  let deferredPrompt = null;
  const btnInstall = document.getElementById('btnInstall');
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt = e; if(btnInstall) btnInstall.disabled = false;
  });
  if(btnInstall){
    btnInstall.addEventListener('click', async ()=>{
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      btnInstall.disabled = true;
    });
  }
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }

  // ---- Tabs ----
  const tabs = document.querySelectorAll('button.tab[data-tab]');
  const panels = {
    overview: document.getElementById('tab-overview'),
    sim21: document.getElementById('tab-sim21'),
    array: document.getElementById('tab-array'),
    shield: document.getElementById('tab-shield')
  };
  tabs.forEach(btn=> btn.addEventListener('click', ()=>{
    tabs.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(panels).forEach(p=>p.hidden = true);
    panels[btn.dataset.tab].hidden = false;
  }));

  // ---- Language toggle (IT/EN minimal) ----
  const IT = {
    ov_h2:"Cos'è DEX",
    ov_p1:"DEX è una visione europea per un interferometro radio a ultra‑lunghe lunghezze d'onda (ULW) sulla faccia nascosta della Luna per sondare l'Universo primordiale (Dark Ages/Cosmic Dawn).",
    ov_obj:"Obiettivi",
    ov_o1:"Rilevare segnali debolissimi a 10–50 MHz (linea 21‑cm redshiftata).",
    ov_o2:"Sfruttare il silenzio radio naturale della faccia nascosta.",
    ov_o3:"Sviluppare tecnologie ULW a TRL elevato, con roadmap per missioni future.",
    ov_tools:"Cosa offre questa app",
    ov_t1:"Simulatori didattici (segnale 21‑cm vs foreground).",
    ov_t2:"Planner semplificato per layout d’antenna e baseline.",
    ov_t3:"Visuale concettuale del “radio‑shadow” lunare.",
    ov_note:"Nota: questo prototipo è educativo. I modelli sono semplificati per la massima portabilità (nessuna libreria esterna).",
    ar_h2:"Array Planner (toy)",
    ar_n:"Numero antenne",
    ar_geo:"Geometria",
    ar_note:"Le baseline sono distanze antenna‑antenna normalizzate (istogramma qualitativo, non uv‑coverage reale).",
    sh_h2:"Lunar Far‑Side Radio Shield",
    sh_p1:"Illustrazione concettuale del “cono d’ombra” radio rispetto alla Terra. Trascina il cursore per ruotare la geometria.",
    sh_ang:"Angolo di fase orbitale"
  };
  const EN = {
    ov_h2:"What is DEX",
    ov_p1:"DEX is a European vision for an ultra‑long wavelength (ULW) radio interferometer on the Lunar far side to probe the early Universe (Dark Ages / Cosmic Dawn).",
    ov_obj:"Objectives",
    ov_o1:"Detect extremely faint signals at 10–50 MHz (redshifted 21‑cm line).",
    ov_o2:"Exploit the natural radio quietness of the far side.",
    ov_o3:"Develop high‑TRL ULW technologies with a roadmap for future missions.",
    ov_tools:"What this app offers",
    ov_t1:"Educational simulators (21‑cm vs foreground).",
    ov_t2:"Simplified antenna layout & baseline planner.",
    ov_t3:"Conceptual “radio shadow” visual.",
    ov_note:"Note: this prototype is educational. Models are simplified for portability (no external libraries).",
    ar_h2:"Array Planner (toy)",
    ar_n:"Number of antennas",
    ar_geo:"Geometry",
    ar_note:"Baselines are normalized antenna‑to‑antenna distances (qualitative histogram, not true uv‑coverage).",
    sh_h2:"Lunar Far‑Side Radio Shield",
    sh_p1:"Concept sketch of the radio shadow relative to Earth. Drag the slider to rotate the geometry.",
    sh_ang:"Orbital phase angle"
  };
  function setLang(dict){
    document.querySelectorAll('[data-i]').forEach(el=>{
      const k = el.getAttribute('data-i');
      if(dict[k]) el.textContent = dict[k];
    });
  }
  document.getElementById('btnIT')?.addEventListener('click', ()=>setLang(IT));
  document.getElementById('btnEN')?.addEventListener('click', ()=>setLang(EN));

  // ---- 21-cm Toy Simulator ----
  const chart = document.getElementById('chart');
  const ctx = chart.getContext('2d');
  const freq = document.getElementById('freq');
  const beta = document.getElementById('beta');
  const fVal = document.getElementById('freqVal');
  const bVal = document.getElementById('betaVal');
  function draw21(){
    const W = chart.width, H = chart.height;
    ctx.clearRect(0,0,W,H);
    // axes
    ctx.strokeStyle = '#2a3a7a'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(40,H-30); ctx.lineTo(W-10,H-30); ctx.moveTo(40,10); ctx.lineTo(40,H-30); ctx.stroke();
    // freq axis 10..50 MHz
    const fmin=10, fmax=50;
    // foreground ~ A * (nu/nu0)^(-beta)
    const nu0=10, betaF=parseFloat(beta.value), A=10000; // K at 10 MHz (toy)
    // global 21-cm toy: tiny absorption around ~ 25–30 MHz (very simplified)
    const gAmp = -0.3; // K
    const gMu = 28, gSigma = 4;
    // Draw curves
    function X(f){ return 40 + (W-60)*(f-fmin)/(fmax-fmin); }
    function Y_K(T){ 
      const Tmin=-1.0, Tmax=15000; // map range
      const y = (T - Tmin) / (Tmax - Tmin);
      return 10 + (H-40)*(1-y);
    }
    // Foreground curve
    ctx.beginPath(); ctx.strokeStyle='#4aa3ff'; ctx.lineWidth=2;
    for(let f=fmin; f<=fmax; f+=0.2){
      const T = A * Math.pow(f/nu0, -betaF);
      const x = X(f), y = Y_K(T);
      if(f===fmin) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    // 21-cm global curve (additive to foreground, but show alone in white)
    ctx.beginPath(); ctx.strokeStyle='#ffffff'; ctx.lineWidth=2;
    for(let f=fmin; f<=fmax; f+=0.2){
      const T21 = gAmp * Math.exp(-0.5*((f-gMu)/gSigma)**2);
      const x = X(f), y = Y_K(T21);
      if(f===fmin) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    // Mark selected frequency
    const fsel = parseFloat(freq.value);
    const Tfg = A * Math.pow(fsel/nu0, -betaF);
    const T21 = gAmp * Math.exp(-0.5*((fsel-gMu)/gSigma)**2);
    const y1 = Y_K(Tfg), y2 = Y_K(T21);
    ctx.strokeStyle='#69d08f'; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(X(fsel),10); ctx.lineTo(X(fsel),H-30); ctx.stroke(); ctx.setLineDash([]);
    // Labels
    ctx.fillStyle='#eaf1ff'; ctx.font='12px system-ui';
    ctx.fillText('MHz', W-40, H-12);
    ctx.fillText('K', 10, 20);
    ctx.fillText(`Foreground ≈ ${Tfg.toFixed(0)} K`, W-200, 20);
    ctx.fillText(`21‑cm ≈ ${T21.toFixed(2)} K`, W-200, 36);
    fVal.textContent = fsel+' MHz';
    bVal.textContent = betaF.toFixed(2);
  }
  freq.addEventListener('input', draw21);
  beta.addEventListener('input', draw21);
  draw21();

  // ---- Array Planner ----
  const arrayView = document.getElementById('arrayView');
  const aCtx = arrayView.getContext('2d');
  const baselineView = document.getElementById('baselineView');
  const bCtx = baselineView.getContext('2d');
  const nAnt = document.getElementById('nAnt');
  const nVal = document.getElementById('nVal');
  const geom = document.getElementById('geom');
  function genAntennas(N, type){
    const pts = [];
    if(type==='grid'){
      const side = Math.ceil(Math.sqrt(N));
      const s = 1/(side-1||1);
      for(let i=0;i<side;i++){
        for(let j=0;j<side;j++){
          if(pts.length>=N) break;
          pts.push({x:i*s, y:j*s});
        }
      }
    }else if(type==='ring'){
      const rings = Math.ceil(Math.sqrt(N)/2);
      let count=0;
      for(let r=1;r<=rings;r++){
        const R = r/(rings+0.5);
        const k = Math.max(6, Math.round(2*Math.pi*R*8));
        for(let t=0;t<k;t++){
          if(count>=N) break;
          const a = (t/k)*Math.PI*2;
          pts.push({x:0.5+R*Math.cos(a), y:0.5+R*Math.sin(a)});
          count++;
        }
      }
    }else{
      for(let i=0;i<N;i++){
        pts.push({x:Math.random(), y:Math.random()});
      }
    }
    // normalize to [-1,1] box
    return pts.map(p=>({x:2*(p.x-0.5), y:2*(p.y-0.5)}));
  }
  function drawArray(){
    const W=arrayView.width, H=arrayView.height;
    aCtx.clearRect(0,0,W,H);
    aCtx.fillStyle='#0a1330'; aCtx.fillRect(0,0,W,H);
    aCtx.strokeStyle='#1f2f64'; aCtx.strokeRect(10,10,W-20,H-20);
    const N=parseInt(nAnt.value); nVal.textContent=N;
    const pts=genAntennas(N, geom.value);
    // draw points
    aCtx.fillStyle='#eaf1ff';
    pts.forEach(p=>{
      const x= W/2 + p.x*(W*0.35);
      const y= H/2 + p.y*(H*0.35);
      aCtx.beginPath(); aCtx.arc(x,y,4,0,Math.PI*2); aCtx.fill();
    });
    // baselines (distances)
    const dists=[];
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
        dists.push(Math.sqrt(dx*dx+dy*dy));
      }
    }
    // histogram
    const bins=30, hist=new Array(bins).fill(0);
    dists.forEach(d=>{
      let k=Math.floor(d/Math.SQRT2 * bins);
      if(k<0)k=0; if(k>=bins)k=bins-1;
      hist[k]++;
    });
    const maxv = Math.max(1, ...hist);
    const w = baselineView.width, h = baselineView.height;
    bCtx.clearRect(0,0,w,h);
    bCtx.fillStyle='#0a1330'; bCtx.fillRect(0,0,w,h);
    bCtx.strokeStyle='#1f2f64'; bCtx.strokeRect(10,10,w-20,h-20);
    const barW = (w-60)/bins;
    for(let k=0;k<bins;k++){
      const val = hist[k]/maxv;
      const x = 30 + k*barW;
      const y = h-30 - val*(h-60);
      bCtx.fillStyle='#4aa3ff';
      bCtx.fillRect(x, y, barW-2, h-30 - y);
    }
  }
  nAnt.addEventListener('input', drawArray);
  geom.addEventListener('change', drawArray);
  drawArray();

  // ---- RFI Shield (concept) ----
  const shield = document.getElementById('shieldView');
  const sCtx = shield.getContext('2d');
  const phase = document.getElementById('phase');
  const phaseVal = document.getElementById('phaseVal');
  function drawShield(){
    const W=shield.width,H=shield.height;
    sCtx.clearRect(0,0,W,H);
    // space bg
    const grad = sCtx.createRadialGradient(W*0.5,0,10, W*0.5, H*0.7, H);
    grad.addColorStop(0,'#0f1a40'); grad.addColorStop(1,'#0a1126');
    sCtx.fillStyle=grad; sCtx.fillRect(0,0,W,H);
    // Earth
    const Ex=W*0.2,Ey=H*0.5,Er=40;
    sCtx.fillStyle='#2b6cff'; sCtx.beginPath(); sCtx.arc(Ex,Ey,Er,0,Math.PI*2); sCtx.fill();
    // Moon
    const Mx=W*0.65,My=H*0.5,Mr=60;
    sCtx.fillStyle='#c8c8d0'; sCtx.beginPath(); sCtx.arc(Mx,My,Mr,0,Math.PI*2); sCtx.fill();
    // Far-side (simple hatched overlay)
    sCtx.fillStyle='rgba(0,0,0,0.35)';
    sCtx.beginPath(); sCtx.arc(Mx,My,Mr, -Math.PI/2, Math.PI/2); sCtx.lineTo(Mx,My); sCtx.closePath(); sCtx.fill();
    // Radio shadow cone (from Earth across Moon, rotated by phase)
    const ang = parseFloat(phase.value) * Math.PI/180;
    phaseVal.textContent = parseInt(phase.value)+'°';
    sCtx.save();
    sCtx.translate(Mx,My);
    sCtx.rotate(ang);
    sCtx.strokeStyle='rgba(105,208,143,0.9)';
    sCtx.fillStyle='rgba(105,208,143,0.12)';
    sCtx.beginPath();
    sCtx.moveTo(-Mr-10, -20);
    sCtx.lineTo(W, -80);
    sCtx.lineTo(W, 80);
    sCtx.lineTo(-Mr-10, 20);
    sCtx.closePath();
    sCtx.fill(); sCtx.stroke();
    sCtx.restore();
    // labels
    sCtx.fillStyle='#eaf1ff'; sCtx.font='12px system-ui';
    sCtx.fillText('Earth (RFI)', Ex-28, Ey-50);
    sCtx.fillText('Moon — far side', Mx-40, My-70);
    sCtx.fillText('Radio shadow (concept)', W*0.52, 24);
  }
  phase.addEventListener('input', drawShield);
  drawShield();
})();