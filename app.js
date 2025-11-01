(()=>{
'use strict';
function $(q){return document.querySelector(q);}
const errBox = $('#err');
window.addEventListener('error', e=>{ if(errBox){ errBox.classList.remove('hidden'); errBox.textContent = 'JS Error: '+e.message+'\n'+(e.filename||'')+':'+(e.lineno||''); } });
window.addEventListener('unhandledrejection', e=>{ if(errBox){ errBox.classList.remove('hidden'); errBox.textContent = 'Promise Rejection: '+(e.reason&&e.reason.message||e.reason); } });

/* Tabs */
const tabs=document.querySelectorAll('button.tab[data-tab]');
const panels={overview:$('#tab-overview'),science:$('#tab-science'),sim21:$('#tab-sim21'),array:$('#tab-array'),uv:$('#tab-uv'),shield:$('#tab-shield')};
tabs.forEach(b=>b.addEventListener('click',()=>{tabs.forEach(x=>x.classList.remove('active'));b.classList.add('active');Object.values(panels).forEach(p=>p.hidden=true);panels[b.dataset.tab].hidden=false;}));

/* 21-cm Toy */
const chart=$('#chart'),ctx=chart?.getContext('2d'),freq=$('#freq'),beta=$('#beta'),fVal=$('#freqVal'),bVal=$('#betaVal');
function draw21(){ if(!chart) return; const W=chart.width,H=chart.height; ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='#2a3a7a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(40,H-30);ctx.lineTo(W-10,H-30);ctx.moveTo(40,10);ctx.lineTo(40,H-30);ctx.stroke();
  const fmin=10,fmax=50,nu0=10,b=parseFloat(beta.value),A=10000,gAmp=-0.3,gMu=28,gSigma=4;
  const X=f=>40+(W-60)*(f-fmin)/(fmax-fmin); const Y=T=>{const Tmin=-1,Tmax=15000,y=(T-Tmin)/(Tmax-Tmin);return 10+(H-40)*(1-y)};
  ctx.beginPath();ctx.strokeStyle='#4aa3ff';ctx.lineWidth=2; for(let f=fmin;f<=fmax;f+=0.2){const T=A*Math.pow(f/nu0,-b),x=X(f),y=Y(T); if(f===fmin)ctx.moveTo(x,y); else ctx.lineTo(x,y)} ctx.stroke();
  ctx.beginPath();ctx.strokeStyle='#ffffff';ctx.lineWidth=2; for(let f=fmin;f<=fmax;f+=0.2){const T=gAmp*Math.exp(-0.5*Math.pow((f-gMu)/gSigma,2)),x=X(f),y=Y(T); if(f===fmin)ctx.moveTo(x,y); else ctx.lineTo(x,y)} ctx.stroke();
  const fs=parseFloat(freq.value),Tfg=A*Math.pow(fs/nu0,-b),T21=gAmp*Math.exp(-0.5*Math.pow((fs-gMu)/gSigma,2));
  ctx.setLineDash([4,4]);ctx.strokeStyle='#69d08f';ctx.beginPath();ctx.moveTo(X(fs),10);ctx.lineTo(X(fs),H-30);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#eaf1ff';ctx.font='12px system-ui';ctx.fillText('MHz',W-40,H-12);ctx.fillText('K',10,20);ctx.fillText(`Foreground ≈ ${Tfg.toFixed(0)} K`,W-200,20);ctx.fillText(`21‑cm ≈ ${T21.toFixed(2)} K`,W-200,36);
  fVal.textContent=fs+' MHz'; bVal.textContent=b.toFixed(2);
}
freq?.addEventListener('input',draw21); beta?.addEventListener('input',draw21); if(chart&&freq&&beta) draw21();

/* Array Planner */
const arrayView=$('#arrayView'),aCtx=arrayView?.getContext('2d'),baselineView=$('#baselineView'),bCtx=baselineView?.getContext('2d'),nAnt=$('#nAnt'),nVal=$('#nVal'),geom=$('#geom');
function genAntennas(N,type){ const pts=[];
  if(type==='grid'){ const side=Math.ceil(Math.sqrt(N)),s=1/Math.max(1,side-1); for(let i=0;i<side;i++){ for(let j=0;j<side;j++){ if(pts.length>=N) break; pts.push({x:i*s,y:j*s}); } } }
  else if(type==='ring'){ const rings=Math.max(2,Math.ceil(Math.sqrt(N)/3)+1); let used=0;
    for(let r=1;r<=rings;r++){ const R=r/(rings+0.3), k=Math.max(6,Math.round((2*r/(rings*(rings+1)))*N));
      for(let t=0;t<k;t++){ if(used>=N) break; const a=t/k*Math.PI*2; pts.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9,ring:r}); used++; } }
    while(pts.length<N){ const a=Math.random()*Math.PI*2,R=0.95; pts.push({x:0.5+R*Math.cos(a)*0.9,y:0.5+R*Math.sin(a)*0.9,ring:rings}); }
  } else { for(let i=0;i<N;i++) pts.push({x:Math.random(),y:Math.random()}); }
  return pts.map(p=>({x:2*(p.x-0.5),y:2*(p.y-0.5),ring:p.ring||1}));
}
function drawArray(){ if(!arrayView) return; const W=arrayView.width,H=arrayView.height; aCtx.clearRect(0,0,W,H);
  aCtx.fillStyle='#0a1330';aCtx.fillRect(0,0,W,H); aCtx.strokeStyle='#1f2f64';aCtx.strokeRect(10,10,W-20,H-20);
  const N=parseInt(nAnt.value); nVal.textContent=N; const pts=genAntennas(N,geom.value);
  pts.forEach(p=>{ const x=W/2+p.x*(W*0.35),y=H/2+p.y*(H*0.35),h=(210+p.ring*20)%360; aCtx.fillStyle=`hsl(${h} 70% 82%)`; aCtx.beginPath(); aCtx.arc(x,y,5,0,Math.PI*2); aCtx.fill(); aCtx.strokeStyle='#0b1022'; aCtx.lineWidth=1; aCtx.stroke(); });
  const dists=[]; for(let i=0;i<pts.length;i++){ for(let j=i+1;j<pts.length;j++){ const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y; dists.push(Math.sqrt(dx*dx+dy*dy)); } }
  const bins=30,hist=new Array(bins).fill(0); dists.forEach(d=>{ let k=Math.floor(d/Math.SQRT2*bins); if(k<0)k=0; if(k>=bins)k=bins-1; hist[k]++; });
  const w=baselineView.width,h=baselineView.height; bCtx.clearRect(0,0,w,h); bCtx.fillStyle='#0a1330';bCtx.fillRect(0,0,w,h); bCtx.strokeStyle='#1f2f64';bCtx.strokeRect(10,10,w-20,h-20);
  const maxv=Math.max(1,...hist),barW=(w-60)/bins; for(let k=0;k<bins;k++){ const val=hist[k]/maxv,x=30+k*barW,y=h-30 - val*(h-60); bCtx.fillStyle='#4aa3ff'; bCtx.fillRect(x,y,barW-2,h-30-y); }
  // stats
  const minv=Math.min(...dists),maxv=Math.max(...dists),mean=dists.reduce((a,b)=>a+b,0)/dists.length;
  $('#a_min')&&( $('#a_min').textContent=minv.toFixed(3) ); $('#a_max')&&( $('#a_max').textContent=maxv.toFixed(3) ); $('#a_mean')&&( $('#a_mean').textContent=mean.toFixed(3) );
  const span=parseFloat($('#uv_span')?.value||'200'),lambda=( ()=>{const s=$('#s_freq'); return s? 300/parseFloat(s.value||'30'):10; })();
  const Dmax_m=maxv*span,theta_arcmin=(lambda/Dmax_m)*180/Math.PI*60;
  $('#a_Dmax')&&( $('#a_Dmax').textContent=isFinite(Dmax_m)?Dmax_m.toFixed(1):'—' );
  $('#a_theta')&&( $('#a_theta').textContent=isFinite(theta_arcmin)?`${theta_arcmin.toFixed(1)}′`:'—' );
  $('#uv_theta')&&( $('#uv_theta').textContent=isFinite(theta_arcmin)?`${theta_arcmin.toFixed(1)}′`:'—' );
}
nAnt?.addEventListener('input',drawArray); geom?.addEventListener('change',drawArray); if(arrayView&&baselineView) drawArray();

/* RFI Shield */
const shield=$('#shieldView'),sCtx=shield?.getContext('2d'),phase=$('#phase'),phaseVal=$('#phaseVal');
function drawShield(){ if(!shield) return; const W=shield.width,H=shield.height; sCtx.clearRect(0,0,W,H);
  const grad=sCtx.createRadialGradient(W*0.5,0,10,W*0.5,H*0.7,H); grad.addColorStop(0,'#0f1a40'); grad.addColorStop(1,'#0a1126'); sCtx.fillStyle=grad; sCtx.fillRect(0,0,W,H);
  const Ex=W*0.2,Ey=H*0.5,Er=40; sCtx.fillStyle='#2b6cff'; sCtx.beginPath(); sCtx.arc(Ex,Ey,Er,0,Math.PI*2); sCtx.fill();
  const Mx=W*0.65,My=H*0.5,Mr=60; sCtx.fillStyle='#c8c8d0'; sCtx.beginPath(); sCtx.arc(Mx,My,Mr,0,Math.PI*2); sCtx.fill();
  sCtx.fillStyle='rgba(0,0,0,0.35)'; sCtx.beginPath(); sCtx.arc(Mx,My,Mr,-Math.PI/2,Math.PI/2); sCtx.lineTo(Mx,My); sCtx.closePath(); sCtx.fill();
  const ang=parseFloat(phase.value)*Math.PI/180; phaseVal.textContent=parseInt(phase.value)+'°'; sCtx.save(); sCtx.translate(Mx,My); sCtx.rotate(ang);
  sCtx.strokeStyle='rgba(105,208,143,0.9)'; sCtx.fillStyle='rgba(105,208,143,0.12)'; sCtx.beginPath(); sCtx.moveTo(-Mr-10,-20); sCtx.lineTo(W,-80); sCtx.lineTo(W,80); sCtx.lineTo(-Mr-10,20); sCtx.closePath(); sCtx.fill(); sCtx.stroke(); sCtx.restore();
  sCtx.fillStyle='#eaf1ff'; sCtx.font='12px system-ui'; sCtx.fillText('Earth (RFI)',Ex-28,Ey-50); sCtx.fillText('Moon — far side',Mx-40,My-70); sCtx.fillText('Radio shadow (concept)',W*0.52,24);
}
phase?.addEventListener('input',drawShield); if(shield) drawShield();

/* Science Parameters + extras */
const s_freq=$('#s_freq'),s_freqVal=$('#s_freqVal'),s_elem=$('#s_elem'),s_elemVal=$('#s_elemVal'),s_theta=$('#s_theta'),s_thetaVal=$('#s_thetaVal'),s_z=$('#s_z'),s_lambda=$('#s_lambda'),s_D=$('#s_D'),s_fov=$('#s_fov'),s_age=$('#s_age'),s_T21_=$('#s_T21'),s_scale=$('#s_scale');
function Gyr(x){return `${x.toFixed(2)} Gyr`} function arcminToRad(m){return (m/60)*Math.PI/180}
function lookbackGyr(z){ if(z<=0) return 0; const H0=67.7,H0_s=H0*1000/3.085677581e22,tH=1/H0_s/(3600*24*365.25*1e9); const Om=0.31,Ol=0.69,n=600,dz=z/n; let sum=0; for(let i=0;i<=n;i++){const zi=i*dz,E=Math.sqrt(Om*Math.pow(1+zi,3)+Ol),w=(i===0||i===n)?1:(i%2?4:2); sum+= w / ((1+zi)*E);} return (dz/3)*sum*tH; }
function Ez(z){const Om=0.31,Ol=0.69; return Math.sqrt(Om*Math.pow(1+z,3)+Ol)}
function DcMpc(z){ if(z<=0) return 0; const cH=299792.458/67.7; const n=800,dz=z/n; let S=0; for(let i=0;i<=n;i++){const zi=i*dz,w=(i===0||i===n)?1:(i%2?4:2); S += w / Ez(zi);} return cH*(dz/3)*S; }
function updateScience(){ const fMHz=parseFloat(s_freq.value),d=parseFloat(s_elem.value),th_arc=parseFloat(s_theta.value);
  s_freqVal.textContent=`${fMHz} MHz`; s_elemVal.textContent=`${d} m`; s_thetaVal.textContent=`${th_arc}′`;
  const z=1420/fMHz-1; s_z.textContent=z.toFixed(2);
  const lambda=300/fMHz; s_lambda.textContent=`${lambda.toFixed(2)} m`;
  const th=arcminToRad(th_arc); const D=lambda/th; s_D.textContent=`${D.toFixed(1)} m`;
  const fov_deg=(lambda/d)*180/Math.PI; s_fov.textContent=`${fov_deg.toFixed(1)}°`;
  const age=Math.max(0,13.8 - lookbackGyr(z)); s_age.textContent=Gyr(age);
  const gAmp=-0.3,gMu=28,gSigma=4; const T21_mK = gAmp*Math.exp(-0.5*Math.pow((fMHz-gMu)/gSigma,2))*1000; s_T21_ && (s_T21_.textContent=T21_mK.toFixed(1));
  const DA = DcMpc(z)/(1+z); const scale = arcminToRad(th_arc)*DA; s_scale && (s_scale.textContent = scale.toFixed(2));
}
['input','change'].forEach(ev=>{ s_freq?.addEventListener(ev,updateScience); s_elem?.addEventListener(ev,updateScience); s_theta?.addEventListener(ev,updateScience); }); updateScience();

/* Export & Report */
function currentScience(){ const fMHz=parseFloat(s_freq.value),d=parseFloat(s_elem.value),th=parseFloat(s_theta.value),z=1420/fMHz-1,lambda=300/fMHz,D=lambda/arcminToRad(th),fov_deg=(lambda/d)*180/Math.PI; return {fMHz,d_m:d,theta_arcmin:th,z,lambda_m:lambda,baseline_required_m:D,fov_deg}; }
function currentArray(){ const N=parseInt(nAnt.value),g=geom.value,pts=genAntennas(N,g),dists=[]; for(let i=0;i<pts.length;i++){ for(let j=i+1;j<pts.length;j++){ const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y; dists.push(Math.sqrt(dx*dx+dy*dy)); } } const bins=30,hist=new Array(bins).fill(0); dists.forEach(d=>{ let k=Math.floor(d/Math.SQRT2*bins); if(k<0)k=0; if(k>=bins)k=bins-1; hist[k]++; }); return {N,geometry:g,points:pts,baselines:dists,histogram:hist,bins}; }
function download(name,mime,content){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type:mime})); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
$('#exportJSON')?.addEventListener('click',()=>{ const payload={timestamp:new Date().toISOString(), science:currentScience(), array:currentArray()}; download('dex_edu_export.json','application/json',JSON.stringify(payload,null,2)); });
$('#exportCSV')?.addEventListener('click',()=>{ const A=currentArray(); let csv='i,j,dx,dy,dist_norm\\n'; const P=A.points; for(let i=0;i<P.length;i++){ for(let j=i+1;j<P.length;j++){ const dx=(P[i].x-P[j].x).toFixed(6),dy=(P[i].y-P[j].y).toFixed(6),d=Math.sqrt((P[i].x-P[j].x)**2+(P[i].y-P[j].y)**2).toFixed(6); csv+=`${i},${j},${dx},${dy},${d}\\n`; } } download('dex_edu_baselines.csv','text/csv',csv); });
$('#openReport')?.addEventListener('click',()=>{ const S=currentScience(),A=currentArray(); const html=`<!DOCTYPE html><html><head><meta charset='utf-8'><title>DEX‑Edu Report</title><style>body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:24px;color:#111}small{color:#555}table{border-collapse:collapse;margin-top:8px}td,th{border:1px solid #ccc;padding:6px 8px}</style></head><body><h1>DEX‑Edu Report</h1><small>${new Date().toLocaleString()}</small><h2>Science</h2><ul><li>f=${S.fMHz} MHz → z=${S.z.toFixed(2)}, λ=${S.lambda_m.toFixed(2)} m</li><li>θ=${S.theta_arcmin}′ → D≈${S.baseline_required_m.toFixed(1)} m</li><li>FoV≈${S.fov_deg.toFixed(1)}°</li></ul><h2>Array</h2><p>N=${A.N}, geom=${A.geometry}</p><p># baselines = ${A.baselines.length}</p><h3>Prime 20 baseline</h3><table><tr><th>#</th><th>dist_norm</th></tr>${
    A.baselines.slice(0,20).map((d,i)=>`<tr><td>${i+1}</td><td>${(d.toFixed?d.toFixed(6):d)}</td></tr>`).join('')
  }</table><script>window.onload=()=>window.print()</script></body></html>`; const w=window.open('about:blank','_blank'); w.document.write(html); w.document.close(); });

/* uv-plane */
const uvView=$('#uvView'),uvCtx=uvView?.getContext('2d'),uv_span=$('#uv_span'),uv_spanVal=$('#uv_spanVal'),uv_rot=$('#uv_rot'),uv_rotVal=$('#uv_rotVal');
function getLambda(){ return s_freq? 300/parseFloat(s_freq.value||'30'):10 }
function getPts(){ return genAntennas(parseInt(nAnt.value), geom.value).map(p=>({x:p.x,y:p.y})) }
function drawUV(){ if(!uvView) return; const W=uvView.width,H=uvView.height; uvCtx.clearRect(0,0,W,H); uvCtx.fillStyle='#0a1330'; uvCtx.fillRect(0,0,W,H); uvCtx.strokeStyle='#1f2f64'; uvCtx.strokeRect(10,10,W-20,H-20);
  uvCtx.strokeStyle='#20356e'; uvCtx.beginPath(); uvCtx.moveTo(W/2,20); uvCtx.lineTo(W/2,H-20); uvCtx.moveTo(20,H/2); uvCtx.lineTo(W-20,H/2); uvCtx.stroke();
  const span=parseFloat(uv_span.value); uv_spanVal.textContent=span+' m'; const rot=parseFloat(uv_rot.value)*Math.PI/180; uv_rotVal.textContent=parseInt(uv_rot.value)+'°'; const lambda=getLambda();
  const K=(Math.min(W,H)-80)/(2*(span/lambda)); const pts=getPts();
  uvCtx.fillStyle='#eaf1ff';
  for(let i=0;i<pts.length;i++){ for(let j=i+1;j<pts.length;j++){ const bx=(pts[i].x-pts[j].x)*span,by=(pts[i].y-pts[j].y)*span; const bxr=bx*Math.cos(rot)-by*Math.sin(rot), byr=bx*Math.sin(rot)+by*Math.cos(rot); const u=bxr/lambda, v=byr/lambda;
      const plot=(uu,vv)=>{ const x=W/2+uu*K,y=H/2-vv*K; if(x>20 && x<W-20 && y>20 && y<H-20){ uvCtx.beginPath(); uvCtx.arc(x,y,2,0,Math.PI*2); uvCtx.fill(); } };
      plot(u,v); plot(-u,-v);
  } }
  // theta from Dmax
  const dists=[]; for(let i=0;i<pts.length;i++){ for(let j=i+1;j<pts.length;j++){ const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y; dists.push(Math.sqrt(dx*dx+dy*dy)); } }
  const maxv=Math.max(...dists); const Dmax_m=maxv*span; const theta_arcmin=(lambda/Dmax_m)*180/Math.PI*60;
  $('#uv_theta')&&( $('#uv_theta').textContent=isFinite(theta_arcmin)?`${theta_arcmin.toFixed(1)}′`:'—' );
}
uv_span?.addEventListener('input',drawUV); uv_rot?.addEventListener('input',drawUV);
s_freq?.addEventListener('input',drawUV); nAnt?.addEventListener('input',drawUV); geom?.addEventListener('change',drawUV);
drawUV();
$('#btnUvPng')?.addEventListener('click',()=>{ const a=document.createElement('a'); a.href=uvView.toDataURL('image/png'); a.download='uv_plane.png'; a.click(); });

})();