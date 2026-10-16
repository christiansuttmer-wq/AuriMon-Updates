/* AuriMon 0.5.0 — X/Y-inspirierter Welt-Renderer.
   Modernere, weichere Top-Down-Welt ohne Änderung der Spielregeln oder Speicherstände. */
'use strict';
(() => {
  const map = document.getElementById('game-map');
  const T = 48;
  const colorSets = {
    grass:   {grass:'#8fdc7f',alt:'#aee99a',wild:'#5fba57',shadow:'#4f9350',path:'#dcbc90',path2:'#efdbb6',tree:'#2a8b64',leaf:'#57c87f',leaf2:'#87e2a1',edge:'#1e684b',water:'#58bfe8',water2:'#2f8fca',rock:'#a3acb8',flower:'#ffd07c'},
    ocean:   {grass:'#92ddb9',alt:'#b4efd0',wild:'#55be92',shadow:'#4a9d82',path:'#e5d2ac',path2:'#f4e4c8',tree:'#2c9275',leaf:'#6bd0a3',leaf2:'#8ee7bc',edge:'#1f6d59',water:'#3aa8de',water2:'#2c7fb8',rock:'#a2b8be',flower:'#fff1a7'},
    mountain:{grass:'#a9c57f',alt:'#c6d79e',wild:'#769255',shadow:'#62754a',path:'#ddc5a1',path2:'#f0dec5',tree:'#4e805a',leaf:'#78a96c',leaf2:'#97c786',edge:'#395b42',water:'#6ab7d4',water2:'#4d95b7',rock:'#9da0ad',flower:'#f4dc87'},
    volcano: {grass:'#b79677',alt:'#d0ad8d',wild:'#98654d',shadow:'#7f5647',path:'#e0bc98',path2:'#f0d1aa',tree:'#825d46',leaf:'#c78866',leaf2:'#e0ad8a',edge:'#63463a',water:'#d37558',water2:'#9e4e38',rock:'#89797d',flower:'#ffd29d'},
    ice:     {grass:'#c3edf0',alt:'#def7f7',wild:'#94d4e2',shadow:'#84b9c7',path:'#e8eef1',path2:'#fffaf0',tree:'#5aa0b1',leaf:'#b5eaf3',leaf2:'#d3f8ff',edge:'#4c8397',water:'#6cb5d8',water2:'#4a8bb5',rock:'#a8b7c5',flower:'#fffefb'},
    dark:    {grass:'#7ba0a6',alt:'#98b0b7',wild:'#557984',shadow:'#496570',path:'#baa89d',path2:'#d4c4b5',tree:'#43656a',leaf:'#7ca0a1',leaf2:'#9ab6b6',edge:'#304d54',water:'#6c96ba',water2:'#4f7091',rock:'#848a9d',flower:'#dcc7ff'}
  };
  let canvas = null, ctx = null, ground = document.createElement('canvas'), backCtx = ground.getContext('2d');
  let lastKey='', view={w:11,h:9,x0:0,y0:0}, frames=0;
  let motion=null, lastFrame=0, enabled=true;
  const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  const rr=(c,x,y,w,h,r,col,stroke=null,lw=0)=>{ c.beginPath(); c.fillStyle=col; c.roundRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h),r); c.fill(); if(stroke){c.lineWidth=lw||1.5;c.strokeStyle=stroke;c.stroke();}};
  const dot=(c,x,y,r,col,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();};
  const dHash=(a,b,c)=>{let n=Math.imul((a+11)*2246822519^(b+7)*3266489917^(c+3)*668265263,1597334677);n^=n>>>13;return n>>>0};
  const randF=(a,b,c)=>(dHash(a,b,c)%1000)/1000;
  const rgb=(hex)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const mix=(a,b,t)=>{const aa=rgb(a),bb=rgb(b);return '#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*t).toString(16).padStart(2,'0')).join('')};
  const C=()=>colorSets[AREAS[state.zone]?.theme]||colorSets.grass;
  const tileAt=(x,y)=>state.dungeon?v4CaveTile(x,y):atPosition(state.zone,x,y);
  function viewSize(){if(state.dungeon)return [11,9];return v42Camera()}
  function setCanvas(){
    const [w,h]=viewSize(),needsNew=!canvas||view.w!==w||view.h!==h;
    view.w=w;view.h=h;
    if(!canvas){canvas=document.createElement('canvas');canvas.id='hd-map-canvas';canvas.className='hd-map-canvas';canvas.setAttribute('aria-hidden','true');canvas.style.pointerEvents='none';}
    if(canvas.parentElement!==map)map.appendChild(canvas);
    if(needsNew){canvas.width=w*T;canvas.height=h*T;ground.width=w*T;ground.height=h*T;ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;backCtx=ground.getContext('2d',{alpha:false});backCtx.imageSmoothingEnabled=true;lastKey='';}
    map.classList.add('hd-render');
    map.classList.toggle('sun-25d',!!window.AuriSun25?.enabled?.());
    document.body.classList.toggle('aurimon-sun25',!!window.AuriSun25?.enabled?.());
    if(state.dungeon){view.x0=0;view.y0=0;}else {view.x0=clamp(state.x-Math.floor(w/2),0,V41_W-w);view.y0=clamp(state.y-Math.floor(h/2),0,V41_H-h)}
  }
  function grassBase(c,x,y,t,pal,wx,wy){
    c.save();
    const g=c.createLinearGradient(x,y,x,y+T);g.addColorStop(0,pal.alt);g.addColorStop(.55,pal.grass);g.addColorStop(1,mix(pal.grass,pal.shadow,.28));
    rect(c,x,y,T,T,g); rr(c,x+2,y+3,T-4,T-6,9,'rgba(255,255,255,.045)');
    for(let i=0;i<6;i++){ const xx=x+5+(dHash(wx,wy,i)%37), yy=y+9+(dHash(wy,wx,i+24)%28); dot(c,xx,yy,1.6,i%2?pal.alt:mix(pal.grass,'#ffffff',.18),.65);}    
    for(let i=0;i<4;i++){ const xx=x+7+i*10+(dHash(wx,wy,i+80)%4), stem=y+31+(dHash(wy,wx,i+11)%4), sway=Math.sin((wx+wy+i)*1.2)*1.4; c.strokeStyle=i%2?pal.shadow:pal.wild; c.lineWidth=2; c.beginPath(); c.moveTo(xx,stem+5); c.quadraticCurveTo(xx+sway,stem-5,xx+1.5*sway,stem-15); c.stroke(); dot(c,xx+1.5*sway,stem-15,2.2,pal.alt,.8);}    
    if(t==='wild'){
      for(let i=0;i<6;i++){const xx=x+4+i*7+(dHash(wx,wy,i+3)%3),yy=y+26+(dHash(wx,wy,i+61)%6); c.strokeStyle=i%2?pal.wild:mix(pal.wild,pal.shadow,.2); c.lineWidth=2.6; c.beginPath(); c.moveTo(xx,yy+8); c.quadraticCurveTo(xx+2,yy,xx+1,yy-10); c.stroke();}
    }else if(dHash(wx,wy,58)%10===0){
      const fx=x+10+(dHash(wx,wy,91)%26), fy=y+14+(dHash(wx,wy,92)%18), pet=pal.flower; dot(c,fx,fy,2.3,pet,.9); dot(c,fx+4,fy+2,1.8,mix(pet,'#ffffff',.2),.85); dot(c,fx-3,fy+3,1.5,'#ffffff',.7);
    }
    c.restore();
  }
  function pathway(c,x,y,pal,wx,wy){
    c.save();
    const g=c.createLinearGradient(x,y,x,y+T);g.addColorStop(0,pal.path2);g.addColorStop(1,pal.path);
    rr(c,x,y,T,T,8,g);
    c.strokeStyle=mix(pal.path,pal.shadow,.34); c.lineWidth=1.2; c.strokeRect(x+.5,y+.5,T-1,T-1);
    for(let iy=0; iy<3; iy++) for(let ix=0; ix<3; ix++){
      const px=x+4+ix*14+(dHash(wx+ix,wy+iy,9)%3), py=y+5+iy*12+(dHash(wy+iy,wx+ix,13)%3);
      rr(c,px,py,10+dHash(ix,iy,wx)%3,7+dHash(iy,ix,wy)%2,3, iy%2?mix(pal.path,'#ffffff',.18):mix(pal.path,pal.shadow,.08), mix(pal.path,pal.shadow,.22),1);
    }
    c.restore();
  }
  function tree(c,x,y,pal,wx,wy){
    grassBase(c,x,y,'grass',pal,wx,wy);
    c.save();
    rr(c,x+21,y+27,7,13,4,'#8b644a'); rr(c,x+19,y+24,11,5,3,'#a9785a');
    dot(c,x+24,y+20,16,pal.edge,.98); dot(c,x+13,y+21,11,pal.tree,.96); dot(c,x+35,y+21,11,pal.tree,.96); dot(c,x+18,y+12,11,pal.leaf,.98); dot(c,x+29,y+11,12,pal.leaf,.98); dot(c,x+24,y+7,9,pal.leaf2,.96);
    dot(c,x+17,y+11,3.5,mix(pal.leaf2,'#ffffff',.2),.75); dot(c,x+30,y+14,3,mix(pal.leaf2,'#ffffff',.15),.7);
    c.fillStyle='rgba(14,54,46,.12)'; c.beginPath(); c.ellipse(x+24,y+31,15,6,0,0,Math.PI*2); c.fill();
    c.restore();
  }
  function rock(c,x,y,pal,wx,wy){
    grassBase(c,x,y,'grass',pal,wx,wy);
    c.save();
    dot(c,x+16,y+28,11,mix(pal.rock,'#ffffff',.08),1); dot(c,x+29,y+24,13,pal.rock,.98); dot(c,x+21,y+19,12,mix(pal.rock,'#ffffff',.18),1);
    dot(c,x+17,y+16,3,'#ffffff',.45); dot(c,x+31,y+27,2,mix(pal.rock,pal.shadow,.4),.6);
    c.restore();
  }
  function waterTile(c,x,y,pal,wx,wy){
    c.save();
    const g=c.createLinearGradient(x,y,x,y+T); g.addColorStop(0,mix(pal.water,'#ffffff',.28)); g.addColorStop(.45,pal.water); g.addColorStop(1,pal.water2);
    rr(c,x,y,T,T,8,g);
    for(let i=0;i<3;i++){ const yy=y+11+i*11+(dHash(wx,wy,i)%3); c.strokeStyle=i%2?'rgba(255,255,255,.35)':'rgba(165,236,255,.35)'; c.lineWidth=2; c.beginPath(); c.moveTo(x+4,yy); c.quadraticCurveTo(x+16,yy-3,x+27,yy); c.quadraticCurveTo(x+38,yy+3,x+44,yy); c.stroke(); }
    if(dHash(wx,wy,67)%8===0){ dot(c,x+14+(dHash(wx,wy,68)%20),y+16+(dHash(wx,wy,69)%14),3,'#c4f9ff',.55); }
    c.restore();
  }
  function building(c,x,y,kind,pal,wx,wy){
    pathway(c,x,y,pal,wx,wy);
    c.save();
    const scheme = kind==='center' ? {roof:'#e86f7e',trim:'#ffdbe1',wall:'#fff7f1',sign:'#ef4f67'} : kind==='gym' ? {roof:'#f0b264',trim:'#fff0cd',wall:'#f7efe3',sign:'#f5cf73'} : {roof:'#5aa5d8',trim:'#dff4ff',wall:'#f9f7f2',sign:'#58c1a1'};
    rr(c,x+6,y+19,36,22,7,scheme.wall,mix('#d8cabb','#7b7d85',.35),1.2);
    rr(c,x+4,y+12,40,12,7,scheme.roof,mix(scheme.roof,'#83495a',.28),1.2);
    rr(c,x+10,y+7,28,9,7,mix(scheme.roof,'#ffffff',.12),mix(scheme.roof,'#83495a',.2),1.1);
    rr(c,x+17,y+28,14,14,4,'#6e5149'); rr(c,x+20,y+30,8,10,3,'#8a6d60'); dot(c,x+27,y+35,1.5,'#f2dca3',.9);
    rr(c,x+9,y+27,8,9,3,'#abebff'); rr(c,x+31,y+27,8,9,3,'#abebff');
    rr(c,x+15,y+15,18,6,4,scheme.trim);
    if(kind==='center'){ dot(c,x+24,y+18,2.8,'#ffffff',.92); rect(c,x+23,y+14,2,8,'#ffffff'); rect(c,x+20,y+17,8,2,'#ffffff'); }
    if(kind==='gym'){ rr(c,x+18,y+15,12,6,3,'#fff2ba'); }
    if(kind==='market'){ rr(c,x+17,y+15,14,6,3,'#dff9d5'); }
    c.restore();
  }
  function specialTile(c,x,y,t,pal,wx,wy){
    if(t==='portal'){ pathway(c,x,y,pal,wx,wy); rr(c,x+13,y+9,22,31,7,'#6e97c5',mix('#3e5b7c','#ffffff',.18),1.2); rr(c,x+18,y+4,12,10,6,'#c5dfff'); rect(c,x+23,y+10,2,27,'#f6ebc7'); }
    if(t==='cave'){ grassBase(c,x,y,'grass',pal,wx,wy); rr(c,x+5,y+11,38,31,9,'#545967'); rr(c,x+10,y+16,28,24,8,'#171b29'); rect(c,x+11,y+10,26,5,'#8d949f'); }
    if(t==='rocketteam'){ pathway(c,x,y,pal,wx,wy); rr(c,x+13,y+12,22,29,7,'#3e3957'); rr(c,x+18,y+7,12,10,6,'#cf5476'); rect(c,x+23,y+12,2,16,'#ffe0ea'); }
    if(t==='safari'){ pathway(c,x,y,pal,wx,wy); rr(c,x+11,y+6,26,36,7,'#5a9c70'); rr(c,x+16,y+14,16,16,4,'#ffe09c'); rr(c,x+21,y+10,6,14,3,'#4a4a52'); }
    if(t==='legend'){ pathway(c,x,y,pal,wx,wy); rr(c,x+12,y+8,24,33,7,'#7c68a4'); rr(c,x+17,y+14,14,20,4,'#c8b9ef'); rr(c,x+21,y+18,6,12,3,'#f8fbff'); }
    if(t==='loot'||t==='treasure'){ pathway(c,x,y,pal,wx,wy); rr(c,x+16,y+17,16,12,3,'#8f5c3d'); rr(c,x+16,y+17,16,4,2,'#e0b55c'); rect(c,x+22,y+17,4,12,'#ffe59a'); }
  }
  function staticTile(c,i,j,wx,wy,pal){
    const x=i*T,y=j*T,t=tileAt(wx,wy);
    if(state.dungeon){
      const g=c.createLinearGradient(x,y,x,y+T); g.addColorStop(0,'#898b9a'); g.addColorStop(1,'#5f6170');
      rr(c,x,y,T,T,6,g);
      if(t==='dungeonwall'||t==='door'){
        rr(c,x,y,T,T,6,'#424655');
        for(let yy=0;yy<4;yy++)for(let xx=0;xx<3;xx++){let off=yy%2?7:0; rr(c,x+xx*16+off,y+yy*12,14,10,2,(xx+yy)%2?'#6e7283':'#595d6e');}
      }else{
        for(let k=0;k<7;k++) dot(c,x+(dHash(wx,wy,k)%42),y+(dHash(wx,wy,k+39)%40),1.6,'#9da0ad',.5);
      }
      return;
    }
    if(window.PokemonWorld56?.paintTile?.(c,x,y,t,pal,wx,wy))return;
    if(t==='tree'||t==='wall')tree(c,x,y,pal,wx,wy);
    else if(t==='rock')rock(c,x,y,pal,wx,wy);
    else if(t==='path'||t==='portal'||t==='loot'||t==='trainer'||t==='cave'||t==='legend'||t==='safari'||t==='rocketteam'||t==='treasure')pathway(c,x,y,pal,wx,wy);
    else if(t==='water')waterTile(c,x,y,pal,wx,wy);
    else if(['center','market','gym'].includes(t))building(c,x,y,t,pal,wx,wy);
    else grassBase(c,x,y,t,pal,wx,wy);
    if(['portal','cave','rocketteam','safari','legend','loot','treasure'].includes(t))specialTile(c,x,y,t,pal,wx,wy);
    window.PokemonWorld51?.paintTile?.(c,x,y,t,T,pal,wx,wy);
  }
  function bake(){
    const {w,h,x0,y0}=view,z=state.zone,ds=state.dungeon,changed =
      [window.PokemonProfiles?.activeSlot||0,z,x0,y0,w,h,state.v51Puzzles?.length||0,state.v51Caches?.length||0,ds?'cave:'+ds.zone+':'+ds.switches.join(','):'outside',state.found.length,state.trainerWins.length,state.caveSolved?.length||0].join('|');
    if(changed===lastKey)return;
    lastKey=changed;const pal=C();
    if (window.AuriSun25?.enabled?.()) {
      window.AuriSun25.render(backCtx,view,tileAt,pal);
    } else {
      for(let j=0;j<h;j++)for(let i=0;i<w;i++)staticTile(backCtx,i,j,x0+i,y0+j,pal);
      window.PokemonWorld56?.drawStructures?.(backCtx,view,T,pal);
    }
  }
  function character(c,cx,cy,gender='boy',dir='down',walkTime=0,enemy=false){ if(window.PokemonWorld56?.character?.(c,cx,cy,gender,dir,walkTime,enemy))return; }
  const arimonFollowerCache=new Map();
  function sprite(id){ return (window.ARIMON_SPRITES&&window.ARIMON_SPRITES[id]) || (window.PokeSprites&&window.PokeSprites[id]) || ''; }
  function creature(c,cx,cy,symbol,ts,shiny){
    const bob=Math.sin(ts*.004)*2; rr(c,cx-12,cy-11+bob,24,22,8,shiny?'#ebd77a':'#e7e9e2'); rr(c,cx-9,cy-8+bob,18,16,6,shiny?'#f6ecac':'#a7d5bb'); dot(c,cx-4,cy-2+bob,1.8,'#26334b'); dot(c,cx+5,cy-2+bob,1.8,'#26334b');
  }
  function drawAriFollower(c,cx,cy,id,ts,shiny){
    const direction=state.facing||'down';
    const face=direction==='up'?'back':'front';
    const cacheKey=id+':'+face;
    let image=arimonFollowerCache.get(cacheKey);
    if(!image){image=new Image();image.crossOrigin='anonymous';image.src=(face==='back'?window.ARIMON_BATTLE_BACK?.[id]:window.ARIMON_BATTLE_FRONT?.[id])||sprite(id);arimonFollowerCache.set(cacheKey,image)}
    if(!image.complete||image.naturalWidth===0){creature(c,cx,cy,'',ts,shiny);return}
    const bob=Math.sin(ts*.004)*2;
    c.save(); c.fillStyle='rgba(12,25,40,.18)'; c.beginPath(); c.ellipse(cx,cy+12,16,5.5,0,0,Math.PI*2); c.fill();
    if(direction==='left'){c.translate(cx,0);c.scale(-1,1);c.translate(-cx,0)}
    c.drawImage(image,cx-21,cy-30+bob,42,42);
    if(shiny){dot(c,cx+15,cy-26+bob,2.2,'#fff5bc',.95)}
    c.restore();
  }
  function animateForeground(c,ms){
    const z=state.zone,pal=C(),{w,h,x0,y0}=view;
    const npc=state.dungeon?[]:trainers(z);
    const npcMap=new Map(npc.map(n=>[n.x+':'+n.y,n]));
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){
      const wx=x0+i,wy=y0+j,t=tileAt(wx,wy),x=i*T,y=j*T;
      if(!state.dungeon&&(t==='wild'||t==='water')){
        if(t==='water'){
          for(let k=0;k<3;k++){ const s=(ms*.016+(dHash(wx,wy,k)%41))%48; c.strokeStyle=k%2?'rgba(255,255,255,.34)':'rgba(177,244,255,.33)'; c.lineWidth=2; c.beginPath(); c.moveTo(x+s-12,y+10+k*12); c.quadraticCurveTo(x+s-3,y+7+k*12,x+s+8,y+10+k*12); c.stroke(); }
        }else{
          for(let k=0;k<4;k++){ const ox=x+7+k*10, oy=y+31+(k%2)*5, sw=Math.sin(ms*.002+wx+k+wy)*2.5; c.strokeStyle=k%2?pal.shadow:pal.alt; c.lineWidth=2; c.beginPath(); c.moveTo(ox,oy); c.quadraticCurveTo(ox+sw,oy-6,ox+sw*.6,oy-14); c.stroke(); }
        }
      }
      if(t==='loot'||t==='treasure'){ const f=Math.sin(ms*.005+wx+wy)*2; dot(c,x+24,y+13+f,4,'#fff4bc',.95); rect(c,x+23,y+5+f,2,17,'#f7da69'); rect(c,x+16,y+12+f,16,2,'#f7da69'); }
      if(t==='trainer'){
        const marker=npcMap.get(wx+':'+wy);
        if(marker&&window.PokemonWorld56?.drawPerson)window.PokemonWorld56.drawPerson(c,x+24,y+32,marker,z,ms);
        else character(c,x+24,y+32,'boy','down',0,true);
        if(marker&&!marker.defeated){ rr(c,x+17,y+2,14,8,4,'#fff0b0'); dot(c,x+24,y+13,2,'#ffe17a',.9); }
      }
      if(state.dungeon&&t==='switch'){ const good=state.dungeon.switches.includes(wx+':'+wy); rr(c,x+12,y+25,24,10,4,good?'#74f0c2':'#b7a3e8'); rr(c,x+19,y+20,10,8,3,good?'#efffe9':'#f6d4b9'); }
      if(state.dungeon&&t==='door'){ rr(c,x+12,y+10,24,35,4,'#bb8a5d'); dot(c,x+31,y+28,2,'#f7e59a',.95); }
    }
    let hx=state.dungeon?state.dungeon.x:state.x,hy=state.dungeon?state.dungeon.y:state.y;
    const dir=state.facing||'down';const off={up:[0,1],down:[0,-1],left:[1,0],right:[-1,0]}[dir]||[0,1];
    const follower=state.party?.find(m=>m.uid===state.followerUid)||state.party?.[0];
    if(follower&&!state.dungeon){const fx=hx+off[0],fy=hy+off[1],tile=tileAt(fx,fy);
      if(fx>=x0&&fx<x0+w&&fy>=y0&&fy<y0+h&&!['rock','tree','wall','water'].includes(tile))drawAriFollower(c,(fx-x0)*T+24,(fy-y0)*T+30,follower.id,ms,follower.shiny);
    }
    let sx=(hx-x0)*T+24,sy=(hy-y0)*T+34;
    if(motion){const a=Math.min(1,(performance.now()-motion.started)/140); if(a<1){sx-=motion.dx*T*(1-a); sy-=motion.dy*T*(1-a)} else motion=null}
    if(sx>-15&&sx<w*T+15&&sy>-15&&sy<h*T+15){ if(state.bicycle&&!state.dungeon){ rr(c,sx-16,sy+8,12,9,5,'#3b4f73'); rr(c,sx+4,sy+8,12,9,5,'#3b4f73'); rect(c,sx-3,sy+4,8,2,'#f6d279'); } character(c,sx,sy,state.profileGender||'boy',dir,ms); }
  }
  function weatherLayer(c,ms){
    const {w,h}=view,W=w*T,H=h*T;
    if(v4Time().night){ rect(c,0,0,W,H,'rgba(12,28,59,.28)'); const cx=(state.dungeon?state.dungeon.x-view.x0:state.x-view.x0)*T+24; const cy=(state.dungeon?state.dungeon.y-view.y0:state.y-view.y0)*T+25; const glow=c.createRadialGradient(cx,cy,7,cx,cy,120); glow.addColorStop(0,'rgba(255,239,180,.18)'); glow.addColorStop(.55,'rgba(185,213,255,.11)'); glow.addColorStop(1,'rgba(44,68,97,0)'); c.fillStyle=glow; c.fillRect(cx-120,cy-120,240,240); }
    const weather=v4Weather(); if(weather==='Gewitter'){rect(c,0,0,W,H,'rgba(25,41,74,.16)'); if(Math.sin(ms*.0015)>0.995)rect(c,0,0,W,H,'rgba(237,244,255,.46)')}
    if(!state.dungeon&&['Regen','Gewitter','Schnee'].includes(weather)){
      for(let i=0;i<Math.min(75,w*h);i++){
        let x=((i*67+ms*(weather==='Schnee'?.025:.15))%(W+80))-25; let y=((i*103+ms*(weather==='Schnee'?.038:.23))%(H+40))-15;
        if(weather==='Schnee'){dot(c,x,y,1.8,'rgba(245,252,255,.86)');}
        else{ c.strokeStyle='rgba(204,241,255,.62)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(x,y); c.lineTo(x+2,y+8); c.stroke(); }
      }
    }
    if(state.dungeon){ rect(c,0,0,W,H,'rgba(7,16,35,.35)'); for(let i=0;i<3;i++){ let xx=(i*162+32)%W,yy=(i*143+23)%H; const rad=c.createRadialGradient(xx,yy,0,xx,yy,46); rad.addColorStop(0,'rgba(255,202,106,.16)'); rad.addColorStop(1,'rgba(255,202,106,0)'); c.fillStyle=rad; c.fillRect(xx-46,yy-46,92,92); }}
  }
  function frame(ms){
    if(map.classList.contains('aur50-active')){requestAnimationFrame(frame);return} // World50 draws its own unified terrain and collision layout.
    if(document.hidden||!state?.starterChosen||currentPage!=='world'||!map.isConnected||!enabled){requestAnimationFrame(frame);return}
    const activeProfile=!!window.PokemonProfiles?.activeSlot; if(!activeProfile){requestAnimationFrame(frame);return}
    if(ms-lastFrame<32){requestAnimationFrame(frame);return} lastFrame=ms;
    try{
      if(!canvas?.parentElement||canvas.width!==view.w*T){setCanvas()}
      bake(); ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(ground,0,0);
      animateForeground(ctx,ms); window.PokemonBattle52?.drawRival?.(ctx,view,T,ms); weatherLayer(ctx,ms); window.PokemonWorld56?.lighting?.(ctx,view,T,ms); frames++;
    }catch(err){ console.warn('[AuriMon XY] Renderer pausiert:',err); enabled=false; map.classList.remove('hd-render'); }
    requestAnimationFrame(frame);
  }
  const baseRenderMap=renderMap;
  renderMap=function(){baseRenderMap(); if(!state.starterChosen)return; setCanvas(); bake()};
  const baseWalk=walk;
  walk=function(dx,dy){const x=state.x,y=state.y,z=state.zone,dxn=state.dungeon?.x,dyn=state.dungeon?.y; baseWalk(dx,dy); const nx=state.dungeon?state.dungeon.x:state.x,ny=state.dungeon?state.dungeon.y:state.y; const ox=dxn??x,oy=dyn??y; if(z===state.zone&&Math.abs(nx-ox)<=2&&Math.abs(ny-oy)<=2&&(nx!==ox||ny!==oy))motion={dx:nx-ox,dy:ny-oy,started:performance.now()}; };
  window.PokemonGame.walk=(dx,dy)=>walk(dx,dy);
  document.addEventListener('click',e=>{ const btn=e.target.closest('button[data-battle]'); if(!btn||btn.disabled)return; const action=btn.dataset.battle||''; if(!/^move:|^attack:/.test(action))return; const scene=document.getElementById('battle-content'); if(!scene)return; const current=chooseAlive(),index=Number(action.split(':')[1]); const move=Number.isInteger(index)?current?.moves?.[index]:null; const type=move?.type||'Normal'; const fx={Feuer:'#ff7d43',Wasser:'#4fc9ff',Elektro:'#f4d76a',Pflanze:'#78ed92',Psycho:'#f485e3',Eis:'#a2f0ff',Gift:'#cb7eff',Geist:'#a7a3ff',Boden:'#d2a56c'}; scene.style.setProperty('--v5-move-color',fx[type]||'#ffe4a4'); scene.classList.remove('v5-strike'); void scene.offsetWidth; scene.classList.add('v5-strike'); setTimeout(()=>scene.classList.remove('v5-strike'),650); },true);
  const oldRenderBattle=renderBattle; renderBattle=function(){ oldRenderBattle(); const scene=document.getElementById('battle-content'); if(scene)scene.classList.add('v5-battle'); };
  window.PokemonGame.hd={version:'0.5.0',engine:'Canvas2D',ready:()=>!!canvas&&enabled,frames:()=>frames,profileDataUntouched:true,mapMetrics:()=>({w:view.w,h:view.h,tile:T}),forceRedraw:()=>{lastKey='';renderMap()}};
  document.addEventListener('visibilitychange',()=>{lastKey='';});
  window.addEventListener('resize',()=>{lastKey=''; if(state?.starterChosen)renderMap()},{passive:true});
  requestAnimationFrame(frame);
})();
