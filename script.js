// ── 3D wordmark mouse tilt (combined with scroll-zoom via shared state) ──
const v3d=document.getElementById('volta3d');
window._voltaTilt={rx:0,ry:0};
window._voltaScroll={scale:1,ty:0,op:1};
function applyVoltaTransform(){
  if(!v3d)return;
  const t=window._voltaTilt, s=window._voltaScroll;
  v3d.style.transform=`scale(${s.scale}) translateY(${s.ty}px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`;
  v3d.style.opacity=s.op;
}
if(v3d){
  document.addEventListener('mousemove',e=>{
    // tilt only meaningful while hero in view (top of page)
    if(window.scrollY>500)return;
    window._voltaTilt.rx=(e.clientY/window.innerHeight-0.5)*-35;
    window._voltaTilt.ry=(e.clientX/window.innerWidth-0.5)*50;
    applyVoltaTransform();
  });
}

// ── HERO CANVAS: quiet ambient glow ──
const canvas=document.getElementById('heroCanvas'),ctx=canvas.getContext('2d');
let W,H,mouse={x:0,y:0};
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);
document.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});

// A few soft drifting light orbs — ambient
const orbs=[
  {x:0.28,y:0.34,r:0.42,t:0,sp:0.0015,col:[240,180,0],a:0.18},
  {x:0.72,y:0.62,r:0.5,t:2,sp:0.0011,col:[240,180,0],a:0.12},
  {x:0.5,y:0.5,r:0.35,t:4,sp:0.0018,col:[240,180,0],a:0.09},
];
// Floating depth particles for motion
const parts=[];
for(let i=0;i<70;i++)parts.push({
  x:Math.random(),y:Math.random(),z:Math.random(),
  t:Math.random()*Math.PI*2,sp:0.0004+Math.random()*0.0010,
  drift:(Math.random()-0.5)*0.0003
});
let t=0;
function drawHero(){
  t+=0.005;ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0c0d11';ctx.fillRect(0,0,W,H);
  const px=(mouse.x/W-0.5),py=(mouse.y/H-0.5);
  orbs.forEach(o=>{
    o.t+=o.sp;
    const ox=(o.x+Math.sin(o.t)*0.05+px*0.04)*W;
    const oy=(o.y+Math.cos(o.t*0.8)*0.05+py*0.04)*H;
    const rad=o.r*Math.max(W,H);
    const g=ctx.createRadialGradient(ox,oy,0,ox,oy,rad);
    g.addColorStop(0,`rgba(${o.col[0]},${o.col[1]},${o.col[2]},${o.a})`);
    g.addColorStop(1,`rgba(${o.col[0]},${o.col[1]},${o.col[2]},0)`);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  });
  // depth particles
  parts.forEach(p=>{
    p.t+=p.sp;p.y-=p.sp*0.5;p.x+=p.drift;
    if(p.y<-0.05){p.y=1.05;p.x=Math.random();}
    const depth=0.4+p.z*0.6;
    const wx=(p.x+px*0.03*depth)*W;
    const wy=(p.y+py*0.03*depth)*H;
    const r=depth*2.2;
    const a=(0.15+Math.sin(p.t)*0.12)*depth;
    ctx.beginPath();ctx.arc(wx,wy,r,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,220,80,${a})`;ctx.fill();
  });
  const v=ctx.createRadialGradient(W*0.5,H*0.45,H*0.3,W*0.5,H*0.5,H*0.9);
  v.addColorStop(0,'rgba(12,13,17,0)');v.addColorStop(1,'rgba(8,9,12,0.7)');
  ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  requestAnimationFrame(drawHero);
}
drawHero();
const pcont=document.getElementById('particles');
if(pcont){
setInterval(()=>{
  const p=document.createElement('div');p.className='particle';
  const s=Math.random()*3+1;
  p.style.cssText=`width:${s}px;height:${s}px;left:${Math.random()*100}%;background:rgba(245,197,24,${0.15+Math.random()*0.4});animation-duration:${4+Math.random()*6}s;animation-delay:${Math.random()}s;`;
  pcont.appendChild(p);setTimeout(()=>p.remove(),8000);
},450);
}

// ── DATA ──
const WA='255688058564';
const waLink=n=>`https://wa.me/${WA}?text=${encodeURIComponent(`Hi Volta! 👋 Ninataka kujua zaidi kuhusu *${n}*. Je, inapatikana?`)}`;

// Brand definitions with color theming
const brands=[
  {key:'iphone',label:'Apple iPhone',count:'11 · 12 · 13 Series',color:'#a8a8a8',glow:'rgba(168,168,168,0.2)',
   svg:`<svg viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.4 130.3-317.4 260.6-317.4 70.7 0 130.3 46.4 174.4 46.4 42.8 0 109.7-49.1 188.8-49.1 30.5 0 133.5 2.6 208.9 104.5zm-262.9-168.2c31.8-38.3 54.4-91.2 54.4-144 0-7.7-.6-15.4-1.9-21.8C523.7 12.2 467.5 44.4 431.6 89.5c-30.5 38.3-59.7 91.2-59.7 145.8 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 43.4 0 97.7-29.9 140.8-82.1z"/></svg>`},
  {key:'samsung',label:'Samsung',count:'S · Note · A Series',color:'#1428A0',glow:'rgba(20,40,160,0.3)',
   svg:`<svg viewBox="0 0 370 55" fill="white"><text x="0" y="46" font-family="Arial" font-weight="700" font-size="48" letter-spacing="-1">SAMSUNG</text></svg>`},
  {key:'pixel',label:'Google Pixel',count:'Pixel 3 — Pixel 9',color:'#4285F4',glow:'rgba(66,133,244,0.25)',
   svg:`<svg viewBox="0 0 130 45" fill="white"><circle cx="15" cy="22" r="12" fill="#EA4335"/><circle cx="40" cy="22" r="12" fill="#4285F4"/><circle cx="65" cy="22" r="12" fill="#FBBC05"/><circle cx="90" cy="22" r="12" fill="#34A853"/><text x="108" y="28" font-family="Arial" font-size="11" fill="white" font-weight="600">Pixel</text></svg>`},
  {key:'sony',label:'Sony Xperia',count:'XZ · 1 · 5 Series',color:'#ffffff',glow:'rgba(255,255,255,0.15)',
   svg:`<svg viewBox="0 0 200 55" fill="white"><text x="0" y="46" font-family="Arial" font-weight="700" font-size="52" letter-spacing="2">SONY</text></svg>`},
  {key:'japanese',label:'Sharp / Aquos',count:'Aquos · Arrow · Digno',color:'#e60026',glow:'rgba(230,0,38,0.25)',
   svg:`<svg viewBox="0 0 240 55" fill="white"><text x="0" y="46" font-family="Arial" font-weight="700" font-size="46" letter-spacing="1">SHARP</text></svg>`},
  {key:'redmi',label:'Xiaomi Redmi',count:'10A · 14C · 15C',color:'#ff6900',glow:'rgba(255,105,0,0.25)',
   svg:`<svg viewBox="0 0 80 55" fill="white"><rect x="2" y="5" width="7" height="45" rx="3.5"/><rect x="13" y="5" width="7" height="45" rx="3.5"/><path d="M24 5 Q52 5 52 27.5 Q52 50 24 50" stroke="white" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M35 5 Q72 5 72 27.5 Q72 50 35 50" stroke="white" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`},
];

// Phone designs per brand — screen colors, body colors, camera styles
const phoneDesigns={
  iphone:{body:'#2a2a2a',screen:'#000',screenH:120,w:60,notch:{w:22,h:7},border:'#444',camera:'circle',camColor:'#111',accent:'#888'},
  samsung:{body:'#1a1a2e',screen:'#050510',screenH:118,w:58,notch:{w:0,h:0},border:'#2a3a7a',camera:'triple',camColor:'#0a0a20',accent:'#1428A0'},
  pixel:{body:'#1a1a1a',screen:'#000',screenH:115,w:58,notch:{w:0,h:0},border:'#333',camera:'bar',camColor:'#0d0d0d',accent:'#4285F4'},
  sony:{body:'#1c1c1c',screen:'#000',screenH:130,w:52,notch:{w:0,h:0},border:'#3a3a3a',camera:'single',camColor:'#111',accent:'#888'},
  japanese:{body:'#202020',screen:'#000',screenH:122,w:56,notch:{w:0,h:0},border:'#3a3a3a',camera:'single',camColor:'#111',accent:'#e60026'},
  redmi:{body:'#1e1e1e',screen:'#000',screenH:118,w:58,notch:{w:16,h:6},border:'#333',camera:'dual',camColor:'#111',accent:'#ff6900'},
};

// Generate CSS phone SVG for each brand
function makePhoneSVG(cat, scale=1, angle='front'){
  const d=phoneDesigns[cat]||phoneDesigns.iphone;
  const w=d.w*scale, sh=d.screenH*scale, margin=3*scale, notchW=(d.notch.w||0)*scale, notchH=(d.notch.h||0)*scale;
  const totalH=sh+(margin*2)+(notchH)+(8*scale);
  const br=10*scale, sr=7*scale;

  // Camera module based on brand
  let camModule='';
  const cs=8*scale;
  if(d.camera==='triple'){
    camModule=`<rect x="${w-cs*2-4*scale}" y="${sh*0.05}" width="${cs*1.6}" height="${cs*2.8}" rx="${cs*0.4}" fill="${d.camColor}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
    <circle cx="${w-cs*1.5-4*scale}" cy="${sh*0.11}" r="${cs*0.35}" fill="#222"/><circle cx="${w-cs*1.5-4*scale}" cy="${sh*0.19}" r="${cs*0.35}" fill="#222"/><circle cx="${w-cs*1.5-4*scale}" cy="${sh*0.27}" r="${cs*0.35}" fill="#222"/>`;
  } else if(d.camera==='bar'){
    camModule=`<rect x="${w*0.2}" y="${sh*0.02+margin}" width="${w*0.6}" height="${cs*1.4}" rx="${cs*0.6}" fill="${d.camColor}" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
    <circle cx="${w*0.38}" cy="${sh*0.02+margin+cs*0.7}" r="${cs*0.38}" fill="#222"/><circle cx="${w*0.62}" cy="${sh*0.02+margin+cs*0.7}" r="${cs*0.32}" fill="#222"/>`;
  } else if(d.camera==='dual'){
    camModule=`<rect x="${w-cs*2-3*scale}" y="${sh*0.05}" width="${cs*1.5}" height="${cs*2}" rx="${cs*0.4}" fill="${d.camColor}"/>
    <circle cx="${w-cs*1.4-3*scale}" cy="${sh*0.1}" r="${cs*0.36}" fill="#222"/><circle cx="${w-cs*1.4-3*scale}" cy="${sh*0.18}" r="${cs*0.28}" fill="#222"/>`;
  } else {
    camModule=`<circle cx="${w-cs*0.9-3*scale}" cy="${sh*0.1+margin}" r="${cs*0.5}" fill="${d.camColor}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><circle cx="${w-cs*0.9-3*scale}" cy="${sh*0.1+margin}" r="${cs*0.3}" fill="#1a1a1a"/>`;
  }

  // Screen gradient
  const screenGrad=`linear-gradient(180deg, ${d.accent}22 0%, #00000088 40%, #000000aa 100%)`;

  const transform = angle==='back'?`scale(-1,1) translate(-${w},0)`:angle==='side'?`skewX(-10)`:'';

  return `<svg viewBox="0 0 ${w} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="transform:${transform};overflow:visible">
    <defs>
      <linearGradient id="bodyG_${cat}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${d.border}"/>
        <stop offset="100%" stop-color="${d.body}"/>
      </linearGradient>
      <linearGradient id="screenG_${cat}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${d.accent}" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.9"/>
      </linearGradient>
      <filter id="glow_${cat}">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Body -->
    <rect x="0" y="0" width="${w}" height="${totalH}" rx="${br}" fill="url(#bodyG_${cat})" />
    <!-- Body highlight -->
    <rect x="1" y="1" width="${w*0.5}" height="${totalH-2}" rx="${br-1}" fill="rgba(255,255,255,0.04)" />
    <!-- Screen -->
    <rect x="${margin}" y="${margin+notchH}" width="${w-margin*2}" height="${sh}" rx="${sr}" fill="${d.screen}" />
    <rect x="${margin}" y="${margin+notchH}" width="${w-margin*2}" height="${sh}" rx="${sr}" fill="url(#screenG_${cat})" />
    <!-- Screen shine -->
    <rect x="${margin+2*scale}" y="${margin+notchH+2*scale}" width="${(w-margin*2)*0.4}" height="${sh-4*scale}" rx="${sr-1}" fill="rgba(255,255,255,0.02)" />
    <!-- Notch -->
    ${notchW>0?`<rect x="${(w-notchW)/2}" y="${margin}" width="${notchW}" height="${notchH+sr}" rx="${notchH*0.4}" fill="${d.body}" />`:''}
    <!-- Status bar dots -->
    ${notchW===0?`<circle cx="${w*0.5}" cy="${margin+notchH+8*scale}" r="${1.5*scale}" fill="rgba(255,255,255,0.15)"/>`:''}
    <!-- Camera module -->
    ${camModule}
    <!-- Home bar -->
    <rect x="${w*0.3}" y="${margin+notchH+sh+4*scale}" width="${w*0.4}" height="${2.5*scale}" rx="${1.5*scale}" fill="rgba(255,255,255,0.2)" />
    <!-- Side buttons -->
    <rect x="-${2*scale}" y="${totalH*0.3}" width="${2*scale}" height="${12*scale}" rx="${scale}" fill="rgba(255,255,255,0.15)" />
    <rect x="${w}" y="${totalH*0.25}" width="${2*scale}" height="${8*scale}" rx="${scale}" fill="rgba(255,255,255,0.12)" />
    <rect x="${w}" y="${totalH*0.36}" width="${2*scale}" height="${8*scale}" rx="${scale}" fill="rgba(255,255,255,0.12)" />
  </svg>`;
}

// ── SPECS ──
const specsDB={
  'iPhone 11':{specs:{'Display':'6.1" LCD IPS, 1792×828','Chip':'Apple A13 Bionic','RAM':'4 GB','Battery':'3110 mAh','Camera':'12MP Wide + 12MP Ultra','Selfie':'12MP TrueDepth','OS':'iOS 13 → 16','Charging':'18W Fast','5G':'No (LTE)','Weight':'194g'},caps:['Face ID','Dual Camera','4K Video','Dolby Atmos','NFC','Wi-Fi 6']},
  'iPhone 11 Pro Max':{specs:{'Display':'6.5" OLED Super Retina XDR','Chip':'Apple A13 Bionic','RAM':'4 GB','Battery':'3969 mAh','Camera':'Triple 12MP Wide+Ultra+Tele','Selfie':'12MP TrueDepth','OS':'iOS 13 → 16','Charging':'18W Fast','5G':'No (LTE)','Weight':'226g'},caps:['Face ID','Triple Camera','4K 60fps','Night Mode','Portrait Mode','NFC']},
  'iPhone 12 Pro':{specs:{'Display':'6.1" OLED Super Retina XDR','Chip':'Apple A14 Bionic','RAM':'6 GB','Battery':'2815 mAh','Camera':'Triple 12MP + LiDAR','Selfie':'12MP TrueDepth','OS':'iOS 14 → 17','Charging':'20W MagSafe','5G':'Yes','Weight':'189g'},caps:['Face ID','LiDAR Scanner','5G','MagSafe','ProRAW','Night Mode']},
  'iPhone 12 Pro Max':{specs:{'Display':'6.7" OLED Super Retina XDR','Chip':'Apple A14 Bionic','RAM':'6 GB','Battery':'3687 mAh','Camera':'Triple 12MP + LiDAR','Selfie':'12MP TrueDepth','OS':'iOS 14 → 17','Charging':'20W MagSafe','5G':'Yes','Weight':'226g'},caps:['Face ID','LiDAR','5G','MagSafe','ProRAW','Dolby Vision']},
  'iPhone 13':{specs:{'Display':'6.1" OLED Super Retina XDR','Chip':'Apple A15 Bionic','RAM':'4 GB','Battery':'3227 mAh','Camera':'Dual 12MP Wide+Ultra','Selfie':'12MP','OS':'iOS 15 → 17','Charging':'20W MagSafe','5G':'Yes','Weight':'174g'},caps:['5G','MagSafe','Cinematic Mode','Face ID','Night Mode','Dolby Vision']},
  'iPhone 13 Pro Max':{specs:{'Display':'6.7" ProMotion 120Hz OLED','Chip':'Apple A15 Bionic','RAM':'6 GB','Battery':'4352 mAh','Camera':'Triple 12MP+LiDAR+3x Tele','Selfie':'12MP TrueDepth','OS':'iOS 15 → 17','Charging':'27W MagSafe','5G':'Yes','Weight':'240g'},caps:['ProMotion 120Hz','LiDAR','5G','MagSafe','ProRAW','ProRes Video','Macro Photo']},
  'Samsung S23':{specs:{'Display':'6.1" Dynamic AMOLED 120Hz','Chip':'Snapdragon 8 Gen 2','RAM':'8 GB','Battery':'3900 mAh','Camera':'Triple 50+12+10MP','Selfie':'12MP','OS':'Android 13 → 15','Charging':'25W','5G':'Yes','Weight':'168g'},caps:['5G','120Hz Display','Night Mode','100x Zoom','Wi-Fi 6E','Bixby AI','DeX']},
  'Samsung S22':{specs:{'Display':'6.1" Dynamic AMOLED 120Hz','Chip':'Snapdragon 8 Gen 1','RAM':'8 GB','Battery':'3700 mAh','Camera':'Triple 50+12+10MP','Selfie':'10MP','OS':'Android 12 → 14','Charging':'25W','5G':'Yes','Weight':'167g'},caps:['5G','120Hz Adaptive','Expert RAW','30x Zoom','Wi-Fi 6E','NFC Pay']},
  'Samsung S21':{specs:{'Display':'6.2" Dynamic AMOLED 120Hz','Chip':'Snapdragon 888','RAM':'8 GB','Battery':'4000 mAh','Camera':'Triple 64+12+10MP','Selfie':'10MP','OS':'Android 11 → 14','Charging':'25W','5G':'Yes','Weight':'169g'},caps:['5G','120Hz','8K Video','Director View','Wi-Fi 6','NFC','DeX']},
  'Samsung S21 Ultra':{specs:{'Display':'6.8" Dynamic AMOLED 120Hz','Chip':'Snapdragon 888','RAM':'12 GB','Battery':'5000 mAh','Camera':'Quad 108+12+10+10MP','Selfie':'40MP','OS':'Android 11 → 14','Charging':'45W','5G':'Yes','Weight':'229g'},caps:['S Pen','108MP Camera','100x Zoom','8K Video','5G','Wi-Fi 6E']},
  'Samsung Note 20 Ultra':{specs:{'Display':'6.9" Dynamic AMOLED 120Hz','Chip':'Snapdragon 865+','RAM':'12 GB','Battery':'4500 mAh','Camera':'Triple 108+12+12MP','Selfie':'10MP','OS':'Android 10 → 13','Charging':'45W','5G':'Yes','Weight':'208g'},caps:['S Pen','108MP Camera','100x Zoom','8K Video','Wi-Fi 6','DeX']},
  'Samsung A54':{specs:{'Display':'6.4" Super AMOLED 120Hz','Chip':'Exynos 1380','RAM':'8 GB','Battery':'5000 mAh','Camera':'Triple 50+12+5MP','Selfie':'32MP','OS':'Android 13 → 16','Charging':'25W','5G':'Yes','Weight':'202g'},caps:['5G','120Hz AMOLED','IP67','OIS Camera','Wi-Fi 6','NFC','4yr Updates']},
  'Samsung A34':{specs:{'Display':'6.6" Super AMOLED 120Hz','Chip':'Dimensity 1080','RAM':'8 GB','Battery':'5000 mAh','Camera':'Triple 48+8+5MP','Selfie':'13MP','OS':'Android 13 → 16','Charging':'25W','5G':'Yes','Weight':'199g'},caps:['5G','120Hz AMOLED','IP67','OIS Camera','NFC','4yr Updates']},
  'Google Pixel 6a':{specs:{'Display':'6.1" OLED 60Hz','Chip':'Google Tensor G1','RAM':'6 GB','Battery':'4410 mAh','Camera':'Dual 12.2+12MP','Selfie':'8MP','OS':'Android 12 → 15','Charging':'18W','5G':'Yes','Weight':'178g'},caps:['Tensor AI','Magic Eraser','Real Tone','5G','Live Translate','Call Screen']},
  'Google Pixel 7':{specs:{'Display':'6.3" OLED 90Hz','Chip':'Google Tensor G2','RAM':'8 GB','Battery':'4355 mAh','Camera':'Dual 50+12MP','Selfie':'10.8MP','OS':'Android 13 → 16','Charging':'20W','5G':'Yes','Weight':'197g'},caps:['Tensor G2','Photo Unblur','Real Tone','5G','Call Screen','Macro Focus']},
  'Google Pixel 7 Pro':{specs:{'Display':'6.7" LTPO OLED 120Hz','Chip':'Google Tensor G2','RAM':'12 GB','Battery':'5000 mAh','Camera':'Triple 50+48+12MP','Selfie':'10.8MP','OS':'Android 13 → 16','Charging':'30W','5G':'Yes','Weight':'212g'},caps:['5x Optical Zoom','30x Super Res','Tensor G2','Photo Unblur','5G','Wi-Fi 6E']},
  'Google Pixel 8':{specs:{'Display':'6.2" OLED 120Hz','Chip':'Google Tensor G3','RAM':'8 GB','Battery':'4575 mAh','Camera':'Dual 50+12MP','Selfie':'10.5MP','OS':'Android 14 → 17','Charging':'27W','5G':'Yes','Weight':'187g'},caps:['Tensor G3','Best Take','Magic Eraser','Audio Eraser','5G','Wi-Fi 6E']},
  'Google Pixel 8 Pro':{specs:{'Display':'6.7" LTPO OLED 1-120Hz','Chip':'Google Tensor G3','RAM':'12 GB','Battery':'5050 mAh','Camera':'Triple 50+48+48MP','Selfie':'10.5MP','OS':'Android 14 → 17','Charging':'30W','5G':'Yes','Weight':'213g'},caps:['Pro Camera','Tensor G3','Best Take','Video Boost','5G','Wi-Fi 6E','IP68','7yr Updates']},
  'Google Pixel 9':{specs:{'Display':'6.3" OLED 120Hz','Chip':'Google Tensor G4','RAM':'12 GB','Battery':'4700 mAh','Camera':'Dual 50+48MP','Selfie':'10.5MP','OS':'Android 14 → 18','Charging':'27W','5G':'Yes','Weight':'198g'},caps:['Tensor G4','Gemini AI','Add Me Feature','Video Boost','5G','Wi-Fi 7','Satellite SOS']},
  'Google Pixel 9 Pro XL':{specs:{'Display':'6.8" LTPO OLED 1-120Hz','Chip':'Google Tensor G4','RAM':'16 GB','Battery':'5060 mAh','Camera':'Triple 50+48+48MP','Selfie':'42MP','OS':'Android 14 → 18','Charging':'37W','5G':'Yes','Weight':'221g'},caps:['Tensor G4','Gemini AI','48MP Tele','Video Boost','5G','Wi-Fi 7','IP68','7yr Updates']},
  'Sony Xperia 1 IV':{specs:{'Display':'6.5" 4K OLED 120Hz','Chip':'Snapdragon 8 Gen 1','RAM':'12 GB','Battery':'5000 mAh','Camera':'Triple 12MP Variable Tele','Selfie':'12MP','OS':'Android 12 → 14','Charging':'30W','5G':'Yes','Weight':'185g'},caps:['4K OLED','Variable Zoom','ProCinema','5G','3.5mm Jack','Hi-Res Audio','IP68']},
  'Sony Xperia 5 IV':{specs:{'Display':'6.1" FHD+ OLED 120Hz','Chip':'Snapdragon 8 Gen 1','RAM':'8 GB','Battery':'5000 mAh','Camera':'Triple 12MP W+U+T','Selfie':'12MP','OS':'Android 12 → 14','Charging':'30W','5G':'Yes','Weight':'172g'},caps:['Compact Flagship','120Hz OLED','5G','3.5mm Jack','Hi-Res Audio','IP68','Eye AF']},
  'Aquos R7':{specs:{'Display':'6.6" Pro IGZO OLED 240Hz','Chip':'Snapdragon 8 Gen 1','RAM':'12 GB','Battery':'5000 mAh','Camera':'50MP Leica 1-inch','Selfie':'12.6MP','OS':'Android 12','Charging':'65W','5G':'Yes','Weight':'207g'},caps:['Leica Camera','1-inch Sensor','240Hz Display','5G','IP68','Wi-Fi 6E','15W Wireless']},
  'Redmi 14C':{specs:{'Display':'6.88" IPS LCD 90Hz','Chip':'MediaTek Helio G85','RAM':'16 GB','Battery':'5160 mAh','Camera':'50MP + 0.08MP','Selfie':'13MP','OS':'Android 14 + MIUI 14','Charging':'18W','5G':'No (LTE)','Weight':'211g'},caps:['90Hz Display','Large Battery','AI Camera','Face Unlock','Dual SIM','MicroSD']},
  'Redmi 15C':{specs:{'Display':'6.88" IPS LCD 90Hz','Chip':'Snapdragon 4 Gen 2','RAM':'16 GB','Battery':'5160 mAh','Camera':'50MP AI','Selfie':'13MP','OS':'Android 14 + MIUI 14','Charging':'18W','5G':'No (LTE)','Weight':'210g'},caps:['Snapdragon 4 Gen 2','90Hz Display','50MP AI Camera','Large Battery','Dual SIM','MicroSD']},
};

const products=[
  {id:0,cat:'iphone',cond:'used',name:'iPhone 11 64GB',short:'Used · Dual SIM · Black',price:'TZS 510,000',specKey:'iPhone 11'},
  {id:1,cat:'iphone',cond:'used',name:'iPhone 11 128GB',short:'Used · Dual SIM · White',price:'TZS 560,000',specKey:'iPhone 11'},
  {id:2,cat:'iphone',cond:'used',name:'iPhone 11 Pro Max 64GB',short:'Used · DM · Midnight Green',price:'TZS 690,000',specKey:'iPhone 11 Pro Max'},
  {id:3,cat:'iphone',cond:'used',name:'iPhone 11 Pro Max 256GB',short:'Used · DM · Space Grey',price:'TZS 750,000',specKey:'iPhone 11 Pro Max'},
  {id:4,cat:'iphone',cond:'used',name:'iPhone 12 Pro 128GB',short:'Used · DM · Pacific Blue',price:'TZS 760,000',specKey:'iPhone 12 Pro'},
  {id:5,cat:'iphone',cond:'used',name:'iPhone 12 Pro 256GB',short:'Used · DM · Gold',price:'TZS 810,000',specKey:'iPhone 12 Pro'},
  {id:6,cat:'iphone',cond:'used',name:'iPhone 12 Pro Max 128GB',short:'Used · DM · Silver',price:'TZS 840,000',specKey:'iPhone 12 Pro Max'},
  {id:7,cat:'iphone',cond:'used',name:'iPhone 12 Pro Max 256GB',short:'Used · Clean · Graphite',price:'TZS 930,000',specKey:'iPhone 12 Pro Max'},
  {id:8,cat:'iphone',cond:'used',name:'iPhone 13 128GB',short:'Used · DM · Midnight',price:'TZS 790,000',specKey:'iPhone 13'},
  {id:9,cat:'iphone',cond:'used',name:'iPhone 13 Pro Max 128GB',short:'Used · DM · Alpine Green',price:'TZS 970,000',specKey:'iPhone 13 Pro Max'},
  {id:10,cat:'samsung',cond:'new',name:'Samsung Note 20 5G',short:'Boxed 📦 · Mystic Black',price:'TZS 570,000',specKey:'Samsung Note 20 Ultra'},
  {id:11,cat:'samsung',cond:'new',name:'Samsung A32 128GB',short:'Boxed · 2 SIMs 📦',price:'TZS 385,000',specKey:'Samsung A34'},
  {id:12,cat:'samsung',cond:'new',name:'Samsung A34 128GB',short:'Boxed 📦 · Awesome Graphite',price:'TZS 570,000',specKey:'Samsung A34'},
  {id:13,cat:'samsung',cond:'used',name:'Samsung S23 256GB',short:'Used · Clean · Phantom Black',price:'TZS 880,000',specKey:'Samsung S23'},
  {id:14,cat:'samsung',cond:'used',name:'Samsung S22 256GB',short:'Used · Clean · Green',price:'TZS 610,000',specKey:'Samsung S22'},
  {id:15,cat:'samsung',cond:'used',name:'Samsung S21 128GB',short:'Used · Clean · Phantom Grey',price:'TZS 510,000',specKey:'Samsung S21'},
  {id:16,cat:'samsung',cond:'used',name:'Samsung S21 Ultra 128GB',short:'Used · Phantom Black',price:'TZS 625,000',specKey:'Samsung S21 Ultra'},
  {id:17,cat:'samsung',cond:'used',name:'Samsung Note 20 Ultra 256GB',short:'Used · Mystic Bronze',price:'TZS 545,000',specKey:'Samsung Note 20 Ultra'},
  {id:18,cat:'samsung',cond:'used',name:'Samsung A54 128GB',short:'Used · Awesome Graphite',price:'TZS 490,000',specKey:'Samsung A54'},
  {id:19,cat:'samsung',cond:'used',name:'Samsung A34 128GB',short:'Used · Awesome Graphite',price:'TZS 450,000',specKey:'Samsung A34'},
  {id:20,cat:'pixel',cond:'used',name:'Google Pixel 6a 128GB',short:'Used · Chalk',price:'TZS 440,000',specKey:'Google Pixel 6a'},
  {id:21,cat:'pixel',cond:'used',name:'Google Pixel 7 256GB',short:'Used · Snow',price:'TZS 580,000',specKey:'Google Pixel 7'},
  {id:22,cat:'pixel',cond:'used',name:'Google Pixel 7 Pro 512GB',short:'Used · Clean · Obsidian',price:'TZS 800,000',specKey:'Google Pixel 7 Pro'},
  {id:23,cat:'pixel',cond:'used',name:'Google Pixel 8 128GB',short:'Used · Hazel',price:'TZS 770,000',specKey:'Google Pixel 8'},
  {id:24,cat:'pixel',cond:'used',name:'Google Pixel 8 Pro 256GB',short:'Used · Porcelain',price:'TZS 1,020,000',specKey:'Google Pixel 8 Pro'},
  {id:25,cat:'pixel',cond:'used',name:'Google Pixel 9 128GB',short:'Used · Obsidian',price:'TZS 1,170,000',specKey:'Google Pixel 9'},
  {id:26,cat:'pixel',cond:'new',name:'Google Pixel 8 Pro 128GB',short:'Brand New 📦 · Bay',price:'TZS 1,080,000',specKey:'Google Pixel 8 Pro'},
  {id:27,cat:'pixel',cond:'new',name:'Google Pixel 9 Pro XL 256GB',short:'Brand New 📦 · Obsidian',price:'TZS 1,720,000',specKey:'Google Pixel 9 Pro XL'},
  {id:28,cat:'sony',cond:'used',name:'Sony Xperia 5 IV 128GB',short:'Used · Black',price:'TZS 425,000',specKey:'Sony Xperia 5 IV'},
  {id:29,cat:'sony',cond:'used',name:'Sony Xperia 1 IV 256GB',short:'Used · Frosted Black',price:'TZS 570,000',specKey:'Sony Xperia 1 IV'},
  {id:30,cat:'japanese',cond:'used',name:'Aquos R7 256GB',short:'Used · Clean · Black',price:'TZS 410,000',specKey:'Aquos R7'},
  {id:31,cat:'redmi',cond:'new',name:'Redmi 14C 256GB',short:'Brand New · 16GB RAM 📦',price:'TZS 310,000',specKey:'Redmi 14C'},
  {id:32,cat:'redmi',cond:'new',name:'Redmi 15C 256GB',short:'Brand New · 16GB RAM 📦',price:'TZS 340,000',specKey:'Redmi 15C'},
];

function getBrand(cat){return brands.find(b=>b.key===cat);}

// ── RENDER BRAND CARDS ──
function renderBrands(){
  document.getElementById('brandGrid').innerHTML=brands.map(b=>`
    <div class="brand-card" style="--brand-color:${b.color};--brand-glow:${b.glow};" onclick="filterAndScroll('${b.key}')">
      <div class="sweep"></div>
      <div class="burst"></div>
      <div class="brand-card-inner">
        <div class="logo-3d-wrap">${b.svg}</div>
        <div class="brand-name">${b.label}</div>
        <div class="brand-count">${b.count}</div>
      </div>
      <div class="brand-arrow">→</div>
    </div>`).join('');

  document.querySelectorAll('.brand-card').forEach(c=>{
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-0.5,y=(e.clientY-r.top)/r.height-0.5;
      c.style.transform=`perspective(700px) rotateY(${x*18}deg) rotateX(${-y*18}deg) translateZ(10px) translateY(-6px)`;
    });
    c.addEventListener('mouseleave',()=>{c.style.transform='';});
  });
}

// ── FILTER BAR ──
function renderFilterBar(){
  document.getElementById('filterBar').innerHTML=
    `<button class="fb active" onclick="setFilter('all',this)">All</button>`+
    brands.map(b=>`<button class="fb" data-key="${b.key}" onclick="setFilter('${b.key}',this)"><span class="fb-logo">${b.svg}</span>${b.label.split(' ')[0]}</button>`).join('')+
    `<button class="fb" onclick="setFilter('new',this)">📦 Mpya</button><button class="fb" onclick="setFilter('used',this)">Used</button>`;
}

// ── CARD HTML — Three angle views of CSS phone ──
function phoneAngles(cat, small=true){
  const sc=small?0.55:0.9;
  return `
    <div class="phone-angles" style="perspective:400px">
      <div class="angle-phone" style="opacity:0.55;transform:rotateY(20deg) scale(0.82)">${makePhoneSVG(cat,sc,'back')}</div>
      <div class="angle-phone">${makePhoneSVG(cat,sc,'front')}</div>
      <div class="angle-phone" style="opacity:0.55;transform:rotateY(-20deg) scale(0.82)">${makePhoneSVG(cat,sc,'side')}</div>
    </div>
    <div class="angle-label">
      <span class="albl">Back</span><span class="albl" style="color:rgba(245,197,24,0.6)">Front</span><span class="albl">Side</span>
    </div>`;
}

function cardHTML(p){
  const brand=getBrand(p.cat);
  const badge=p.cond==='new'?'<span class="pbadge bn">📦 Mpya</span>':'<span class="pbadge bu">Used</span>';
  const d=phoneDesigns[p.cat]||phoneDesigns.iphone;
  const media=p.img
    ?`<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" loading="lazy"/>`
    :phoneAngles(p.cat,true);
  const priceHTML=p.origPrice
    ?`<div><div class="p-price">${p.price}</div><div style="font-size:0.72rem;text-decoration:line-through;color:rgba(255,255,255,0.35)">${p.origPrice}</div></div>`
    :`<div class="p-price">${p.price}</div>`;
  return `<div class="pc-wrap"><div class="product-card" id="pc${p.id}">
    <div style="position:relative">
      <div class="p-img" style="background:linear-gradient(135deg,${d.body}44,${d.camColor}88)">
        ${media}
        <div class="brand-wm">${brand?brand.svg:''}</div>
        <div class="shine"></div>
        ${badge}
        ${p.origPrice?'<span class="pbadge" style="left:auto;right:0.6rem;top:2.4rem;background:#e05555;color:#fff">SALE</span>':''}
      </div>
    </div>
    <div class="p-body">
      <div class="p-cat-logo">${brand?brand.svg:''}</div>
      <div class="p-name">${p.name}</div>
      <div class="p-specs-short">${p.short}</div>
      <div class="p-foot">
        ${priceHTML}
        <div class="p-actions">
          <button class="spec-btn" onclick="openModal(${p.id})">📋 Specs</button>
          <a class="wa-btn" href="${waLink(p.name)}" target="_blank">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Order
          </a>
        </div>
      </div>
    </div>
  </div></div>`;
}

// ── MODAL ──
let currentAngle='front';
function openModal(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  const brand=getBrand(p.cat);
  const fallback=specsDB[p.specKey]||{specs:{},caps:[]};
  const specsObj=(p.detailedSpecs&&Object.keys(p.detailedSpecs).length)?p.detailedSpecs:(fallback.specs||{});
  const caps=(p.capabilities&&p.capabilities.length)?p.capabilities:(fallback.caps||[]);
  const d=phoneDesigns[p.cat]||phoneDesigns.iphone;
  const specRows=Object.entries(specsObj).map(([k,v])=>`<div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('');
  const capTags=caps.map(c=>`<span class="cap-tag">${c}</span>`).join('');
  const priceHTML=p.origPrice
    ?`<div class="m-price">${p.price} <span style="font-size:0.75rem;text-decoration:line-through;color:#888;font-weight:400">${p.origPrice}</span></div>`
    :`<div class="m-price">${p.price}</div>`;
  currentAngle='front';

  document.getElementById('modalBody').innerHTML=`
    <div>
      <div class="m-phone-stage" id="mStage">
        <div class="m-phone-large" id="mPhone">${makePhoneSVG(p.cat,0.9,'front')}</div>
      </div>
      <div class="m-angle-btns">
        <button class="m-angle-btn active" onclick="switchAngle('front','${p.cat}',this)">Front</button>
        <button class="m-angle-btn" onclick="switchAngle('back','${p.cat}',this)">Back</button>
        <button class="m-angle-btn" onclick="switchAngle('side','${p.cat}',this)">Side</button>
      </div>
    </div>
    <div class="m-info">
      <div class="m-brand-logo">${brand?brand.svg:''}</div>
      <div class="m-name">${p.name}</div>
      <span class="m-cond ${p.cond==='new'?'new':'used'}">${p.cond==='new'?'📦 Brand New':'Used'}</span>
      ${priceHTML}
      <div class="m-specs-title">📱 Specifications</div>
      <div>${specRows||'<div style="color:#666;font-size:0.8rem">Maelezo zaidi kwenye WhatsApp</div>'}</div>
      ${capTags?`<div class="m-caps"><div class="m-cap-title">⚡ Capabilities</div><div class="cap-tags">${capTags}</div></div>`:''}
      <a class="m-wa-btn" href="${waLink(p.name)}" target="_blank">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Order on WhatsApp
      </a>
    </div>`;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function switchAngle(angle,cat,btn){
  document.getElementById('mPhone').innerHTML=makePhoneSVG(cat,0.9,angle);
  document.querySelectorAll('.m-angle-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function closeModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow='';
}
document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)closeModal();});

// ── TILT ──
function apply3DTilt(){
  document.querySelectorAll('.product-card').forEach(c=>{
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-0.5,y=(e.clientY-r.top)/r.height-0.5;
      c.style.transform=`perspective(800px) rotateY(${x*12}deg) rotateX(${-y*12}deg) translateZ(8px)`;
    });
    c.addEventListener('mouseleave',()=>{c.style.transform='';});
  });
}

let cf='all',cs='';
function renderProducts(list){
  const grid=document.getElementById('productsGrid'),none=document.getElementById('noResults');
  if(!list.length){grid.innerHTML='';none.style.display='block';return;}
  none.style.display='none';grid.innerHTML=list.map(cardHTML).join('');apply3DTilt();
  // If this grid uses stagger reveal, ensure it's marked in-view after re-render
  // (backend sync / filter) so cards never get stuck invisible.
  if(grid.classList.contains('stagger')){
    const r=grid.getBoundingClientRect();
    if(r.top < window.innerHeight && r.bottom > 0) grid.classList.add('in');
  }
}
function applyFilters(){
  let list=products;
  if(cf==='new')list=list.filter(p=>p.cond==='new');
  else if(cf==='used')list=list.filter(p=>p.cond==='used');
  else if(cf!=='all')list=list.filter(p=>p.cat===cf);
  if(cs){const q=cs.toLowerCase();list=list.filter(p=>p.name.toLowerCase().includes(q)||p.short.toLowerCase().includes(q));}
  renderProducts(list);
}
function setFilter(f,btn){cf=f;document.querySelectorAll('.fb').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');applyFilters();}
function handleSearch(){cs=document.getElementById('searchInput').value;applyFilters();}
function filterAndScroll(key){setFilter(key,null);document.querySelector(`.fb[data-key="${key}"]`)?.classList.add('active');document.getElementById('products').scrollIntoView({behavior:'smooth'});}

const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)';}});},{threshold:0.1});
// Init handled by DOMContentLoaded

// ── HOME APPLIANCES ──
// Pricing: market price from Jiji/Impala TZ + profit margin
// Products under 500k → +90,000 to 100,000 TZS profit
// Products above 700k → +250,000 TZS profit

const appliances=[
  // TVs
  {cat:'tv',icon:'📺',name:'Hisense 32" Smart TV',brand:'Hisense',specs:'HD Ready · VIDAA OS · Wi-Fi · YouTube/Netflix',price:'TZS 540,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'Hisense 40" Full HD Smart TV',brand:'Hisense',specs:'1080p · VIDAA OS · Wi-Fi · Bluetooth · HDMI×2',price:'TZS 730,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'Hisense 43" 4K UHD Smart TV',brand:'Hisense',specs:'4K Ultra HD · VIDAA OS · Dolby Vision · Wi-Fi',price:'TZS 1,150,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'Hisense 50" 4K QLED Smart TV',brand:'Hisense',specs:'4K QLED · Quantum Dot · HDR · Wi-Fi · Bluetooth',price:'TZS 1,450,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'Hisense 55" 4K UHD Smart TV',brand:'Hisense',specs:'4K Ultra HD · VIDAA · Dolby Audio · 3×HDMI',price:'TZS 1,800,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'Samsung 43" Full HD Smart TV',brand:'Samsung',specs:'Full HD · Tizen OS · PurColor · HDR · Wi-Fi',price:'TZS 980,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'Samsung 55" 4K QLED Smart TV',brand:'Samsung',specs:'4K QLED · Quantum Processor · HDR10+ · Tizen',price:'TZS 2,150,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'LG 43" Full HD Smart TV',brand:'LG',specs:'Full HD · WebOS · ThinQ AI · Bluetooth · Wi-Fi',price:'TZS 920,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'LG 55" 4K UHD Smart TV',brand:'LG',specs:'4K UHD · WebOS · Filmmaker Mode · Dolby Vision',price:'TZS 2,250,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'TCL 32" Smart TV',brand:'TCL',specs:'HD · Android TV · Google Assistant · Wi-Fi',price:'TZS 490,000',badge:'📦 New'},
  {cat:'tv',icon:'📺',name:'TCL 43" 4K Android TV',brand:'TCL',specs:'4K UHD · Android 11 · Google Play · Dolby Audio',price:'TZS 970,000',badge:'📦 New'},

  // Fridges
  {cat:'fridge',icon:'❄️',name:'Hisense 90L Single Door Fridge',brand:'Hisense',specs:'90L · Direct Cool · Energy Saving · Low Noise',price:'TZS 590,000',badge:'📦 New'},
  {cat:'fridge',icon:'❄️',name:'Hisense 150L Single Door Fridge',brand:'Hisense',specs:'150L · Direct Cool · Mechanical Control · LED Light',price:'TZS 700,000',badge:'📦 New'},
  {cat:'fridge',icon:'❄️',name:'Hisense 175L Double Door Fridge',brand:'Hisense',specs:'175L · No Frost · LED · Bottom Freezer',price:'TZS 870,000',badge:'📦 New'},
  {cat:'fridge',icon:'❄️',name:'Hisense 245L Double Door Fridge',brand:'Hisense',specs:'245L · No Frost · Total No Frost · Humidity Control',price:'TZS 1,070,000',badge:'📦 New'},
  {cat:'fridge',icon:'❄️',name:'Samsung 300L Double Door Fridge',brand:'Samsung',specs:'300L · Twin Cooling · No Frost · Digital Inverter',price:'TZS 1,450,000',badge:'📦 New'},
  {cat:'fridge',icon:'❄️',name:'Samsung 400L Side-by-Side Fridge',brand:'Samsung',specs:'400L · Twin Cooling Plus · No Frost · Ice Maker',price:'TZS 2,250,000',badge:'📦 New'},
  {cat:'fridge',icon:'❄️',name:'LG 190L Double Door Fridge',brand:'LG',specs:'190L · Smart Inverter · No Frost · Moist Balance Crisper',price:'TZS 980,000',badge:'📦 New'},
  {cat:'fridge',icon:'❄️',name:'Midea 80L Bar Fridge',brand:'Midea',specs:'80L · Compact · Reversible Door · Quiet Operation',price:'TZS 480,000',badge:'📦 New'},

  // Washing Machines
  {cat:'washing',icon:'🫧',name:'Hisense 7KG Top Load Washer',brand:'Hisense',specs:'7KG · Fully Automatic · Bubble Clean · Smart Diagnosis',price:'TZS 760,000',badge:'📦 New'},
  {cat:'washing',icon:'🫧',name:'Hisense 8KG Front Load Washer',brand:'Hisense',specs:'8KG · Front Load · 1200RPM · Inverter Motor · Steam',price:'TZS 1,100,000',badge:'📦 New'},
  {cat:'washing',icon:'🫧',name:'Hisense 10KG Top Load Washer',brand:'Hisense',specs:'10KG · Fully Auto · 8 Wash Programs · Child Lock',price:'TZS 1,050,000',badge:'📦 New'},
  {cat:'washing',icon:'🫧',name:'Midea 7KG Manual Twin Tub',brand:'Midea',specs:'7KG · Semi-Auto · Twin Tub · Drain Pump · Spin',price:'TZS 570,000',badge:'📦 New'},
  {cat:'washing',icon:'🫧',name:'Midea 8KG Auto Top Load',brand:'Midea',specs:'8KG · Fully Automatic · 8 Programs · LED Display',price:'TZS 840,000',badge:'📦 New'},
  {cat:'washing',icon:'🫧',name:'Midea 10KG Automatic Top Load',brand:'Midea',specs:'10KG · Fully Auto · Inverter · Auto Restart · Steam',price:'TZS 1,170,000',badge:'📦 New'},
  {cat:'washing',icon:'🫧',name:'Samsung 7KG Front Load Washer',brand:'Samsung',specs:'7KG · Front Load · AddWash · Eco Bubble · 1400RPM',price:'TZS 1,250,000',badge:'📦 New'},
  {cat:'washing',icon:'🫧',name:'LG 8KG Front Load Washer',brand:'LG',specs:'8KG · AI DD Technology · Steam · ThinQ Wi-Fi · A+++',price:'TZS 1,450,000',badge:'📦 New'},

  // Blenders & Juicers
  {cat:'blender',icon:'🍹',name:'Kenwood Heavy Duty Blender 3.5L',brand:'Kenwood',specs:'3.5L · 1500W · Stainless Steel Blade · 3 Speeds',price:'TZS 195,000',badge:'📦 New'},
  {cat:'blender',icon:'🍹',name:'Philips Daily Blender 2L',brand:'Philips',specs:'2L · 700W · 2 Speeds + Pulse · Ice Crushing',price:'TZS 180,000',badge:'📦 New'},
  {cat:'blender',icon:'🍹',name:'Philips Viva Blender 2L',brand:'Philips',specs:'2L · 1200W · ProBlend Tech · 3 Speeds · BPA Free',price:'TZS 225,000',badge:'📦 New'},
  {cat:'blender',icon:'🍹',name:'Kenwood 4-in-1 Juicer Extractor',brand:'Kenwood',specs:'Juicer + Mincer + Grinder + Blender · 800W · 2L',price:'TZS 260,000',badge:'📦 New'},
  {cat:'blender',icon:'🍹',name:'Moulinex Easy Blender 1.5L',brand:'Moulinex',specs:'1.5L · 500W · Compact · Easy Clean · 2 Speeds',price:'TZS 145,000',badge:'📦 New'},
  {cat:'blender',icon:'🍹',name:'Decakila Slow Juicer 500W',brand:'Decakila',specs:'500W · Cold Press · 75RPM · Preserves Nutrients',price:'TZS 310,000',badge:'📦 New'},
  {cat:'blender',icon:'🍹',name:'Sokany Commercial Blender 2L',brand:'Sokany',specs:'2L · 2200W · Heavy Duty · 9500W Copper Motor',price:'TZS 185,000',badge:'📦 New'},

  // Fans
  {cat:'fan',icon:'💨',name:'Dolphin 16" Stand Fan',brand:'Dolphin',specs:'16" · 3 Speed · Oscillating · Adjustable Height · 55W',price:'TZS 115,000',badge:'📦 New'},
  {cat:'fan',icon:'💨',name:'Dolphin 18" Pedestal Stand Fan',brand:'Dolphin',specs:'18" · 5 Speed · Remote Control · Timer · 85W',price:'TZS 205,000',badge:'📦 New'},
  {cat:'fan',icon:'💨',name:'Nikai Tower Fan 40" Remote',brand:'Nikai',specs:'40" · 45W · Remote · 3 Speeds · 59dB Silent · Timer',price:'TZS 250,000',badge:'📦 New'},
  {cat:'fan',icon:'💨',name:'Dolphin Ceiling Fan 36"',brand:'Dolphin',specs:'36" · 5 Blades · Copper Motor · Low Voltage · Silent',price:'TZS 165,000',badge:'📦 New'},
  {cat:'fan',icon:'💨',name:'Midea Rechargeable Stand Fan',brand:'Midea',specs:'16" · Rechargeable · AC/DC · Remote · 8hr Battery',price:'TZS 230,000',badge:'📦 New'},
  {cat:'fan',icon:'💨',name:'Mewe Rechargeable Stand Fan 18"',brand:'Mewe',specs:'18" · Remote Control · Solar Compatible · AC/DC',price:'TZS 195,000',badge:'📦 New'},
  {cat:'fan',icon:'💨',name:'Dolphin 30" Wall Fan Industrial',brand:'Dolphin',specs:'30" · Super Quiet Motor · 3 Speeds · Heavy Duty',price:'TZS 280,000',badge:'📦 New'},

  // Microwaves
  {cat:'microwave',icon:'📡',name:'Midea 20L Microwave Oven',brand:'Midea',specs:'20L · 700W · Reheat · Defrost · 5 Power Levels',price:'TZS 295,000',badge:'📦 New'},
  {cat:'microwave',icon:'📡',name:'Hisense 20L Microwave Oven',brand:'Hisense',specs:'20L · 700W · 5 Power Levels · Defrost · Child Lock',price:'TZS 310,000',badge:'📦 New'},
  {cat:'microwave',icon:'📡',name:'Midea 25L Digital Microwave',brand:'Midea',specs:'25L · 900W · Digital Display · 10 Power Levels · Grill',price:'TZS 380,000',badge:'📦 New'},
  {cat:'microwave',icon:'📡',name:'Samsung 28L Convection Microwave',brand:'Samsung',specs:'28L · 900W · Convection · Grill · Slim Fry · LED',price:'TZS 750,000',badge:'📦 New'},
  {cat:'microwave',icon:'📡',name:'LG 25L NeoChef Microwave',brand:'LG',specs:'25L · 1000W · Smart Inverter · EasyClean · Anti-Bacteria',price:'TZS 680,000',badge:'📦 New'},
  {cat:'microwave',icon:'📡',name:'Kenwood 20L Microwave Oven',brand:'Kenwood',specs:'20L · 800W · 5 Power Levels · Defrost · Timer',price:'TZS 330,000',badge:'📦 New'},

  // Sound Systems
  {cat:'sound',icon:'🔊',name:'Sony Mini Hi-Fi System',brand:'Sony',specs:'80W · Bluetooth · USB · CD · FM Radio · LED Display',price:'TZS 450,000',badge:'📦 New'},
  {cat:'sound',icon:'🔊',name:'LG XBoom 360 Portable Speaker',brand:'LG',specs:'120W · 360° Sound · Bluetooth 5.0 · IPX4 · LED',price:'TZS 650,000',badge:'📦 New'},
  {cat:'sound',icon:'🔊',name:'Samsung Soundbar HW-T420',brand:'Samsung',specs:'150W · 2.1ch · Bluetooth · DTS Virtual:X · USB',price:'TZS 850,000',badge:'📦 New'},
  {cat:'sound',icon:'🔊',name:'JBL PartyBox 110 Speaker',brand:'JBL',specs:'160W · Bluetooth · IPX4 · Dynamic Light Show · 12hr',price:'TZS 1,200,000',badge:'📦 New'},
  {cat:'sound',icon:'🔊',name:'Philips Party Speaker TAX4207',brand:'Philips',specs:'700W · Bluetooth · USB · FM · Karaoke Ready · LED',price:'TZS 580,000',badge:'📦 New'},
  {cat:'sound',icon:'🔊',name:'Nikai 3-in-1 Home Theatre 5.1',brand:'Nikai',specs:'5.1ch · 1000W · Bluetooth · USB · HDMI · FM Radio',price:'TZS 750,000',badge:'📦 New'},
  {cat:'sound',icon:'🔊',name:'Hisense Soundbar HS214',brand:'Hisense',specs:'120W · 2.1ch · Bluetooth · Optical · HDMI ARC',price:'TZS 480,000',badge:'📦 New'},
];

// Brand colors per appliance brand
const appBrandColors={
  'Hisense':'linear-gradient(135deg,#0a1628,#1a3a6e)',
  'Samsung':'linear-gradient(135deg,#0a0e2a,#1428A0)',
  'LG':'linear-gradient(135deg,#1a0010,#8b001a)',
  'TCL':'linear-gradient(135deg,#001a10,#003d22)',
  'Midea':'linear-gradient(135deg,#0a1a2a,#004080)',
  'Sony':'linear-gradient(135deg,#1a1a1a,#333)',
  'Kenwood':'linear-gradient(135deg,#1a1000,#3d2800)',
  'Philips':'linear-gradient(135deg,#001a1a,#003d3d)',
  'Moulinex':'linear-gradient(135deg,#1a0a00,#3d1f00)',
  'Decakila':'linear-gradient(135deg,#0a1a0a,#1a3d1a)',
  'Sokany':'linear-gradient(135deg,#1a0a0a,#3d1414)',
  'Dolphin':'linear-gradient(135deg,#001028,#00255c)',
  'Nikai':'linear-gradient(135deg,#1a1428,#2d225c)',
  'Mewe':'linear-gradient(135deg,#001a10,#004025)',
  'JBL':'linear-gradient(135deg,#1a0800,#3d1a00)',
};

function appCardHTML(a){
  const grad=appBrandColors[a.brand]||'linear-gradient(135deg,#181818,#222)';
  const media=a.img
    ?`<img src="${a.img}" alt="${a.name}" style="width:100%;height:100%;object-fit:cover" loading="lazy"/>`
    :`<div style="font-size:3rem;filter:drop-shadow(0 0 15px rgba(245,197,24,0.4))">${a.icon}</div>
      <div style="font-size:0.65rem;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase">${a.brand}</div>`;
  const priceHTML=a.origPrice
    ?`<div><div class="p-price">${a.price}</div><div style="font-size:0.72rem;text-decoration:line-through;color:rgba(255,255,255,0.35)">${a.origPrice}</div></div>`
    :`<div class="p-price">${a.price}</div>`;
  return `<div class="pc-wrap"><div class="product-card" style="cursor:default">
    <div style="position:relative">
      <div class="p-img" style="background:${grad};flex-direction:column;gap:6px;">
        ${media}
      </div>
      <span class="pbadge bn">${a.badge}</span>
      ${a.origPrice?'<span class="pbadge" style="left:auto;right:8px;top:2.4rem;background:#e05555;color:#fff">SALE</span>':''}
    </div>
    <div class="p-body">
      <div style="font-size:0.62rem;color:var(--yellow);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.35rem">${a.cat.toUpperCase()}</div>
      <div class="p-name">${a.name}</div>
      <div class="p-specs-short">${a.specs}</div>
      <div class="p-foot">
        ${priceHTML}
        <a class="wa-btn" href="${waLink(a.name)}" target="_blank">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Order
        </a>
      </div>
    </div>
  </div></div>`;
}

function filterApps(cat,btn){
  const list=cat==='all'?appliances:appliances.filter(a=>a.cat===cat);
  document.getElementById('appGrid').innerHTML=list.map(appCardHTML).join('');
  document.querySelectorAll('#appFilterBar .fb').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  // apply 3D tilt to new cards
  document.querySelectorAll('#appGrid .product-card').forEach(c=>{
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-0.5,y=(e.clientY-r.top)/r.height-0.5;
      c.style.transform=`perspective(800px) rotateY(${x*12}deg) rotateX(${-y*12}deg) translateZ(8px)`;
    });
    c.addEventListener('mouseleave',()=>{c.style.transform='';});
  });
}
filterApps('all',document.querySelector('#appFilterBar .fb'));

// ── LANGUAGE SYSTEM ──
const LANG = {
  en: {
    // Nav
    nav_brands:"Brands", nav_phones:"Phones", nav_appliances:"Appliances", nav_why:"Why Volta", nav_location:"Location", nav_wa:"WhatsApp",
    // Hero
    hero_tag:"⚡ Dar es Salaam's Electronics Hub",
    hero_sub:"Affordable phones, genuine quality, fast service. Order directly via WhatsApp.",
    hero_btn1:"Browse Products", hero_btn2:"WhatsApp Now →",
    // Stats
    stat1:"Phones Available", stat2:"Brands", stat3:"Genuine", stat4:"WhatsApp Response",
    // Brand section
    brand_label:"Our Brands", brand_title:"Shop by Brand", brand_sub:"Tap a brand to see all available products.",
    // Products section
    prod_label:"In stock now",
    prod_title:"Our Products",
    prod_sub:"Tap 📋 Specs to see full details and features of each phone.",
    search_ph:"Search... iPhone 13, Pixel 7, S23...",
    filter_all:"All", filter_new:"📦 New", filter_used:"Used",
    // Appliances
    app_label:"Home Appliances",
    app_title:"Home Appliances",
    app_sub:"TVs, fridges, washing machines, blenders, fans, microwaves and sound systems. Best prices in Dar es Salaam.",
    app_all:"All", app_tv:"📺 TVs", app_fridge:"❄️ Fridge", app_wash:"🫧 Washing", app_blend:"🍹 Blenders", app_fan:"💨 Fans", app_micro:"📡 Microwave", app_sound:"🔊 Sound",
    // Why Volta
    why_label:"Our Promise",
    why_title:"Why Volta?",
    why_sub:"We know what you need — great phones, fair prices, fast service.",
    why1_t:"100% Genuine", why1_d:"No fakes. Every device is tested before sale.",
    why2_t:"WhatsApp Direct", why2_d:"Just message us — we handle everything fast.",
    why3_t:"Fair Prices", why3_d:"Competitive prices. Open to fair negotiation.",
    why4_t:"Fast Service", why4_d:"Quick replies and delivery available in Dar es Salaam.",
    // CTA
    cta_title:"Questions? Call Us!", cta_sub:"Chat with us on WhatsApp — we reply fast and are ready to help you get the best phone.", cta_btn:"Start WhatsApp Chat",
    // Location
    loc_label:"Where We Are",
    loc_title:"Find Us",
    loc_sub:"We are in Dar es Salaam — come visit or WhatsApp us and we'll deliver.",
    loc_addr_t:"Address", loc_addr:"1110 Uhuru Street\nDar es Salaam, Tanzania",
    loc_hours_t:"Working Hours",
    loc_hours:"Mon – Fri  ·  8:00 AM – 7:00 PM\nSaturday  ·  8:00 AM – 6:00 PM\nSunday    ·  10:00 AM – 4:00 PM",
    loc_contact_t:"Contact", loc_contact:"+255 688 058 564\nAvailable on WhatsApp",
    loc_dir_btn:"🗺️ Get Directions", loc_wa_btn:"Ask for Directions on WhatsApp",
    // Footer
    footer_copy:"© 2026 Volta. Dar es Salaam, Tanzania 🇹🇿",
    // Spec modal
    spec_title:"📱 Specifications", cap_title:"⚡ Capabilities", order_btn:"Order on WhatsApp",
    badge_new:"📦 New", badge_used:"Used",
    // Brand strip
    brand_strip:"⚡ Setting a new standard in the electronics hub space · Premium & Reliable",
  },
  sw: {
    // Nav
    nav_brands:"Brands", nav_phones:"Simu", nav_appliances:"Vifaa", nav_why:"Kwa Nini Volta", nav_location:"Mahali", nav_wa:"WhatsApp",
    // Hero
    hero_tag:"⚡ Kituo cha Elektroniki Dar es Salaam",
    hero_sub:"Simu za bei nafuu, genuine quality, huduma ya haraka. Order moja kwa moja kupitia WhatsApp.",
    hero_btn1:"Tazama Bidhaa", hero_btn2:"WhatsApp Sasa →",
    // Stats
    stat1:"Simu Zinapatikana", stat2:"Brands", stat3:"Genuine", stat4:"Majibu ya Haraka",
    // Brand section
    brand_label:"Brands Tunazo", brand_title:"Nunua kwa Brand", brand_sub:"Gusa brand unayotaka — tutakuonyesha bidhaa zote zinazopatikana.",
    // Products section
    prod_label:"In stock now",
    prod_title:"Bidhaa Zetu",
    prod_sub:"Bonyeza 📋 Specs kuona maelezo kamili na vipengele vya kila simu.",
    search_ph:"Tafuta... iPhone 13, Pixel 7, S23...",
    filter_all:"Zote", filter_new:"📦 Mpya", filter_used:"Used",
    // Appliances
    app_label:"Vifaa vya Nyumbani",
    app_title:"Home Appliances",
    app_sub:"TVs, friji, washing machines, blenders, fans, microwaves na sound systems. Bei bora Dar es Salaam.",
    app_all:"Zote", app_tv:"📺 TVs", app_fridge:"❄️ Friji", app_wash:"🫧 Washing", app_blend:"🍹 Blenders", app_fan:"💨 Fans", app_micro:"📡 Microwave", app_sound:"🔊 Sound",
    // Why Volta
    why_label:"Ahadi Yetu",
    why_title:"Kwa Nini Volta?",
    why_sub:"Tunajua unachohitaji — simu nzuri, bei ya haki, huduma ya haraka.",
    why1_t:"100% Genuine", why1_d:"Hakuna feki. Kila simu imepimwa kabla ya kuuzwa.",
    why2_t:"WhatsApp Direct", why2_d:"Message tu — tunamaliza kila kitu haraka bila shida.",
    why3_t:"Bei ya Haki", why3_d:"Bei zetu ni za ushindani. Mazungumzo ya wazi yanakubalika.",
    why4_t:"Huduma ya Haraka", why4_d:"Tunajibu haraka na tunaweza kupanga delivery Dar es Salaam.",
    // CTA
    cta_title:"Una Maswali? Tupigie!", cta_sub:"Chat nasi WhatsApp — tunajibu haraka na tuko tayari kukusaidia kupata simu yako bora.", cta_btn:"Anza Chat WhatsApp",
    // Location
    loc_label:"Mahali Tulipo",
    loc_title:"Tupate",
    loc_sub:"Tuko Dar es Salaam — karibu uje au tupigie WhatsApp tukufikishie.",
    loc_addr_t:"Anwani", loc_addr:"1110 Uhuru Street\nDar es Salaam, Tanzania",
    loc_hours_t:"Masaa ya Kazi",
    loc_hours:"Juma Mosi–Ijumaa  ·  8:00 AM – 7:00 PM\nJumamosi  ·  8:00 AM – 6:00 PM\nJumapili  ·  10:00 AM – 4:00 PM",
    loc_contact_t:"Mawasiliano", loc_contact:"+255 688 058 564\nInapatikana WhatsApp",
    loc_dir_btn:"🗺️ Pata Maelekezo", loc_wa_btn:"Uliza Maelekezo WhatsApp",
    // Footer
    footer_copy:"© 2026 Volta. Dar es Salaam, Tanzania 🇹🇿",
    // Spec modal
    spec_title:"📱 Vipimo", cap_title:"⚡ Vipengele", order_btn:"Order WhatsApp",
    badge_new:"📦 Mpya", badge_used:"Used",
    // Brand strip
    brand_strip:"⚡ Tunaweka kiwango kipya katika sekta ya elektroniki · Premium na Kuaminika",
  }
};

let currentLang = 'en';

function applyLang(lang) {
  const t = LANG[lang];
  currentLang = lang;

  // Update lang button
  { const ll=document.getElementById('langLabel'); if(ll) ll.textContent = lang === 'sw' ? 'English' : 'Swahili'; }

  // Nav links
  safeText('nav-brands', t.nav_brands);
  safeText('nav-phones', t.nav_phones);
  safeText('nav-appliances', t.nav_appliances);
  safeText('nav-why', t.nav_why);
  safeText('nav-location', t.nav_location);

  // Hero
  safeText('hero-tag', t.hero_tag);
  safeText('hero-sub', t.hero_sub);
  safeText('hero-btn1', t.hero_btn1);
  safeText('hero-btn2', t.hero_btn2);

  // Stats
  const statLabels = document.querySelectorAll('.stat-label');
  const statKeys = [t.stat1, t.stat2, t.stat3, t.stat4];
  statLabels.forEach((el, i) => { if(statKeys[i]) el.textContent = statKeys[i]; });

  // Brand section
  safeText('brand-label', t.brand_label);
  safeText('brand-title', t.brand_title);
  safeText('brand-sub', t.brand_sub);

  // Products
  safeText('prod-label', t.prod_label);
  safeText('prod-title', t.prod_title);
  safeText('prod-sub', t.prod_sub);
  const si = document.getElementById('searchInput');
  if(si) si.placeholder = t.search_ph;

  // Appliances
  safeText('app-label', t.app_label);
  safeText('app-title', t.app_title);
  safeText('app-sub', t.app_sub);

  // Why Volta
  safeText('why-label', t.why_label);
  safeText('why-title', t.why_title);
  safeText('why-sub', t.why_sub);
  safeText('why1-t', t.why1_t); safeText('why1-d', t.why1_d);
  safeText('why2-t', t.why2_t); safeText('why2-d', t.why2_d);
  safeText('why3-t', t.why3_t); safeText('why3-d', t.why3_d);
  safeText('why4-t', t.why4_t); safeText('why4-d', t.why4_d);

  // CTA
  safeText('cta-title', t.cta_title);
  safeText('cta-sub', t.cta_sub);
  safeText('cta-btn', t.cta_btn);

  // Location
  safeText('loc-label', t.loc_label);
  safeText('loc-title', t.loc_title);
  safeText('loc-sub', t.loc_sub);
  safeText('loc-addr-t', t.loc_addr_t);
  safeHTML('loc-addr', t.loc_addr.replace(/\n/g,'<br>'));
  safeText('loc-hours-t', t.loc_hours_t);
  safeHTML('loc-hours', t.loc_hours.replace(/\n/g,'<br>'));
  safeText('loc-contact-t', t.loc_contact_t);
  safeHTML('loc-contact', t.loc_contact.replace(/\n/g,'<br>'));
  safeText('loc-dir-btn', t.loc_dir_btn);
  safeText('loc-wa-btn', t.loc_wa_btn);

  // Footer
  safeText('footer-copy', t.footer_copy);

  // Brand strip
  safeText('brand-strip', t.brand_strip);

  // Filter buttons
  safeText('fb-all', t.filter_all);
  safeText('fb-new', t.filter_new);
  safeText('fb-used', t.filter_used);
  safeText('app-all', t.app_all);
  safeText('app-tv', t.app_tv);
  safeText('app-fridge', t.app_fridge);
  safeText('app-wash', t.app_wash);
  safeText('app-blend', t.app_blend);
  safeText('app-fan', t.app_fan);
  safeText('app-micro', t.app_micro);
  safeText('app-sound', t.app_sound);

  // Save preference
  try { localStorage.setItem('volta_lang', lang); } catch(e){}
}

function safeText(id, text) {
  const el = document.getElementById(id);
  if(el && text !== undefined) el.textContent = text;
}
function safeHTML(id, html) {
  const el = document.getElementById(id);
  if(el && html !== undefined) el.innerHTML = html;
}

function toggleLang() {
  applyLang(currentLang === 'sw' ? 'en' : 'sw');
}

// Apply on load
window.addEventListener('DOMContentLoaded', () => {
  // Render core content FIRST, each guarded so one failure can't block the rest
  try { renderBrands(); } catch(e){ console.warn('renderBrands',e); }
  try { renderFilterBar(); } catch(e){ console.warn('renderFilterBar',e); }
  try { applyFilters(); } catch(e){ console.warn('applyFilters',e); }
  try { filterApps('all', document.querySelector('#appFilterBar .fb')); } catch(e){ console.warn('filterApps',e); }
  try { applyLang('en'); } catch(e){ console.warn('applyLang',e); }

  // Scroll reveal
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){ e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; }
    });
  }, {threshold:0.1});
  document.querySelectorAll('.why-card').forEach(el => {
    el.style.opacity='0'; el.style.transform='translateY(30px)';
    el.style.transition='opacity 0.6s ease, transform 0.6s ease';
    obs.observe(el);
  });
});



// LIVE BACKEND SYNC
// Tries the same-origin API first (when the site is served by the backend
// itself, e.g. on Cloudflare Pages), then falls back to the hosted backend
// (for the GitHub Pages copy of the storefront). If neither responds, the
// built-in catalog above keeps the site fully working as a static page.
const VOLTA_API_CANDIDATES=["/api","https://volta-store.pages.dev/api"];
let VOLTA_API=null;
async function syncLiveProducts(){
  for(const base of VOLTA_API_CANDIDATES){
    try{
      const r=await fetch(base+"/products/");
      if(!r.ok)continue;
      const data=await r.json();
      if(!Array.isArray(data)||!data.length)continue;
      VOLTA_API=base;
      const lp=[],la=[];
      data.forEach(p=>{
        if(p.product_type==="phone"){
          lp.push({id:p.id,cat:p.category,cond:p.condition,name:p.name,short:p.short_description,price:p.price_display,specKey:p.spec_key,
            img:p.image_url||null,origPrice:p.original_price_display||null,detailedSpecs:p.detailed_specs||null,capabilities:p.capabilities||null});
        }else{
          la.push({cat:p.category,icon:p.icon_emoji,name:p.name,brand:p.brand,specs:p.specs,price:p.price_display,badge:p.badge,
            img:p.image_url||null,origPrice:p.original_price_display||null});
        }
      });
      if(lp.length){products.length=0;products.push(...lp);}
      if(la.length){appliances.length=0;appliances.push(...la);}
      applyFilters();
      filterApps("all",document.querySelector("#appFilterBar .fb"));
      return;
    }catch(e){/* try next */}
  }
}
window.addEventListener("DOMContentLoaded",syncLiveProducts);

// Record WhatsApp product inquiries as orders in the backend (fire-and-forget).
document.addEventListener("click",e=>{
  const a=e.target.closest('a[href*="wa.me"]');
  if(!a||!VOLTA_API)return;
  let productName=null;
  try{
    const text=new URL(a.href).searchParams.get("text")||"";
    const m=text.match(/\*(.+?)\*/);
    if(m)productName=m[1];
  }catch(err){}
  if(!productName)return; // only log product-specific inquiries, not generic chat buttons
  fetch(VOLTA_API+"/orders/",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({product_name:productName,message:"WhatsApp inquiry from website"})
  }).catch(()=>{});
});

// ═══════════════════════════════════════════
//  NEXT-GEN ENHANCEMENTS
// ═══════════════════════════════════════════

// 1. Universal scroll-reveal — sections rise & fade in as you scroll
function initScrollReveal(){
  const revealObs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('revealed');
        revealObs.unobserve(e.target);
      }
    });
  },{threshold:0, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>{
    // If already in view on load, reveal immediately (no flash / delay)
    const r=el.getBoundingClientRect();
    if(r.top < window.innerHeight && r.bottom > 0){
      el.classList.add('revealed');
    } else {
      revealObs.observe(el);
    }
  });
}

// 2. Interactive 3D tilt on product cards (and any .tilt element)
function initTilt(){
  const damp=32;
  document.addEventListener('pointermove',e=>{
    const card=e.target.closest('.product-card, .app-card, .why-card');
    if(!card)return;
    const r=card.getBoundingClientRect();
    const cx=e.clientX-r.left, cy=e.clientY-r.top;
    const rx=((cy/r.height)-0.5)*-damp;
    const ry=((cx/r.width)-0.5)*damp;
    card.style.transform=`perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(24px) scale(1.04)`;
    card.style.transition='transform 0.06s ease';
  });
  document.addEventListener('pointerout',e=>{
    const card=e.target.closest('.product-card, .app-card, .why-card');
    if(card){card.style.transform='';card.style.transition='transform 0.5s cubic-bezier(0.16,1,0.3,1)';}
  });
}

// 3. Scroll progress bar at top
function initScrollProgress(){
  const bar=document.createElement('div');
  bar.id='scrollProgress';
  document.body.appendChild(bar);
  window.addEventListener('scroll',()=>{
    const h=document.documentElement;
    const pct=(h.scrollTop)/(h.scrollHeight-h.clientHeight)*100;
    bar.style.width=pct+'%';
  },{passive:true});
}

// 4. Nav shrinks/solidifies on scroll
function initNavScroll(){
  const nav=document.querySelector('nav');
  const cue=document.getElementById('scrollCue');
  window.addEventListener('scroll',()=>{
    const y=window.scrollY;
    if(nav){ if(y>40)nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); }
    // Hero wordmark zooms + fades as you scroll past (cinematic exit)
    if(v3d && window._voltaScroll){
      const p=Math.min(y/600,1);
      window._voltaScroll.scale=1+p*0.6;
      window._voltaScroll.ty=p*40;
      window._voltaScroll.op=1-p*0.9;
      applyVoltaTransform();
    }
    if(cue){ cue.style.opacity=`${Math.max(0,0.6-y/200)}`; }
  },{passive:true});
}

// Tag sections + cards for reveal once DOM + dynamic content is ready
function tagReveal(){
  // Assign varied reveal types to each section for cinematic motion.
  const types=['rv-up','rv-left','rv-right','rv-scale','rv-rotate'];
  let i=0;
  document.querySelectorAll('section').forEach((el)=>{
    if(el.classList.contains('hero'))return;
    // The whole section title gets a clip-rise; the body gets a directional reveal
    const title=el.querySelector('.s-title');
    if(title && !title.querySelector('.title-rise')){
      title.innerHTML=`<span class="title-rise">${title.innerHTML}</span>`;
    }
    el.classList.add('rv', types[i % types.length]);
    i++;
    // Tag inner grids to stagger their children
    el.querySelectorAll('.products-grid, .cat-grid, .app-grid, .why-grid, #brandGrid, #productsGrid').forEach(g=>g.classList.add('stagger'));
  });
  initRichReveal();
  initParallax();
}

function initRichReveal(){
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        // also fire any title-rise inside
        e.target.querySelectorAll('.title-rise').forEach(t=>t.classList.add('in'));
        obs.unobserve(e.target);
      }
    });
  // threshold 0 (any visible pixel), not a fraction: on phones the product
  // sections stack into one very tall column, and a fractional threshold can
  // exceed what a small viewport can ever show at once — the reveal would
  // never fire and the section stayed permanently invisible on mobile.
  },{threshold:0, rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.rv, .stagger').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.top < window.innerHeight*0.92 && r.bottom > 0){
      el.classList.add('in');
      el.querySelectorAll('.title-rise').forEach(t=>t.classList.add('in'));
    } else obs.observe(el);
  });
}

// Parallax: elements drift at different speeds as you scroll
function initParallax(){
  const layers=[];
  document.querySelectorAll('[data-parallax]').forEach(el=>{
    layers.push({el, speed:parseFloat(el.dataset.parallax)});
  });
  // hero canvas + wordmark get gentle parallax automatically
  const hero=document.querySelector('.hero-content');
  if(hero)layers.push({el:hero, speed:0.18});
  let ticking=false;
  window.addEventListener('scroll',()=>{
    if(ticking)return; ticking=true;
    requestAnimationFrame(()=>{
      const y=window.scrollY;
      layers.forEach(l=>{
        l.el.style.transform=`translateY(${y*l.speed}px)`;
      });
      ticking=false;
    });
  },{passive:true});
}

window.addEventListener('DOMContentLoaded',()=>{
  initTilt();
  initScrollProgress();
  initNavScroll();
  // Content is already rendered synchronously above; tag reveals now.
  // A double rAF ensures layout is settled so in-view detection is accurate.
  requestAnimationFrame(()=>requestAnimationFrame(tagReveal));
});
