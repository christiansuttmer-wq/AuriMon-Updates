'use strict';
(() => {
  const VERSION='1.3.0';
  const T=48;
  const roomCanvas = document.getElementById('v51-room');
  const roomBar = document.querySelector('.v51-room-bar');
  const indoorThemes = {
    house:{wall:'#6d7f95', wall2:'#8092a6', floor:'#c49a6f', floor2:'#b78961', rug:'#9b5a63', rug2:'#c9867b', wood:'#6a4a3d', light:'#f7e3af'},
    atelier:{wall:'#66748b', wall2:'#73869e', floor:'#a38369', floor2:'#8f7159', rug:'#5a6c8d', rug2:'#8aa3d1', wood:'#63493d', light:'#edd596'}
  };
  const zoneAccent = ['#f7cf67','#8fd5ff','#d0bd91','#ffb1cb','#9fe7d7','#f0c77f','#d8a375','#bbeaff','#ec8c60','#d9e9f5','#ffe17f','#82d7be','#d4c49f','#dff8ff','#f3afe7','#9dd7f2','#ccb7ff','#c9efa5','#dec0ff','#ffdc99'];
  const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  const mix=(a,b,t)=>{
    const pa=[parseInt(a.slice(1,3),16),parseInt(a.slice(3,5),16),parseInt(a.slice(5,7),16)];
    const pb=[parseInt(b.slice(1,3),16),parseInt(b.slice(3,5),16),parseInt(b.slice(5,7),16)];
    return '#'+pa.map((v,i)=>Math.round(v+(pb[i]-v)*t).toString(16).padStart(2,'0')).join('');
  };
  const seed=(z,x,y,k=0)=>{let n=Math.imul(z+31,2654435761)^Math.imul(x+101,1597334677)^Math.imul(y+73,3812015801)^Math.imul(k+1,1103515245);n^=n>>>13;return n>>>0};
  const zone = () => state?.zone||0;
  function themePal(base){
    return {
      grass: mix(base.grass,'#f4ffe0',0.06),
      alt: mix(base.alt,'#f9ffe8',0.12),
      wild: mix(base.wild,'#2f7648',0.05),
      shadow: mix(base.shadow,'#102a20',0.15),
      path: mix(base.path,'#fff0ce',0.06),
      tree: mix(base.tree,'#214631',0.05),
      leaf: mix(base.leaf,'#b9ffb4',0.05),
      edge: mix(base.edge,'#13261e',0.08),
      water: mix(base.water,'#d8fbff',0.02),
      rock: mix(base.rock,'#dde0e8',0.03)
    };
  }
  const themes = {
    grass: themePal({grass:'#7dcf70',alt:'#9cdc8a',wild:'#58a84b',shadow:'#38794a',path:'#e3c38d',tree:'#2e7750',leaf:'#4ea765',edge:'#26513d',water:'#43a7d7',rock:'#8f96a5'}),
    ocean: themePal({grass:'#8dd4b4',alt:'#a8e1c4',wild:'#5db38d',shadow:'#3c8d79',path:'#e7cfac',tree:'#258878',leaf:'#65c2a0',edge:'#24675b',water:'#2f89c5',rock:'#9ba7ad'}),
    mountain: themePal({grass:'#aab287',alt:'#c2c4a1',wild:'#8d9a70',shadow:'#6d7255',path:'#ddceb5',tree:'#506e58',leaf:'#7f9e76',edge:'#47614f',water:'#67acc5',rock:'#9296a3'}),
    volcano: themePal({grass:'#b28f65',alt:'#c9a17a',wild:'#95684c',shadow:'#744c42',path:'#d8b18a',tree:'#6d4b3b',leaf:'#be825a',edge:'#54322e',water:'#b95b3f',rock:'#7f7276'}),
    ice: themePal({grass:'#b7e4ea',alt:'#d7f3f4',wild:'#8fc7d4',shadow:'#7baabc',path:'#e7ecee',tree:'#5a9198',leaf:'#9dd9de',edge:'#4f7787',water:'#60a0c9',rock:'#a7b0bd'}),
    dark: themePal({grass:'#718e95',alt:'#8ea2a4',wild:'#4f6f75',shadow:'#405867',path:'#afa6a2',tree:'#3a5f65',leaf:'#6c8f8a',edge:'#2d4a55',water:'#61829e',rock:'#808499'})
  };
  function currentPal(){
    const set = (themes[AREAS[state.zone]?.theme]||themes.grass);
    return set;
  }
  function roadLike(t){
    return t==='path'||t==='portal'||t==='loot'||t==='trainer'||t==='cave'||t==='legend'||t==='safari'||t==='rocketteam'||String(t).startsWith('v56-')||['center','market','gym','v51-house','v51-atelier'].includes(t);
  }
  function paintGround(c,x,y,t,pal,wx,wy){
    rect(c,x,y,T,T,pal.grass);
    rect(c,x,y,T,6,pal.alt); rect(c,x,y+42,T,6,pal.shadow);
    for(let i=0;i<18;i++){
      const xx=x+3+(seed(zone(),wx,wy,i)%42), yy=y+6+(seed(zone(),wy,wx,i+30)%36);
      rect(c,xx,yy,3,2,i%4?pal.alt:pal.shadow);
      if(i%5===0) rect(c,xx+1,yy-3,2,3,pal.alt);
    }
    if(t==='wild' || t==='grass'){
      const count=t==='wild'?6:3;
      for(let i=0;i<count;i++){
        const xx=x+5+i*7+(seed(zone(),wx,wy,i+100)%4);
        const yy=y+24+(seed(zone(),wx,wy,i+150)%12);
        rect(c,xx,yy-11,3,13,pal.wild);
        rect(c,xx+3,yy-8,4,5,pal.shadow);
        rect(c,xx-2,yy-7,2,4,pal.alt);
      }
      if(seed(zone(),wx,wy,222)%5===0){
        const accent=zoneAccent[zone()%zoneAccent.length];
        rect(c,x+25,y+22,3,12,'#2d7a4a');
        rect(c,x+20,y+18,13,6,accent); rect(c,x+24,y+14,5,12,accent); rect(c,x+25,y+21,3,3,'#fff9dd');
      }
    }
  }
  function paintPath(c,x,y,pal,wx,wy){
    rect(c,x,y,T,T,pal.path);
    rect(c,x,y,48,4,mix(pal.path,'#fff6df',0.35));
    rect(c,x,y+44,48,4,mix(pal.path,pal.shadow,0.2));
    for(let i=0;i<10;i++){
      let px=x+3+(seed(zone(),wx,wy,i)%40), py=y+5+(seed(zone(),wy,wx,i+50)%37);
      rect(c,px,py,4+i%2,2,i%2?mix(pal.path,'#fff3d2',0.4):mix(pal.path,pal.shadow,0.1));
    }
    if(!roadLike(atPosition(zone(),wx,wy-1))) for(let i=0;i<12;i++) rect(c,x+i*4,y,4,2+(seed(zone(),wx,wy,i+80)%5),pal.grass);
    if(!roadLike(atPosition(zone(),wx,wy+1))) for(let i=0;i<12;i++) rect(c,x+i*4,y+42+(seed(zone(),wx,wy,i+90)%4),4,6,pal.shadow);
    if(!roadLike(atPosition(zone(),wx-1,wy))) for(let i=0;i<12;i++) rect(c,x,y+i*4,2+(seed(zone(),wx,wy,i+100)%4),4,pal.grass);
    if(!roadLike(atPosition(zone(),wx+1,wy))) for(let i=0;i<12;i++) rect(c,x+42+(seed(zone(),wx,wy,i+110)%4),y+i*4,6,4,pal.alt);
  }
  function paintWater(c,x,y,pal,wx,wy){
    rect(c,x,y,T,T,pal.water);
    rect(c,x,y,48,6,'#c7f6ff');
    rect(c,x,y+42,48,6,mix(pal.water,'#154a73',0.28));
    for(let i=0;i<4;i++){
      const yy=y+10+i*9, xx=x+4+(seed(zone(),wx,wy,i+200)%28);
      rect(c,xx,yy,18,2,i%2?'#84e5f5':'#dafcff');
      rect(c,xx+5,yy+3,12,2,'#5bbfd8');
    }
  }
  function paintTree(c,x,y,pal,wx,wy){
    paintGround(c,x,y,'grass',pal,wx,wy);
    rect(c,x+17,y+28,14,15,'#6a4a37'); rect(c,x+22,y+25,4,18,'#9e7558');
    rect(c,x+9,y+18,31,17,pal.edge); rect(c,x+4,y+20,40,14,pal.tree);
    rect(c,x+8,y+10,34,17,pal.leaf); rect(c,x+14,y+5,22,15,mix(pal.leaf,'#d8ffc4',0.18));
    rect(c,x+12,y+12,11,4,'#d8f9aa'); rect(c,x+28,y+18,8,5,pal.tree);
    if(seed(zone(),wx,wy,300)%4===0){ rect(c,x+19,y+17,3,3,'#ffd0de'); rect(c,x+25,y+15,3,3,'#ffe6a9'); }
    rect(c,x+6,y+33,36,4,mix(pal.edge,'#000',0.15));
  }
  function paintRock(c,x,y,pal,wx,wy){
    paintGround(c,x,y,'grass',pal,wx,wy);
    rect(c,x+4,y+31,40,11,'#5a6270'); rect(c,x+8,y+16,34,22,pal.rock);
    rect(c,x+14,y+10,24,16,mix(pal.rock,'#ffffff',0.22)); rect(c,x+11,y+19,8,9,'#dce0e8');
    rect(c,x+31,y+24,8,10,'#697589');
    if([7,13,18].includes(zone())){ const a=zoneAccent[zone()%zoneAccent.length]; rect(c,x+26,y+4,7,28,a); rect(c,x+24,y+7,12,8,'#f4ffff'); }
  }
  function paintStructure(c,x,y,b,pal){
    const w=144,h=96,z=zone(), accent=zoneAccent[z%zoneAccent.length];
    const main = b.id==='center'?'#efe5d6':b.id==='market'?'#f2d6a4':b.id==='gym'?'#d9d7db':b.id==='atelier'?'#dfc2ab':'#f4e1bf';
    const wall = b.id==='center'?'#fff7ec':b.id==='market'?'#fff2d4':b.id==='gym'?'#ecebf0':b.id==='atelier'?'#f0d5bf':'#fef0cc';
    const roof = b.id==='center'?'#c95062':b.id==='market'?'#2f92b7':b.id==='gym'?'#6653a0':b.id==='atelier'?'#876a80':'#b86c40';
    const trim = b.id==='center'?'#ffe9ee':b.id==='market'?'#d9fcff':b.id==='gym'?'#ece2ff':'#ffe1b6';
    rect(c,x+10,y+82,126,11,'#1d243466');
    rect(c,x+8,y+34,128,50,main); rect(c,x+11,y+37,122,42,wall); rect(c,x+10,y+76,126,7,'#b79278');
    for(let k=0;k<10;k++){ let xx=x+13+k*12; rect(c,xx,y+50,7,2,'#bca68b'); rect(c,xx+5,y+65,7,2,'#eac4a0'); }
    rect(c,x+2,y+32,140,14,'#263048'); rect(c,x+6,y+24,132,13,roof); rect(c,x+11,y+14,122,16,roof); rect(c,x+25,y+5,96,13,roof); rect(c,x+40,y+0,66,9,roof);
    rect(c,x+13,y+16,118,4,trim); rect(c,x+9,y+30,128,4,'#342b42');
    for(let r=0;r<4;r++) for(let k=0;k<13;k++){ const sx=x+14+k*9+(r%2?4:0), sy=y+18+r*5; if(sx>x+128) continue; rect(c,sx,sy,7,2,k%3?'#ffffff22':'#16243a2b'); }
    rect(c,x+39,y+3,66,2,'#fff5c48a');
    if(b.id==='center'){ rect(c,x+67,y+10,11,14,'#fff8ef'); rect(c,x+61,y+15,23,5,'#fff8ef'); }
    if(b.id==='gym'){ rect(c,x+64,y+10,15,15,'#ffd06d'); rect(c,x+68,y+8,7,18,'#fff0bb'); }
    if(b.id==='market'){ rect(c,x+55,y+10,37,12,'#fff2d1'); rect(c,x+60,y+13,27,5,'#478ca4'); }
    if(b.id==='atelier'){ rect(c,x+66,y+10,10,18,'#fae5a1'); rect(c,x+61,y+16,20,5,'#fae5a1'); }
    if(b.id==='house'){ rect(c,x+60,y+10,24,10,'#fff0af'); rect(c,x+66,y+13,12,3,'#cf7e56'); }
    for(const px of [23,106]){ rect(c,x+px-4,y+50,24,28,'#5e5458'); rect(c,x+px,y+53,16,21,'#78c7e0'); rect(c,x+px+3,y+54,5,18,'#c6f4ff'); rect(c,x+px,y+64,16,3,'#e1eedc'); rect(c,x+px+9,y+53,3,21,'#49739a'); rect(c,x+px-2,y+48,20,2,trim); }
    rect(c,x+59,y+46,27,39,'#382f3f'); rect(c,x+62,y+49,21,35,'#735755'); rect(c,x+65,y+54,15,29,'#493a46'); rect(c,x+77,y+68,3,3,'#ffd97e');
    rect(c,x+56,y+83,34,4,'#ebd5b2'); rect(c,x+53,y+88,40,5,'#baa98a');
    rect(c,x+15,y+83,22,4,accent); rect(c,x+108,y+83,22,4,accent);
    rect(c,x+14,y+36,8,42,'#00000016');
    const pathCol = mix(pal.path,'#fff6d5',0.06); rect(c,x+54,y+93,37,3,pathCol);
  }
  function paintIndoor(){
    if(!roomCanvas || roomCanvas.hidden || !state?.v51Indoor) return;
    const o=state.v51Indoor; const kind=o.kind==='atelier'?'atelier':'house'; const p=indoorThemes[kind];
    const c=roomCanvas.getContext('2d'); c.imageSmoothingEnabled=false;
    const tile=64; const accent=zoneAccent[(o.zone||0)%zoneAccent.length];
    rect(c,0,0,576,448,p.wall);
    // upper wall gradient / beams
    rect(c,0,0,576,96,p.wall2); rect(c,0,92,576,8,'#4c5970');
    for(let x=0;x<576;x+=36) rect(c,x,0,8,96,mix(p.wall2,'#39465c',0.25));
    // windows
    for(const wx of [86, 424]){
      rect(c,wx,24,68,54,'#31465c'); rect(c,wx+4,28,60,46,'#b7ecff'); rect(c,wx+8,32,24,18,'#dffbff'); rect(c,wx+37,28,4,46,'#587ea0'); rect(c,wx+4,49,60,4,'#ecf7ff');
      rect(c,wx-6,20,80,6,p.wood); rect(c,wx-6,78,80,6,p.wood);
    }
    // floorboards
    for(let y=0;y<7;y++) for(let x=0;x<9;x++){
      const px=x*tile, py=y*tile;
      rect(c,px,py,tile,tile, y<2 ? p.wall2 : ((x+y)%2?p.floor:p.floor2));
      if(y>=2){ rect(c,px,py+58,tile,6,mix(p.floor2,'#6f4a35',0.18)); rect(c,px+2,py+2,tile-4,2,mix(p.floor,'#f1d1a5',0.25)); }
    }
    // Rug
    rect(c,2*tile+18,3*tile+10,5*tile-36,3*tile-12,p.rug);
    rect(c,2*tile+26,3*tile+18,5*tile-52,3*tile-28,p.rug2);
    for(let i=0;i<7;i++){ rect(c,2*tile+34+i*32,3*tile+24,8,2,accent); rect(c,2*tile+34+i*32,5*tile+24,8,2,accent); }
    // furniture
    if(kind==='house'){
      // bed left
      rect(c,2*tile+4,2*tile+2,56,46,p.wood); rect(c,2*tile+10,2*tile+10,44,30,'#d5c5a2'); rect(c,2*tile+12,2*tile+22,40,16,'#f4ebe3'); rect(c,2*tile+14,2*tile+12,18,10,'#fff8e7');
      // table right chest
      rect(c,6*tile+5,3*tile+10,54,38,p.wood); rect(c,6*tile+10,3*tile+14,44,11,'#e8bc6f'); rect(c,6*tile+18,3*tile+26,10,10,'#ffdf8a');
      // plant
      rect(c,1*tile+18,4*tile+18,26,26,p.wood); rect(c,1*tile+22,4*tile+4,18,18,'#6f4e42'); rect(c,1*tile+16,4*tile,32,12,'#63b576'); rect(c,1*tile+20,4*tile-6,24,12,'#8ad098');
    } else {
      // atelier bookshelf
      rect(c,2*tile+8,2*tile+4,50,50,p.wood); for(let i=0;i<3;i++){ rect(c,2*tile+14,2*tile+12+i*12,38,2,'#e3cc9d'); rect(c,2*tile+16,2*tile+6+i*12,8,8,['#dd8f7d','#8fc3f6','#caa9ff'][i]); rect(c,2*tile+28,2*tile+6+i*12,7,8,['#f0d07d','#a7df95','#89b6dc'][i]); }
      // workbench chest-like
      rect(c,6*tile+4,3*tile+8,55,40,p.wood); rect(c,6*tile+10,3*tile+14,43,10,'#d9b67e'); rect(c,6*tile+14,3*tile+28,35,8,'#7db7dc');
      rect(c,1*tile+18,4*tile+18,28,26,p.wood); rect(c,1*tile+20,4*tile+8,24,12,'#fff4ce'); rect(c,1*tile+22,4*tile+4,18,7,accent);
    }
    // resident
    const face=state.v56IndoorFacing||'down', rx=4*tile+32, ry=2*tile+18;
    rect(c,rx-11,ry+22,22,5,'#00000033'); rect(c,rx-10,ry-2,20,25,kind==='house'?'#e88b9d':'#6b8dc0'); rect(c,rx-9,ry-25,18,23,'#ecc3a1'); rect(c,rx-10,ry-29,20,8,'#4a3550'); rect(c,rx-8,ry+20,7,12,'#3d5576'); rect(c,rx+2,ry+20,7,12,'#3d5576');
    if(face==='down'){ rect(c,rx-4,ry-12,3,3,'#293047'); rect(c,rx+3,ry-12,3,3,'#293047'); }
    if(face==='left') rect(c,rx-7,ry-12,4,3,'#293047');
    if(face==='right') rect(c,rx+4,ry-12,4,3,'#293047');
    if(face==='up') rect(c,rx-8,ry-24,16,6,'#4a3550');
    // player
    const hx=o.x*tile+32, hy=o.y*tile+36;
    rect(c,hx-12,hy+16,24,5,'#00000030'); rect(c,hx-10,hy-7,20,26,state.profileGender==='girl'?'#de6999':'#357fc5'); rect(c,hx-9,hy-30,18,23,'#edc6a6'); rect(c,hx-10,hy-34,20,8,'#463761'); rect(c,hx-8,hy+16,7,12,'#334d73'); rect(c,hx+2,hy+16,7,12,'#334d73');
    if((state.facing||'down')==='down'){ rect(c,hx-4,hy-16,3,3,'#23304d'); rect(c,hx+3,hy-16,3,3,'#23304d'); }
    if((state.facing||'down')==='left') rect(c,hx-7,hy-16,4,3,'#23304d');
    if((state.facing||'down')==='right') rect(c,hx+4,hy-16,4,3,'#23304d');
    if((state.facing||'down')==='up') rect(c,hx-8,hy-28,16,6,'#463761');
    c.fillStyle='#fffdf2'; c.font='bold 15px monospace'; c.fillText('A: SPRECHEN · TRUHE RECHTS · AUSGANG UNTEN', 12, 22);
  }
  function polishBattle(){
    const box=document.getElementById('battle-content'); if(!box||!battle) return;
    box.classList.add('v57-battle');
    const top=box.querySelector('.battletop'); if(top){ const b=top.querySelector('b'); if(b) b.textContent += ' · HD-PIXEL '+VERSION; }
  }
  function polishHeader(){
    document.querySelector('.brand span')?.replaceChildren(document.createTextNode('DEINE AURIMON-WELT · VERSION '+VERSION));
    const mp=document.querySelector('.maptop b'); if(mp && !/GANZES GEBIET/.test(mp.textContent)) mp.textContent='KARTE · GANZES GEBIET';
    const mk=document.querySelector('.maptop span'); if(mk) mk.textContent='14 × 11 · A / B / MENÜ';
  }
  const baseWorld56 = window.PokemonWorld56 || {};
  window.PokemonWorld56 = Object.assign({}, baseWorld56, {
    version: VERSION,
    paintTile(c,x,y,t,pal,wx,wy){
      const p=currentPal();
      const groundLike=['wild','grass','tree','rock','path','water'].includes(t) || String(t).startsWith('v56-') || ['center','market','gym','v51-house','v51-atelier'].includes(t);
      if(!groundLike) return false;
      const pathLike=t==='path'||['center','market','gym'].includes(t)||String(t).startsWith('v56-')||t==='v51-house'||t==='v51-atelier';
      if(t==='water') { paintWater(c,x,y,p,wx,wy); return true; }
      if(pathLike) { paintPath(c,x,y,p,wx,wy); }
      else { paintGround(c,x,y,t,p,wx,wy); }
      if(t==='tree') paintTree(c,x,y,p,wx,wy);
      else if(t==='rock') paintRock(c,x,y,p,wx,wy);
      else if(!pathLike && seed(zone(),wx,wy,500)%8===0){ const a=zoneAccent[zone()%zoneAccent.length]; rect(c,x+28,y+26,5,6,'#385e43'); rect(c,x+23,y+21,14,7,a); rect(c,x+29,y+19,4,9,'#fff4df'); }
      return true;
    },
    drawStructures(c,view,t,pal){
      if(state.dungeon||state.v51Indoor) return;
      const x0=view.x0,y0=view.y0;
      const buildings = (window.PokemonWorld56 && window.PokemonWorld56.buildings) || [];
      for(const b of buildings) paintStructure(c,(b.x-x0)*T,(b.y-y0)*T,b,currentPal());
    },
    character(c,cx,cy,gender,dir,walkTime,enemy){
      let x=Math.round(cx), y=Math.round(cy); const step=walkTime&&state.steps?Math.round(Math.sin(walkTime*.012)*2):0;
      const coat=enemy?'#af4762':(state.v55Outfit?.coat||(gender==='girl'?'#e56d9f':'#3984cc'));
      const light=enemy?'#ffbfa6':(state.v55Outfit?.light||'#c7e9ff');
      const hair=enemy?'#4d3948':(state.v55Outfit?.hair||'#5f455b');
      rect(c,x-13,y+12,26,6,'#18344a6a');
      rect(c,x-9,y+1,7,15+step,'#2c3557'); rect(c,x+2,y+1,7,15-step,'#2c3557');
      rect(c,x-10,y+13+step,9,4,'#22283a'); rect(c,x+2,y+13-step,9,4,'#22283a');
      rect(c,x-10,y-12,21,18,coat); rect(c,x-10,y-12,4,17,'#20375066'); rect(c,x+6,y-12,5,18,light);
      rect(c,x-13,y-10,4,15,'#f2c4a2'); rect(c,x+10,y-10,4,15,'#f2c4a2');
      rect(c,x-8,y-29,17,18,'#ecc5a5'); rect(c,x-9,y-31,19,8,hair);
      if(gender==='girl'){ rect(c,x-11,y-28,5,23,hair); rect(c,x+8,y-28,5,21,hair); rect(c,x-7,y-33,15,5,'#efe0a2'); }
      else{ rect(c,x-11,y-31,20,5,hair); rect(c,x-7,y-35,13,5,hair); rect(c,x+8,y-27,4,6,light); }
      if(dir==='down'){ rect(c,x-5,y-21,3,3,'#2f3147'); rect(c,x+4,y-21,3,3,'#2f3147'); }
      if(dir==='left'){ rect(c,x-7,y-21,4,3,'#2f3147'); rect(c,x+7,y-20,3,3,'#c78e73'); }
      if(dir==='right'){ rect(c,x+5,y-21,4,3,'#2f3147'); rect(c,x-8,y-20,3,3,'#c78e73'); }
      if(dir==='up'){ rect(c,x-8,y-27,17,10,hair); rect(c,x-4,y-14,9,3,light); }
      return true;
    },
    drawPerson(c,x,y,n,z,ms){ this.character(c,x,y,'boy',this.npcFacing?this.npcFacing(n,z):'down',0,true); },
    lighting(c,view,T,ms){
      if(state.v51Indoor) return;
      if(state.dungeon){
        c.fillStyle='rgba(5,9,18,.18)'; c.fillRect(0,0,view.w*T,view.h*T);
        for(let i=0;i<3;i++){
          const xx=(i*157+35)% (view.w*T), yy=(i*113+29)%(view.h*T);
          const g=c.createRadialGradient(xx,yy,0,xx,yy,56); g.addColorStop(0,'rgba(255,210,123,.14)'); g.addColorStop(1,'rgba(255,210,123,0)');
          c.fillStyle=g; c.fillRect(xx-56,yy-56,112,112);
        }
        return;
      }
      if(v4Time().night){
        for(const b of (this.buildings||[])){
          const x=(b.x-view.x0)*T+72,y=(b.y-view.y0)*T+54;
          const g=c.createRadialGradient(x,y,10,x,y,72); g.addColorStop(0,'rgba(255,232,164,.24)'); g.addColorStop(1,'rgba(255,232,164,0)');
          c.fillStyle=g; c.fillRect(x-72,y-72,144,144);
        }
        c.fillStyle='rgba(7,18,45,.10)'; c.fillRect(0,0,view.w*T,view.h*T);
      } else {
        const beamX=(Math.sin(ms*.00027)*.5+.5)*(view.w*T);
        const sun=c.createLinearGradient(beamX,0,beamX+120,0); sun.addColorStop(0,'rgba(255,249,204,.02)'); sun.addColorStop(.5,'rgba(255,249,204,.08)'); sun.addColorStop(1,'rgba(255,249,204,0)');
        c.fillStyle=sun; c.fillRect(0,0,view.w*T,view.h*T);
      }
    }
  });
  // retain buildings array if previously present
  if(baseWorld56.buildings) window.PokemonWorld56.buildings = baseWorld56.buildings;
  if(baseWorld56.buildingAt) window.PokemonWorld56.buildingAt = baseWorld56.buildingAt;
  if(baseWorld56.isDoor) window.PokemonWorld56.isDoor = baseWorld56.isDoor;
  if(baseWorld56.npcAt) window.PokemonWorld56.npcAt = baseWorld56.npcAt;
  if(baseWorld56.npcFacing) window.PokemonWorld56.npcFacing = baseWorld56.npcFacing;
  if(baseWorld56.repairOldPosition) window.PokemonWorld56.repairOldPosition = baseWorld56.repairOldPosition;

  const oldRenderMap = renderMap;
  renderMap = function(){ oldRenderMap(); polishHeader(); paintIndoor(); if(state?.dungeon){ const map=document.getElementById('hd-map-canvas'); if(map){ const ctx=map.getContext('2d'); if(ctx){ ctx.fillStyle='rgba(9,16,25,.08)'; ctx.fillRect(0,0,map.width,map.height); for(let i=0;i<3;i++){ const xx=(i*131+37)%map.width, yy=(i*97+23)%map.height; const g=ctx.createRadialGradient(xx,yy,0,xx,yy,42); g.addColorStop(0,'rgba(255,208,107,.11)'); g.addColorStop(1,'rgba(255,208,107,0)'); ctx.fillStyle=g; ctx.fillRect(xx-42,yy-42,84,84); } } } } };

  const oldBattleRender = renderBattle;
  renderBattle = function(){ oldBattleRender(); polishBattle(); };

  function rafPolish(){
    if(state?.v51Indoor) paintIndoor();
    requestAnimationFrame(rafPolish);
  }
  requestAnimationFrame(rafPolish);
  polishHeader();
  if(window.PokemonGame?.hd) window.PokemonGame.hd.version = VERSION;
})();
