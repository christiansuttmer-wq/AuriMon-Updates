/* AuriMon 1.0.1 – landscape fix, zoom lock, smoother water/path rendering. */
'use strict';
(() => {
  const VERSION = '1.3.0';
  const T = 48;

  const $ = (s) => document.querySelector(s);
  const rect = (c,x,y,w,h,col) => { c.fillStyle = col; c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
  const zone = () => (window.state?.zone ?? 0);
  const at = (x,y) => (typeof window.atPosition === 'function' ? window.atPosition(zone(),x,y) : 'grass');
  const mix = (a,b,t) => {
    const ah = /^#/.test(a) ? a : '#7fcf7f';
    const bh = /^#/.test(b) ? b : '#ffffff';
    const pa=[parseInt(ah.slice(1,3),16),parseInt(ah.slice(3,5),16),parseInt(ah.slice(5,7),16)];
    const pb=[parseInt(bh.slice(1,3),16),parseInt(bh.slice(3,5),16),parseInt(bh.slice(5,7),16)];
    return '#'+pa.map((v,i)=>Math.round(v+(pb[i]-v)*t).toString(16).padStart(2,'0')).join('');
  };
  const seed = (z,x,y,k=0) => {
    let n = Math.imul(z+31,2654435761) ^ Math.imul(x+101,1597334677) ^ Math.imul(y+73,3812015801) ^ Math.imul(k+1,1103515245);
    n ^= n >>> 13;
    return n >>> 0;
  };
  const isWater = (t) => t === 'water';
  const isPathLike = (t) => t === 'path' || t === 'portal' || t === 'loot' || t === 'trainer' || t === 'cave' || t === 'legend' || t === 'safari' || t === 'rocketteam' || String(t).startsWith('v56-') || ['center','market','gym','v51-house','v51-atelier'].includes(t);
  const isGroundLike = (t) => ['grass','wild','tree','rock'].includes(t);
  const accentPalette=['#f7cf67','#8fd5ff','#d0bd91','#ffb1cb','#9fe7d7','#f0c77f','#d8a375','#bbeaff','#ec8c60','#d9e9f5','#ffe17f','#82d7be','#d4c49f','#dff8ff','#f3afe7','#9dd7f2','#ccb7ff','#c9efa5','#dec0ff','#ffdc99'];
  const accentForZone = () => accentPalette[zone()%accentPalette.length];

  function updateViewport(){
    let meta = document.querySelector('meta[name="viewport"]');
    if(!meta){
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
    document.documentElement.style.touchAction = 'manipulation';
    document.body.style.touchAction = 'manipulation';
  }
  updateViewport();
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if(now - lastTouchEnd <= 260 && e.cancelable) e.preventDefault();
    lastTouchEnd = now;
  }, {passive:false});
  document.addEventListener('touchmove', (e) => {
    if((e.touches && e.touches.length > 1) && e.cancelable) e.preventDefault();
  }, {passive:false});
  ['gesturestart','gesturechange','gestureend'].forEach(type => {
    document.addEventListener(type, e => { if(e.cancelable) e.preventDefault(); }, {passive:false});
  });
  window.addEventListener('wheel', e => {
    if(e.ctrlKey && e.cancelable) e.preventDefault();
  }, {passive:false});

  function setVersionLabels(){
    // Do not overwrite the newer 1.1.1 release label in delayed callbacks.
    if(window.AriMons?.version==='1.1.3')return;
    const brand = document.querySelector('.brand span');
    if(brand) brand.textContent = 'DEINE AURIMON-WELT · VERSION ' + VERSION;
    document.title = 'AuriMon';
    window.AriMons = Object.assign(window.AriMons || {}, {version: VERSION, build: 'mobile-landscape-fix'});
  }
  setVersionLabels();

  function waveLine(c, points, color, lineWidth=2){
    c.save();
    c.strokeStyle = color;
    c.lineWidth = lineWidth;
    c.beginPath();
    c.moveTo(points[0][0], points[0][1]);
    for(let i=1;i<points.length;i++) c.quadraticCurveTo(points[i-1][0], points[i-1][1], points[i][0], points[i][1]);
    c.stroke();
    c.restore();
  }

  function drawCornerBlob(c, corner, fill, size=14){
    c.save();
    c.fillStyle = fill;
    c.beginPath();
    if(corner==='tl'){
      c.moveTo(0,0); c.lineTo(size,0); c.quadraticCurveTo(0,0,0,size);
    }else if(corner==='tr'){
      c.moveTo(T-size,0); c.lineTo(T,0); c.lineTo(T,size); c.quadraticCurveTo(T,0,T-size,0);
    }else if(corner==='bl'){
      c.moveTo(0,T-size); c.lineTo(0,T); c.lineTo(size,T); c.quadraticCurveTo(0,T,0,T-size);
    }else if(corner==='br'){
      c.moveTo(T-size,T); c.lineTo(T,T); c.lineTo(T,T-size); c.quadraticCurveTo(T,T,T-size,T);
    }
    c.closePath();
    c.fill();
    c.restore();
  }

  function paintGrass(c,x,y,t,p,wx,wy){
    const g = c.createLinearGradient(x,y,x,y+T);
    g.addColorStop(0, mix(p.alt,p.grass,0.35));
    g.addColorStop(0.25, p.alt);
    g.addColorStop(0.7, p.grass);
    g.addColorStop(1, mix(p.grass,p.shadow,0.25));
    c.fillStyle = g; c.fillRect(x,y,T,T);
    for(let i=0;i<AREAS.length;i++){
      const xx=x+3+(seed(zone(),wx,wy,i)%42);
      const yy=y+5+(seed(zone(),wy,wx,i+40)%39);
      rect(c,xx,yy,2,2,i%4?mix(p.alt,'#ffffff',0.18):mix(p.shadow,'#000000',0.08));
    }
    const bladeCount = t==='wild' ? 7 : 3;
    for(let i=0;i<bladeCount;i++){
      const bx=x+6+i*6+(seed(zone(),wx,wy,110+i)%5);
      const by=y+26+(seed(zone(),wx,wy,130+i)%10);
      rect(c,bx,by-10,2,12,p.wild || p.grass);
      rect(c,bx+2,by-8,3,5,mix(p.wild || p.grass,p.shadow,0.15));
      rect(c,bx-2,by-6,2,4,mix(p.alt,'#ffffff',0.1));
    }
    if(seed(zone(),wx,wy,220)%6===0){
      const a = accentForZone();
      rect(c,x+24,y+23,3,11,'#2d7a4a');
      rect(c,x+19,y+19,13,6,a);
      rect(c,x+23,y+15,5,11,a);
      rect(c,x+24,y+21,3,3,'#fff8dd');
    }
    const n=isWater(at(wx,wy-1)), s=isWater(at(wx,wy+1)), w=isWater(at(wx-1,wy)), e=isWater(at(wx+1,wy));
    c.save(); c.translate(x,y);
    const wet = mix(p.water || '#4eb6df', p.path || p.alt, 0.68);
    const foam = mix('#ffffff', p.water || '#4eb6df', 0.25);
    if(n){
      c.fillStyle = wet; c.beginPath(); c.moveTo(0,0); c.lineTo(T,0); c.lineTo(T,5); c.quadraticCurveTo(35,9,24,6); c.quadraticCurveTo(12,3,0,6); c.closePath(); c.fill();
      waveLine(c, [[3,6],[14,4],[24,7],[34,4],[45,7]], foam, 1.5);
    }
    if(s){
      c.fillStyle = wet; c.beginPath(); c.moveTo(0,T); c.lineTo(T,T); c.lineTo(T,T-5); c.quadraticCurveTo(35,T-9,24,T-6); c.quadraticCurveTo(12,T-3,0,T-6); c.closePath(); c.fill();
      waveLine(c, [[3,T-6],[14,T-4],[24,T-7],[34,T-4],[45,T-7]], foam, 1.5);
    }
    if(w){
      c.fillStyle = wet; c.beginPath(); c.moveTo(0,0); c.lineTo(5,0); c.quadraticCurveTo(8,14,5,24); c.quadraticCurveTo(2,36,5,T); c.lineTo(0,T); c.closePath(); c.fill();
      waveLine(c, [[6,3],[4,14],[7,24],[4,34],[7,45]], foam, 1.5);
    }
    if(e){
      c.fillStyle = wet; c.beginPath(); c.moveTo(T,0); c.lineTo(T-5,0); c.quadraticCurveTo(T-8,14,T-5,24); c.quadraticCurveTo(T-2,36,T-5,T); c.lineTo(T,T); c.closePath(); c.fill();
      waveLine(c, [[T-6,3],[T-4,14],[T-7,24],[T-4,34],[T-7,45]], foam, 1.5);
    }
    c.restore();
  }

  function paintPath(c,x,y,p,wx,wy){
    paintGrass(c,x,y,'grass',p,wx,wy);
    const sand = mix(p.path || '#e7cfac', '#fff6dc', 0.12);
    const shade = mix(p.path || '#e7cfac', p.shadow || '#6d7255', 0.20);
    c.save(); c.translate(x,y);
    c.fillStyle = sand;
    c.beginPath();
    c.moveTo(6,10); c.quadraticCurveTo(24,3,42,10); c.quadraticCurveTo(46,24,42,38); c.quadraticCurveTo(24,45,7,38); c.quadraticCurveTo(2,24,6,10); c.closePath(); c.fill();
    c.fillStyle = mix(sand,'#ffffff',0.22);
    c.beginPath(); c.ellipse(24,16,15,6,0,0,Math.PI*2); c.fill();
    c.fillStyle = shade;
    c.beginPath(); c.ellipse(24,39,16,5,0,0,Math.PI*2); c.fill();
    for(let i=0;i<8;i++){
      const px=7+(seed(zone(),wx,wy,250+i)%34), py=10+(seed(zone(),wy,wx,260+i)%25);
      rect(c,px,py,3+(i%2),2, i%2?mix(sand,'#fff7e9',0.35):mix(sand,shade,0.18));
    }
    const n=isPathLike(at(wx,wy-1)), s=isPathLike(at(wx,wy+1)), w=isPathLike(at(wx-1,wy)), e=isPathLike(at(wx+1,wy));
    const grass = p.grass || '#86c777';
    if(!n){ c.fillStyle = grass; c.beginPath(); c.moveTo(0,0); c.lineTo(T,0); c.lineTo(T,5); c.quadraticCurveTo(38,9,25,5); c.quadraticCurveTo(10,8,0,5); c.closePath(); c.fill(); }
    if(!s){ c.fillStyle = mix(grass,p.shadow || '#4f9350',0.06); c.beginPath(); c.moveTo(0,T); c.lineTo(T,T); c.lineTo(T,T-5); c.quadraticCurveTo(38,T-9,25,T-5); c.quadraticCurveTo(10,T-8,0,T-5); c.closePath(); c.fill(); }
    if(!w){ c.fillStyle = grass; c.beginPath(); c.moveTo(0,0); c.lineTo(5,0); c.quadraticCurveTo(8,12,5,24); c.quadraticCurveTo(3,36,5,T); c.lineTo(0,T); c.closePath(); c.fill(); }
    if(!e){ c.fillStyle = mix(grass,p.alt || grass,0.25); c.beginPath(); c.moveTo(T,0); c.lineTo(T-5,0); c.quadraticCurveTo(T-8,12,T-5,24); c.quadraticCurveTo(T-3,36,T-5,T); c.lineTo(T,T); c.closePath(); c.fill(); }
    if(!n && !w) drawCornerBlob(c,'tl',grass,10);
    if(!n && !e) drawCornerBlob(c,'tr',grass,10);
    if(!s && !w) drawCornerBlob(c,'bl',mix(grass,p.shadow || grass,0.06),10);
    if(!s && !e) drawCornerBlob(c,'br',mix(grass,p.alt || grass,0.2),10);
    c.restore();
  }

  function paintWater(c,x,y,p,wx,wy){
    const deep = mix(p.water || '#43a7d7', '#1d6ea6', 0.24);
    const g = c.createLinearGradient(x,y,x,y+T);
    g.addColorStop(0, mix(p.water || '#43a7d7', '#f3ffff', 0.24));
    g.addColorStop(0.45, p.water || '#43a7d7');
    g.addColorStop(1, deep);
    c.fillStyle = g; c.fillRect(x,y,T,T);
    const n=isWater(at(wx,wy-1)), s=isWater(at(wx,wy+1)), w=isWater(at(wx-1,wy)), e=isWater(at(wx+1,wy));
    c.save(); c.translate(x,y);
    for(let i=0;i<3;i++){
      const yy=10+i*10, xx=5+(seed(zone(),wx,wy,300+i)%20);
      c.fillStyle = i%2 ? 'rgba(231,251,255,.75)' : 'rgba(132,229,245,.75)';
      c.beginPath(); c.ellipse(xx+12,yy,11,2,0,0,Math.PI*2); c.fill();
      c.fillStyle = 'rgba(89,191,216,.55)';
      c.beginPath(); c.ellipse(xx+20,yy+4,8,1.5,0,0,Math.PI*2); c.fill();
    }
    const shore = mix(p.path || p.alt || '#d8e4be', '#fff6de', 0.28);
    const foam = 'rgba(247,252,255,.85)';
    if(!n){
      c.fillStyle = shore; c.beginPath(); c.moveTo(0,0); c.lineTo(T,0); c.lineTo(T,7); c.quadraticCurveTo(36,10,24,8); c.quadraticCurveTo(12,5,0,8); c.closePath(); c.fill();
      waveLine(c, [[2,8],[14,5],[24,8],[34,5],[46,8]], foam, 2);
    }
    if(!s){
      c.fillStyle = shore; c.beginPath(); c.moveTo(0,T); c.lineTo(T,T); c.lineTo(T,T-7); c.quadraticCurveTo(36,T-10,24,T-8); c.quadraticCurveTo(12,T-5,0,T-8); c.closePath(); c.fill();
      waveLine(c, [[2,T-8],[14,T-5],[24,T-8],[34,T-5],[46,T-8]], foam, 2);
    }
    if(!w){
      c.fillStyle = shore; c.beginPath(); c.moveTo(0,0); c.lineTo(8,0); c.quadraticCurveTo(11,15,8,24); c.quadraticCurveTo(5,36,8,T); c.lineTo(0,T); c.closePath(); c.fill();
      waveLine(c, [[8,2],[5,14],[8,24],[5,34],[8,46]], foam, 2);
    }
    if(!e){
      c.fillStyle = shore; c.beginPath(); c.moveTo(T,0); c.lineTo(T-8,0); c.quadraticCurveTo(T-11,15,T-8,24); c.quadraticCurveTo(T-5,36,T-8,T); c.lineTo(T,T); c.closePath(); c.fill();
      waveLine(c, [[T-8,2],[T-5,14],[T-8,24],[T-5,34],[T-8,46]], foam, 2);
    }
    if(!n && !w){ c.fillStyle = shore; c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(14,0,14,14); c.lineTo(0,14); c.closePath(); c.fill(); }
    if(!n && !e){ c.fillStyle = shore; c.beginPath(); c.moveTo(T,0); c.quadraticCurveTo(T-14,0,T-14,14); c.lineTo(T,14); c.closePath(); c.fill(); }
    if(!s && !w){ c.fillStyle = shore; c.beginPath(); c.moveTo(0,T); c.quadraticCurveTo(0,T-14,14,T-14); c.lineTo(14,T); c.closePath(); c.fill(); }
    if(!s && !e){ c.fillStyle = shore; c.beginPath(); c.moveTo(T,T); c.quadraticCurveTo(T,T-14,T-14,T-14); c.lineTo(T-14,T); c.closePath(); c.fill(); }
    c.restore();
  }

  function paintTree(c,x,y,p,wx,wy){
    paintGrass(c,x,y,'grass',p,wx,wy);
    rect(c,x+17,y+28,14,15,'#6a4a37'); rect(c,x+22,y+25,4,18,'#9e7558');
    rect(c,x+10,y+18,30,17,p.edge || '#264a3d'); rect(c,x+4,y+20,40,14,p.tree || '#2e7750');
    rect(c,x+8,y+10,34,17,p.leaf || '#4ea765'); rect(c,x+14,y+5,22,15,mix(p.leaf || '#4ea765','#d8ffc4',0.18));
    rect(c,x+12,y+12,11,4,'#d8f9aa'); rect(c,x+28,y+18,8,5,p.tree || '#2e7750');
    if(seed(zone(),wx,wy,330)%4===0){ rect(c,x+19,y+17,3,3,'#ffd0de'); rect(c,x+25,y+15,3,3,'#ffe6a9'); }
    rect(c,x+6,y+33,36,4,mix(p.edge || '#264a3d','#000000',0.15));
  }

  function paintRock(c,x,y,p,wx,wy){
    paintGrass(c,x,y,'grass',p,wx,wy);
    rect(c,x+4,y+31,40,11,'#5a6270'); rect(c,x+8,y+16,34,22,p.rock || '#9aa2b3');
    rect(c,x+14,y+10,24,16,mix(p.rock || '#9aa2b3','#ffffff',0.22)); rect(c,x+11,y+19,8,9,'#dce0e8');
    rect(c,x+31,y+24,8,10,'#697589');
  }

  function installWorldPolish(){
    const world = window.PokemonWorld56;
    if(!world) return false;
    const original = world.paintTile?.bind(world);
    world.paintTile = function(c,x,y,t,pal,wx,wy){
      const p = pal || {grass:'#7dcf70',alt:'#9cdc8a',wild:'#58a84b',shadow:'#38794a',path:'#e3c38d',tree:'#2e7750',leaf:'#4ea765',edge:'#26513d',water:'#43a7d7',rock:'#8f96a5'};
      const groundLike = ['wild','grass','tree','rock','path','water'].includes(t) || String(t).startsWith('v56-') || ['center','market','gym','v51-house','v51-atelier'].includes(t);
      if(!groundLike) return original ? original(c,x,y,t,p,wx,wy) : false;
      const pathLike = t==='path' || ['center','market','gym'].includes(t) || String(t).startsWith('v56-') || t==='v51-house' || t==='v51-atelier';
      if(t==='water'){ paintWater(c,x,y,p,wx,wy); return true; }
      if(pathLike){ paintPath(c,x,y,p,wx,wy); return true; }
      if(t==='tree'){ paintTree(c,x,y,p,wx,wy); return true; }
      if(t==='rock'){ paintRock(c,x,y,p,wx,wy); return true; }
      paintGrass(c,x,y,t,p,wx,wy); return true;
    };
    return true;
  }

  function fitOpenBattle(){
    if(!window.renderBattle || window.__ariMons101BattlePatch) return;
    const old = window.renderBattle;
    window.renderBattle = function(){
      old();
      const overlay = document.getElementById('battle-overlay');
      const box = document.getElementById('battle-content');
      if(!overlay || !box) return;
      box.classList.add('ari101-battle');
      requestAnimationFrame(() => {
        const actions = box.querySelector('.battleactions');
        if(actions && window.matchMedia('(orientation: landscape) and (max-height: 560px)').matches){
          overlay.scrollTop = 0; box.scrollTop = 0;
        }
      });
    };
    window.__ariMons101BattlePatch = true;
  }

  fitOpenBattle();
  installWorldPolish();
  window.addEventListener('resize', () => {
    updateViewport();
    setVersionLabels();
    if(window.PokemonGame?.hd?.forceRedraw) window.PokemonGame.hd.forceRedraw();
  });
  setTimeout(() => {
    installWorldPolish();
    setVersionLabels();
    if(window.PokemonGame?.hd?.forceRedraw) window.PokemonGame.hd.forceRedraw();
  }, 120);
})();
