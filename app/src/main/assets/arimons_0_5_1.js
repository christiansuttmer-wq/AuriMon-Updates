/* AuriMon 0.5.1 — the ACTUAL active world renderer.
 * v5_7.js used to intercept all tiles, leaving the new design invisible.
 * Override only visuals on the final active renderer; no mutations of game state.
 */
'use strict';
(() => {
  const world = window.PokemonWorld56;
  if (!world) { console.warn('AuriMon 0.5.1: world renderer unavailable'); return; }
  const T=48;
  const palettes={
    grass:{a:'#a5df8b',b:'#82c87b',dark:'#3f9263',leaf:'#49af76',top:'#9de8a1',path:'#e5cba6',pathLight:'#faedcc',water:'#58bfeb',waterDeep:'#287db6',stone:'#a2adb3',flower:'#fff6ad'},
    ocean:{a:'#a9e8c9',b:'#80cbae',dark:'#318f79',leaf:'#42b893',top:'#a1efc1',path:'#e9d5b4',pathLight:'#fff0d6',water:'#35b9eb',waterDeep:'#2389c1',stone:'#a5b8bc',flower:'#ffd7ad'},
    mountain:{a:'#bed198',b:'#9db57d',dark:'#577855',leaf:'#739e69',top:'#bedba0',path:'#ddc8a8',pathLight:'#f4e1c4',water:'#6dc1d7',waterDeep:'#408fa8',stone:'#999ca5',flower:'#ffebbd'},
    volcano:{a:'#cfb08b',b:'#b68e74',dark:'#795a4b',leaf:'#ae785e',top:'#e4ac82',path:'#e8c09c',pathLight:'#fbe0b5',water:'#da8263',waterDeep:'#aa4f42',stone:'#94858a',flower:'#ffdbb4'},
    ice:{a:'#d5f2ef',b:'#b3dce2',dark:'#6e9ead',leaf:'#a4d9e5',top:'#e8fcff',path:'#e9ebed',pathLight:'#ffffff',water:'#78cbe9',waterDeep:'#5994c6',stone:'#aebbc9',flower:'#fffafa'},
    dark:{a:'#9cbab0',b:'#739b99',dark:'#3f6c69',leaf:'#69998d',top:'#b0d2bf',path:'#c7b3a7',pathLight:'#e2d2bf',water:'#789fc0',waterDeep:'#426f9c',stone:'#949caa',flower:'#efd1e9'}
  };
  const pal=()=>palettes[AREAS?.[state.zone]?.theme] || palettes.grass;
  const hash=(x,y,k)=>{let n=Math.imul(x+17,0x9e3779b1)^Math.imul(y+47,0x85ebca6b)^Math.imul(k+97,0xc2b2ae35);n^=n>>>13;return n>>>0;};
  const rand=(x,y,k)=>hash(x,y,k)/4294967295;
  const lerp=(a,b,t)=>{const aa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16));const bb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return '#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*t).toString(16).padStart(2,'0')).join('')};
  const dot=(c,x,y,r,col,alpha=1)=>{c.save();c.globalAlpha=alpha;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();};
  const oval=(c,x,y,rx,ry,col,alpha=1)=>{c.save();c.globalAlpha=alpha;c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,2*Math.PI);c.fill();c.restore();};
  function rr(c,x,y,w,h,r,fill,stroke=null,sw=1){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke();}}
  function path(c,points,fill,stroke=null,sw=1){c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw;c.stroke()}}
  function gradient(c,x,y,w,h,top,bottom){const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,top);g.addColorStop(1,bottom);return g}
  function ground(c,x,y,p,wx,wy,isWild=false){
    c.fillStyle=gradient(c,x,y,T,T,p.a,p.b);c.fillRect(x,y,T,T);
    // Patches and soft sun-lit areas: no square grass stamps.
    const shade=rand(wx,wy,2);oval(c,x+15+(shade*18),y+20,19,17,shade>.5?p.a:p.b,.18);
    for(let i=0;i<7;i++){
      const sx=x+4+rand(wx,wy,i+10)*40, sy=y+10+rand(wx,wy,i+20)*32;
      c.strokeStyle=i%2?p.dark:p.top;c.lineWidth=isWild?2.5:1.5;c.lineCap='round';c.beginPath();c.moveTo(sx,sy+4);c.quadraticCurveTo(sx-3,sy,sx-1,sy-4-(isWild?3:0));c.moveTo(sx,sy+3);c.quadraticCurveTo(sx+2,sy,sx+3,sy-3);c.stroke();
    }
    if(!isWild && rand(wx,wy,66)>.74){
      const fx=x+12+rand(wx,wy,67)*22,fy=y+15+rand(wx,wy,68)*19;
      dot(c,fx-3,fy,2.6,'#fff8fb');dot(c,fx+3,fy,2.6,p.flower);dot(c,fx,fy-3,2.8,p.flower);dot(c,fx,fy+3,2.8,'#fff8fb');dot(c,fx,fy,1.5,'#f7ad53');
    }
    if(isWild){
      for(let i=0;i<3;i++){const xx=x+10+i*14,yy=y+30+rand(wx,wy,120+i)*5;oval(c,xx,yy+4,8,3,p.dark,.23);c.strokeStyle=p.dark;c.lineWidth=2.5;c.beginPath();c.moveTo(xx,yy+4);c.quadraticCurveTo(xx+3,yy-6,xx+1,yy-14);c.stroke();}
    }
  }
  function tilesLikePath(t){return t==='path'||t==='portal'||t==='trainer'||t==='loot'||t==='treasure'||t==='safari'||t==='cave'||t==='legend'||t==='rocketteam'||t==='center'||t==='market'||t==='gym'||String(t).startsWith('v56-')||t==='v51-house'||t==='v51-atelier';}
  function paved(c,x,y,p,wx,wy){
    c.fillStyle=gradient(c,x,y,48,48,p.pathLight,p.path);c.fillRect(x,y,48,48);
    // Road flagstones have asymmetrical grout, bevel and highlights.
    const stone=lerp(p.path,p.pathLight,.52),edge=lerp(p.path,p.dark,.3);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const off=row%2?8:0,px=x+col*17-6+off,py=y+row*16+1;
      rr(c,px,py,15,14,3,stone,edge,.8);
      c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.2;c.beginPath();c.moveTo(px+3,py+2);c.lineTo(px+11,py+2);c.stroke();
    }
    // cobble edges with grass where adjacent tiles aren't paths
    if(typeof atPosition==='function' && !tilesLikePath(atPosition(state.zone,wx,wy-1))){c.strokeStyle=p.b;c.lineWidth=3;c.beginPath();c.moveTo(x,y+1);c.lineTo(x+48,y+1);c.stroke()}
  }
  function water(c,x,y,p,wx,wy){
    c.fillStyle=gradient(c,x,y,T,T,p.water,p.waterDeep);c.fillRect(x,y,T,T);
    c.fillStyle='rgba(255,255,255,.07)';c.fillRect(x,y+3,48,3);
    for(let i=0;i<3;i++){
      const yy=y+9+i*15+rand(wx,wy,i)*3;
      c.beginPath();c.moveTo(x+3,yy);c.bezierCurveTo(x+15,yy-3,x+22,yy+2,x+31,yy);c.bezierCurveTo(x+39,yy-2,x+42,yy+1,x+47,yy-1);
      c.strokeStyle=i%2?'rgba(219,252,255,.52)':'rgba(255,255,255,.37)';c.lineWidth=2.5;c.stroke();
    }
    if(rand(wx,wy,44)>.73){dot(c,x+17,y+28,2.2,'#e0ffff',.65);dot(c,x+21,y+24,1.2,'#e0ffff',.72);}
  }
  function tree(c,x,y,p,wx,wy){
    ground(c,x,y,p,wx,wy);
    // Big soft layered treetop; central trunk/branch shapes on one 48x48 tile.
    oval(c,x+24,y+40,19,6,p.dark,.28);
    rr(c,x+20,y+24,8,17,4,'#9b6953');rr(c,x+22,y+23,2.4,16,2,'#d7a77c');
    dot(c,x+23,y+20,17,p.dark,.82);
    dot(c,x+13,y+20,12,lerp(p.leaf,p.dark,.22));
    dot(c,x+35,y+20,12,lerp(p.leaf,p.dark,.18));
    dot(c,x+17,y+12,13,p.leaf);
    dot(c,x+31,y+10,14,p.leaf);
    dot(c,x+26,y+5,11,p.top);
    dot(c,x+11,y+18,4,p.top,.7);
    dot(c,x+28,y+9,5,lerp(p.top,'#ffffff',.4),.66);
    dot(c,x+19,y+6,3,'#fff8dc',.4);
    if(rand(wx,wy,123)>.6){dot(c,x+37,y+19,2.1,p.flower,.85);dot(c,x+15,y+13,1.8,p.flower,.75)}
  }
  function rock(c,x,y,p,wx,wy){
    ground(c,x,y,p,wx,wy);
    oval(c,x+24,y+39,20,6,p.dark,.25);
    path(c,[[8+x,31+y],[13+x,17+y],[26+x,10+y],[37+x,18+y],[43+x,29+y],[36+x,40+y],[15+x,40+y]],p.stone,lerp(p.stone,'#44546a',.3),1.5);
    path(c,[[13+x,17+y],[26+x,10+y],[28+x,24+y],[12+x,29+y]],lerp(p.stone,'#ffffff',.29));
    path(c,[[28+x,24+y],[37+x,18+y],[43+x,29+y],[36+x,40+y]],lerp(p.stone,'#32455a',.17));
    c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();c.moveTo(x+18,y+18);c.lineTo(x+24,y+14);c.stroke();
  }
  function prop(c,x,y,t,p){
    if(t==='portal'){paved(c,x,y,p,-999,-999);rr(c,x+13,y+9,22,33,10,'#597fc0','#d6eaff',2);rr(c,x+19,y+13,10,25,5,'#8bc0ed');dot(c,x+24,y+19,4,'#f5ffde',.9);}
    else if(t==='cave'){ground(c,x,y,p,-1,-1);oval(c,x+24,y+37,21,9,'#505565',.55);rr(c,x+5,y+9,38,36,14,'#666978');rr(c,x+11,y+16,26,29,11,'#1f2537');oval(c,x+24,y+37,10,5,'#0e1520',.7)}
    else if(t==='safari'){paved(c,x,y,p,-1,-1);rr(c,x+13,y+5,22,35,7,'#69aa7e','#3c7158',2);rr(c,x+19,y+12,10,15,5,'#ffe3a1');}
    else if(t==='legend'){paved(c,x,y,p,-1,-1);oval(c,x+24,y+33,18,7,'#6163a2',.25);path(c,[[24+x,5+y],[39+x,21+y],[32+x,42+y],[16+x,42+y],[9+x,21+y]],'#b39adf','#705b9f',2);dot(c,x+24,y+24,7,'#ffffff',.85)}
    else if(t==='rocketteam'){paved(c,x,y,p,-1,-1);rr(c,x+13,y+13,22,26,8,'#413d61');rr(c,x+18,y+8,12,13,6,'#b94b69');}
    else if(t==='loot'||t==='treasure'){paved(c,x,y,p,-1,-1);rr(c,x+15,y+18,18,17,5,'#9d6346','#603c39',1.5);rr(c,x+16,y+18,16,7,4,'#ffc66b');dot(c,x+24,y+25,2,'#fff4a7')}
  }
  function paintTile(c,x,y,t,_pal,wx,wy){
    // No fallback to older v5_7 pixel tile painter: this controls the visible world.
    if(state.dungeon)return false;
    const p=pal();
    if(t==='tree'||t==='wall')tree(c,x,y,p,wx,wy);
    else if(t==='rock')rock(c,x,y,p,wx,wy);
    else if(t==='water')water(c,x,y,p,wx,wy);
    else if(tilesLikePath(t))paved(c,x,y,p,wx,wy);
    else ground(c,x,y,p,wx,wy,t==='wild'||t==='grass');
    if(['portal','cave','safari','legend','rocketteam','loot','treasure'].includes(t))prop(c,x,y,t,p);
    // House floor footprints will be covered by paintStructures afterward.
    return true;
  }
  const kinds={
    center:{roof:'#e96782',roofLight:'#ffc0c8',roofDark:'#ac3d5d',wall:'#fff7f0',stripe:'#ffe6e8',sign:'#fbe3e9'},
    market:{roof:'#3a9acc',roofLight:'#98ddf8',roofDark:'#24698d',wall:'#f5fbff',stripe:'#e3f3f9',sign:'#c1f0df'},
    gym:{roof:'#8b71ca',roofLight:'#c3b1e8',roofDark:'#5b4a91',wall:'#fbf7ff',stripe:'#eee8ff',sign:'#fff0aa'},
    house:{roof:'#d9935c',roofLight:'#f7d49d',roofDark:'#955736',wall:'#fff5dc',stripe:'#f6e4c9',sign:'#ffdca3'},
    atelier:{roof:'#69a9a0',roofLight:'#bcdfce',roofDark:'#3b7d75',wall:'#f9f0e6',stripe:'#e4f7eb',sign:'#f8dd9b'}
  };
  function paintBuilding(c,x,y,b,p){
    const a=kinds[b.id]||kinds.house;
    const xmid=x+72;
    c.save();
    oval(c,xmid,y+91,69,8,'#23465c',.18);
    // architectural base and ground-floor foundation
    rr(c,x+12,y+35,120,53,9,'#c3ad9a');
    rr(c,x+13,y+37,118,47,8,gradient(c,x+13,y+37,118,47,a.wall,a.stripe),'#d9c8ba',1.5);
    rr(c,x+13,y+79,118,7,3,'#c6a797');
    // substantial tiled pitched roof with perspective and big rounded eaves
    c.shadowColor='rgba(31,57,74,.29)';c.shadowBlur=9;c.shadowOffsetY=5;
    path(c,[[x+5,y+40],[x+22,y+9],[x+72,y-1],[x+121,y+9],[x+139,y+40],[x+131,y+47],[x+14,y+47]],a.roofDark,a.roofDark,2);
    c.shadowBlur=0;c.shadowOffsetY=0;
    path(c,[[x+8,y+37],[x+25,y+9],[x+72,y+3],[x+119,y+9],[x+136,y+37],[x+128,y+42],[x+16,y+42]],gradient(c,x,y+4,144,40,a.roofLight,a.roof),'#fff5e9',1.2);
    // ridge & roof scallops
    c.strokeStyle='rgba(255,255,255,.48)';c.lineWidth=2.5;c.lineCap='round';c.beginPath();c.moveTo(x+27,y+11);c.quadraticCurveTo(x+72,y-1,x+117,y+11);c.stroke();
    c.strokeStyle='rgba(79,65,73,.13)';c.lineWidth=1.3;
    for(let k=1;k<=3;k++){c.beginPath();c.moveTo(x+13+k*29,y+13);c.lineTo(x+9+k*30,y+35);c.stroke()}
    rr(c,x+10,y+38,124,7,3,a.roofDark);rr(c,x+14,y+39,116,3,1,a.roof);
    // visible window alcoves and lintels
    for(const wx of [x+29,x+99]){
      rr(c,wx-14,y+51,28,25,5,'#d4b6ab');rr(c,wx-12,y+53,24,21,4,'#539ec8','#f7ffff',1.5);
      rr(c,wx-10,y+55,20,17,3,gradient(c,wx-10,y+55,20,17,'#b8ecff','#75b8d9'));
      c.strokeStyle='#e8faff';c.lineWidth=2;c.beginPath();c.moveTo(wx,y+55);c.lineTo(wx,y+72);c.moveTo(wx-10,y+64);c.lineTo(wx+10,y+64);c.stroke();
      rr(c,wx-17,y+76,34,4,2,'#ead7c7');
    }
    // central door at south entrance (tile x+1, y+h-1)
    rr(c,x+57,y+54,30,36,11,'#8b685d','#f7e7ce',2.2);
    rr(c,x+60,y+57,24,31,9,'#644f58');
    rr(c,x+63,y+60,18,25,7,gradient(c,x+63,y+60,18,25,'#a27c6e','#6b5463'));
    dot(c,x+78,y+75,2.1,'#ffe9b5');
    // entrance steps are purely cosmetic; collisions remain untouched
    rr(c,x+54,y+87,36,6,3,'#e6cfb7');rr(c,x+57,y+93,30,3,2,'#d5b4a7');
    // colorful branded sign just below roof, above entry
    rr(c,x+55,y+41,34,17,8,a.sign,'rgba(255,255,255,.65)',1);
    if(b.id==='center'){
      rr(c,x+69,y+44,6,11,2,'#ed5a79');rr(c,x+65,y+48,14,4,2,'#ed5a79');
    }else if(b.id==='market'){
      rr(c,x+65,y+46,14,9,3,'#48ab9e');path(c,[[x+67,y+45],[x+70,y+43],[x+74,y+43],[x+77,y+45]],null,'#428b82',1.8);
    }else if(b.id==='gym'){
      path(c,[[x+72,y+43],[x+75,y+47],[x+80,y+47],[x+76,y+50],[x+77,y+55],[x+72,y+52],[x+67,y+55],[x+68,y+50],[x+64,y+47],[x+69,y+47]],'#ecb94d');
    }else if(b.id==='atelier'){
      path(c,[[x+70,y+45],[x+75,y+45],[x+77,y+49],[x+75,y+53],[x+68,y+53],[x+66,y+49]],'#4f8f7b');
    }else{dot(c,x+72,y+49,5,'#e5a857');}
    // chimney distinguishes house/atelier, awning distinguishes market
    if(b.id==='house'||b.id==='atelier'){
      rr(c,x+104,y+8,12,15,3,'#c77c5d');rr(c,x+102,y+7,16,5,2,'#e8ab82');
    }
    if(b.id==='market'){
      rr(c,x+16,y+45,28,9,4,'#f9e9cc');
      for(let i=0;i<4;i++) rr(c,x+18+i*7,y+46,6,7,2,i%2?'#ffffff':'#67b8d6');
    }
    // flowers near stoop
    for(const xx of [x+18,x+126]){
      rr(c,xx-6,y+77,12,9,4,'#ba8769');dot(c,xx-4,y+76,4,p.leaf);dot(c,xx+3,y+75,4,p.top);dot(c,xx,y+71,3,p.flower);
    }
    c.restore();
  }
  world.paintTile=paintTile;
  world.drawStructures=function(c,v,t){
    if(state.dungeon||state.v51Indoor)return;
    const p=pal();
    for(const b of world.buildings||[]){
      const x=(b.x-v.x0)*T,y=(b.y-v.y0)*T;
      paintBuilding(c,x,y,b,p);
    }
  };
  world.visualVersion='0.5.1';
  if(window.PokemonGame?.hd){window.PokemonGame.hd.version='0.5.1';window.PokemonGame.hd.forceRedraw?.()}
})();
