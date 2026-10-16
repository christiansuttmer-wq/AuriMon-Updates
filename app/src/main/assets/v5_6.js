/* AuriMon 5.6.0: echte Kollisionen + HD-Pixelwelt.
 * Bestehende Spielstände, AuriMon-IDs und Speicherschlüssel bleiben unverändert.
 * Gebäude = 3x2 feste Felder; Eingang nur mittig von SÜDEN.
 */
'use strict';
(() => {
 const T=48;
 // Origin is the upper left corner of the two-row building footprint.
 const BUILDINGS=[
  {id:'center',x:1,y:1,w:3,h:2,label:'AuriCenter'},
  {id:'market',x:1,y:6,w:3,h:2,label:'AuriMarkt'},
  {id:'gym',x:10,y:1,w:3,h:2,label:'Prüfhalle'},
  {id:'house',x:5,y:1,w:3,h:2,label:'Gasthaus'},
  {id:'atelier',x:9,y:6,w:3,h:2,label:'Werkstatt'}
 ];
 const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 const npcLook=new Map();let residentLook='down';
 function buildingAt(x,y){return BUILDINGS.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)||null}
 function isDoor(b,x,y){return x===b.x+1&&y===b.y+b.h-1}
 function npcAt(z,x,y){return trainers(z).find(n=>n.x===x&&n.y===y)||null}
 function rivalAt(z,x,y){return [0,4,8,12,16,19].includes(z)&&x===8&&y===6}
 function npcDirection(n,z){return npcLook.get(z+':'+n.id)||'down'}
 function faceNpc(n,px,py,z){npcLook.set(z+':'+n.id,px<n.x?'left':px>n.x?'right':py<n.y?'up':'down');window.PokemonGame.hd?.forceRedraw?.()}
 function occupied(x,y){if(x<1||x>=V41_W-1||y<1||y>=V41_H-1)return true;
  if(buildingAt(x,y)||npcAt(state.zone,x,y)||rivalAt(state.zone,x,y))return true;
  return ['wall','tree','rock','water'].includes(getGround(state.zone,x,y));}
 function repairOldPosition(){if(!state?.starterChosen||state.dungeon||state.v51Indoor)return false;
  if(!buildingAt(state.x,state.y)&&!npcAt(state.zone,state.x,state.y)&&!rivalAt(state.zone,state.x,state.y))return false;
  const sx=state.x,sy=state.y;const q=[[sx,sy]],seen=new Set([sx+','+sy]);
  while(q.length){const [x,y]=q.shift();if(!occupied(x,y)){state.x=x;state.y=y;save();return true}
   for(const [dx,dy] of Object.values(dirs)){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(nx<1||ny<1||nx>=V41_W-1||ny>=V41_H-1||seen.has(k))continue;seen.add(k);q.push([nx,ny]);}}
  state.x=7;state.y=5;save();return true;
 }
 const priorAt=atPosition;
 atPosition=function(z,x,y){if(state.dungeon)return priorAt(z,x,y);
  if(z===state.zone){const b=buildingAt(x,y);if(b)return isDoor(b,x,y)?'v56-door-'+b.id:'v56-solid-'+b.id;
    if(BUILDINGS.some(b=>x===b.x+1&&y===b.y+b.h))return 'path';}
  return priorAt(z,x,y);
 };
 function enterBuilding(b){
  if(b.id==='house'||b.id==='atelier'){window.PokemonGame.world51?.open?.(b.id);return}
  if(b.id==='center'){healCenter();return}
  if(b.id==='market'){showShop();return}
  if(b.id==='gym'){enterGym();return}
 }
 const priorWalk=walk;
 function v56Step(dx,dy){
  if(!state?.starterChosen||modalOpen||battle||currentPage!=='world')return priorWalk(dx,dy);
  if(state.v51Indoor){const o=state.v51Indoor,nx=o.x+dx,ny=o.y+dy;
   if(nx===4&&ny===2){state.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';return toast('💬 Drücke A, um mit der Person zu sprechen.');}
   return priorWalk(dx,dy);
  }
  if(state.dungeon)return priorWalk(dx,dy);
  repairOldPosition();
  const nx=state.x+dx,ny=state.y+dy;
  const face=dx>0?'right':dx<0?'left':dy>0?'down':'up';
  const b=buildingAt(nx,ny);
  if(b){state.facing=face;
   if(isDoor(b,nx,ny)&&dx===0&&dy===-1&&state.x===nx&&state.y===ny+1)return enterBuilding(b);
   toast(isDoor(b,nx,ny)?'🚪 Der Eingang liegt an der Vorderseite.':'🏠 Hier steht eine feste Hauswand.');return;
  }
  const person=npcAt(state.zone,nx,ny);
  if(person){state.facing=face;return toast('💬 Drücke A, um '+person.name+' anzusprechen.');}
  if(rivalAt(state.zone,nx,ny)){state.facing=face;return toast('⚡ Drücke A, um mit Alex zu sprechen.');}
  return priorWalk(dx,dy);
 };
 walk=function(dx,dy){
  // Bicycle cannot skip a solid tile between its two movement increments.
  const bike=!!(state?.bicycle&&!state?.safariActive&&!state?.v51Indoor&&!state?.dungeon);
  if(!bike)return v56Step(dx,dy);
  state.bicycle=false;
  try{for(let i=0;i<2;i++){
    const beforeX=state.x,beforeY=state.y,beforeZ=state.zone;
    v56Step(dx,dy);
    if(modalOpen||battle||state.v51Indoor||state.dungeon||state.zone!==beforeZ||state.x===beforeX&&state.y===beforeY)break;
  }}finally{state.bicycle=true;save();render();}
 };
 const priorInteract=interact;
 interact=function(){
  if(modalOpen||battle)return priorInteract();
  if(state.v51Indoor){const o=state.v51Indoor;
   if(Math.abs(o.x-4)+Math.abs(o.y-2)===1){residentLook=o.x<4?'left':o.x>4?'right':o.y<2?'up':'down';state.v56IndoorFacing=residentLook;renderMap();}
   return priorInteract();
  }
  if(state.dungeon)return priorInteract();
  repairOldPosition();
  const face=dirs[state.facing]||dirs.up;
  const near=[[state.x+face[0],state.y+face[1]],...Object.values(dirs).map(d=>[state.x+d[0],state.y+d[1]])];
  const checked=new Set();
  for(const [x,y] of near){const k=x+':'+y;if(checked.has(k))continue;checked.add(k);
   if(Math.abs(state.x-x)+Math.abs(state.y-y)!==1)continue;
   const n=npcAt(state.zone,x,y);if(n){faceNpc(n,state.x,state.y,state.zone);return interactTrainer(n)}
   if(rivalAt(state.zone,x,y)){
    state.facing=state.x<x?'right':state.x>x?'left':state.y<y?'down':'up';
    return priorInteract();
   }
   const b=buildingAt(x,y);if(b&&isDoor(b,x,y)&&state.x===x&&state.y===y+1){state.facing='up';return enterBuilding(b)}
  }
  return priorInteract();
 };
 // After an older save is loaded, move the trainer away from newly solid tiles only if needed.
 const prevRender=renderMap;
 renderMap=function(){if(state?.starterChosen&&!state.v51Indoor&&!state.dungeon)repairOldPosition();return prevRender()};
 // Painting helpers: crisp 1-4 px pixel details, no emoji stand-ins for buildings.
 const R=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const hashPix=(z,x,y,k=0)=>{let a=Math.imul(z+23,374761393)^Math.imul(x+101,668265263)^Math.imul(y+73,1274126177)^Math.imul(k+1,173);a^=a>>>13;return a>>>0};
 const palette=['#e2d470','#8cbde2','#9baf85','#efa7c4','#9de2ce','#eec48b','#daaa76','#c2e2ff','#f28a53','#d3e6ef','#f9dc6b','#77b6a1','#c7bb99','#dff6ff','#ca9adb','#a1d9ef','#b8a6dc','#b8e3a3','#c6b4eb','#ffe09d'];
 function tileArt(c,x,y,t,pal,wx,wy){
  const zone=state.zone,accent=palette[zone%20],h=hashPix(zone,wx,wy);
  const ground=['wild','grass','tree','rock','path','water'].includes(t)||t.startsWith('v56-')||['center','market','gym'].includes(t);
  if(!ground)return false;
  const path=['path','v56-door','center','market','gym'].includes(t)||t.startsWith('v56-');
  if(t==='water'){
   R(c,x,y,48,48,pal.water);R(c,x,y,48,6,'#8bdef0');
   for(let k=0;k<4;k++){const yy=y+10+10*k,xx=x+((h>>k)%26);R(c,xx,yy,22,3,k%2?'#2177b1':'#a5e8f2');R(c,xx+5,yy+3,12,2,'#58b5d9');}return true;
  }
  R(c,x,y,48,48,path?pal.path:pal.grass);
  if(path){
   R(c,x,y,48,5,'#f3dcab');R(c,x,y+43,48,5,'#bd9e74');
   for(let k=0;k<9;k++){let xx=x+3+(hashPix(zone,wx,wy,k)%41),yy=y+7+(hashPix(zone,wy,wx,k+19)%33);R(c,xx,yy,5,2,k%2?'#bda47d':'#f4dfb8');}
   // Jagged pixel borders connect roads organically to their neighbouring meadows.
   const road=t=>t==='path'||t==='portal'||String(t).startsWith('v56-')||['gym','center','market'].includes(t);
   if(!road(atPosition(zone,wx,wy-1)))for(let k=0;k<12;k++)R(c,x+k*4,y,4,2+hashPix(zone,wx,wy,k)%5,k%3?pal.grass:pal.alt);
   if(!road(atPosition(zone,wx,wy+1)))for(let k=0;k<12;k++)R(c,x+k*4,y+42+hashPix(zone,wx,wy,k+15)%4,4,6,k%3?pal.grass:pal.shadow);
   if(!road(atPosition(zone,wx-1,wy)))for(let k=0;k<12;k++)R(c,x,y+k*4,3+hashPix(zone,wx,wy,k+33)%4,4,pal.grass);
   if(!road(atPosition(zone,wx+1,wy)))for(let k=0;k<12;k++)R(c,x+42+hashPix(zone,wx,wy,k+49)%3,y+k*4,6,4,pal.alt);
  }else{
   R(c,x,y,48,5,pal.alt);R(c,x,y+44,48,4,pal.shadow);
   for(let k=0;k<16;k++){let xx=x+3+hashPix(zone,wx,wy,k)%40,yy=y+6+hashPix(zone,wy,wx,k+16)%37;R(c,xx,yy,3,2,k%3===0?pal.shadow:pal.alt);}
   if(t==='grass'||t==='wild'){
    for(let k=0;k<(t==='wild'?7:3);k++){const xx=x+4+(k*7)%39,yy=y+25+((h>>k)%17);
     R(c,xx,yy-10,3,12,pal.shadow);R(c,xx+3,yy-8,4,4,pal.alt);}
    if((h%5)===0){R(c,x+25,y+24,3,10,'#2c814e');R(c,x+19,y+19,14,6,accent);R(c,x+24,y+16,5,13,accent);R(c,x+25,y+22,3,3,'#fff9d8');}
   }
  }
  if(t==='tree'){
   R(c,x+11,y+36,30,7,'#234a38');R(c,x+20,y+24,10,21,'#644636');R(c,x+23,y+26,4,17,'#997557');
   for(const [ox,oy,s,cl] of [[3,20,34,pal.tree],[10,8,34,pal.edge],[5,13,35,pal.leaf],[13,2,26,pal.alt]]){
    R(c,x+ox,y+oy,s,17,cl);R(c,x+ox+4,y+oy-4,s-8,7,cl);}
   R(c,x+17,y+8,13,4,'#d3e999');R(c,x+11,y+17,7,4,pal.alt);R(c,x+29,y+23,6,5,pal.tree);
  } else if(t==='rock'){
   R(c,x+5,y+31,40,12,'#59616d');R(c,x+9,y+18,34,22,pal.rock);R(c,x+16,y+11,26,21,'#c2c9d0');
   R(c,x+10,y+20,9,13,'#dce1de');R(c,x+31,y+27,8,8,'#626f81');R(c,x+21,y+12,14,3,'#eef4ec');
   if([7,13,18].includes(zone)){R(c,x+26,y+3,7,30,accent);R(c,x+24,y+7,12,8,'#f8ffff');}
  } else if(!path&&h%9===0){R(c,x+28,y+26,5,6,'#385e43');R(c,x+23,y+21,14,7,accent);R(c,x+29,y+19,4,9,'#fff4df');}
  return true;
 }
 function structure(c,x,y,b,pal,ms=0){
   // Multi-tile structure extends 144×96 px; shadows, brick walls, layered roof,
   // side-facing windows, and a single front-door in its bottom middle cell.
   const zone=state.zone,pick=palette[zone%20],w=144,h=96;
   const main=b.id==='center'?'#f4e9dc':b.id==='market'?'#f6d7a4':b.id==='gym'?'#d6d8d8':b.id==='atelier'?'#e4c4a3':'#f6e2b7';
   const roof=b.id==='center'?'#d44d60':b.id==='market'?'#3595b4':b.id==='gym'?'#6755a2':b.id==='atelier'?'#84667b':'#ba6d42';
   const trim=b.id==='center'?'#ffebed':b.id==='gym'?'#e4d2ff':b.id==='market'?'#dbf9fc':'#ffe4ae';
   R(c,x+11,y+83,129,12,'#1c293477');R(c,x+5,y+31,135,60,'#644d45');
   R(c,x+9,y+35,127,48,main);R(c,x+9,y+76,127,7,'#b09275');
   for(let k=0;k<10;k++){let xx=x+13+k*12;R(c,xx,y+51,7,2,'#bca78e');R(c,xx+5,y+66,7,2,'#e9bda0');}
   R(c,x+3,y+32,138,13,'#292f48');R(c,x+7,y+25,130,13,roof);
   R(c,x+12,y+15,119,17,roof);R(c,x+22,y+6,99,14,roof);R(c,x+37,y+1,70,9,roof);
   R(c,x+13,y+17,118,4,trim);R(c,x+9,y+30,128,4,'#342c43');
   for(let i=0;i<12;i++){let xx=x+16+i*10;R(c,xx,y+22,7,2,i%2===0?'#fff9d166':'#48384e');}
   // Four offset shingle rows, a ridge light and individual worn roof tiles.
   for(let row=0;row<3;row++)for(let k=0;k<13;k++){const sx=x+13+k*9+(row%2?4:0),sy=y+17+row*5;if(sx>x+129)continue;R(c,sx,sy,7,2,k%3?'#ffffff28':'#18213d33');}
   R(c,x+38,y+3,67,2,'#fff5ca88');R(c,x+17,y+35,117,3,'#1f2b43');
   // Optional emblem gives every service building a recognizable silhouette.
   if(b.id==='center'){R(c,x+67,y+11,11,14,'#fffae9');R(c,x+61,y+16,23,5,'#fffae9');}
   if(b.id==='gym'){R(c,x+64,y+11,15,15,'#ffcf79');R(c,x+68,y+9,7,18,'#ffe9b4');}
   if(b.id==='atelier'){R(c,x+67,y+10,8,19,'#fee5a4');R(c,x+62,y+16,18,5,'#fee5a4');}
   if(b.id==='market'){R(c,x+56,y+10,35,12,'#fff0ce');R(c,x+61,y+13,25,5,'#438196');}
   if(b.id==='house'){R(c,x+61,y+10,24,10,'#fff1ae');R(c,x+67,y+13,12,3,'#ce794f');}
   // Broad windows with distinct glass reflections.
   for(let i of [22,107]){R(c,x+i-3,y+51,22,26,'#5d5155');R(c,x+i,y+53,16,21,'#70bad5');R(c,x+i+3,y+54,5,18,'#b8ecf0');R(c,x+i,y+64,16,3,'#e0e8cf');R(c,x+i+9,y+53,3,21,'#3f6787');}
   // Entry: visually centered on FRONT wall, not at the back or side.
   R(c,x+60,y+47,25,39,'#3c3442');R(c,x+63,y+50,19,34,'#6d5251');R(c,x+65,y+54,15,29,'#463645');R(c,x+76,y+68,3,3,'#ffdc7b');
   R(c,x+57,y+83,32,4,'#ead4b1');R(c,x+54,y+88,37,5,'#b9ac89');
   R(c,x+9,y+43,127,4,'#ffffff33');
   R(c,x+11,y+35,8,42,'#0000001b');
   // Regional detail at roof corners.
   R(c,x+116,y+15,9,5,pick);R(c,x+19,y+14,8,4,pick);
 }
 function paintStructures(c,view,T,pal){if(state.dungeon||state.v51Indoor)return;
   const ox=view.x0,oy=view.y0;
   for(const b of BUILDINGS)structure(c,(b.x-ox)*T,(b.y-oy)*T,b,pal);
 }
 function betterCharacter(c,cx,cy,gender,dir,walkTime,enemy){
   let x=Math.round(cx),y=Math.round(cy);const walking=Math.sin(walkTime*.012);const step=walkTime&&state.steps?Math.round(walking*2):0;
   const color=enemy?'#ab415b':state.v55Outfit?.coat||(gender==='girl'?'#e05b9b':'#377fc5');
   const light=enemy?'#ffbea7':state.v55Outfit?.light||'#bce0ff';
   const hair=enemy?'#433347':state.v55Outfit?.hair||'#604357';
   R(c,x-12,y+11,25,6,'#1d354b77');
   R(c,x-8,y+1,7,15+step,'#333c60');R(c,x+2,y+1,7,15-step,'#333c60');
   R(c,x-9,y+13+step,9,4,'#222839');R(c,x+2,y+13-step,9,4,'#222839');
   R(c,x-10,y-12,21,18,color);R(c,x-10,y-12,4,17,'#20375066');R(c,x+6,y-12,5,18,light);
   R(c,x-13,y-10,4,15,'#f3c5a2');R(c,x+10,y-10,4,15,'#f3c5a2');
   R(c,x-8,y-29,17,18,'#ecc5a5');R(c,x-9,y-31,19,8,hair);
   if(gender==='girl'){R(c,x-11,y-28,5,23,hair);R(c,x+8,y-28,5,21,hair);R(c,x-7,y-33,15,5,'#efe0a2');}
   else{R(c,x-11,y-31,20,5,hair);R(c,x-7,y-35,13,5,hair);R(c,x+8,y-27,4,6,light)}
   if(dir==='down'){R(c,x-5,y-21,3,3,'#343347');R(c,x+4,y-21,3,3,'#343347');}
   if(dir==='left'){R(c,x-7,y-21,4,3,'#343347');R(c,x+7,y-20,3,3,'#c68e73')}
   if(dir==='right'){R(c,x+5,y-21,4,3,'#343347');R(c,x-8,y-20,3,3,'#c68e73')}
   if(dir==='up'){R(c,x-8,y-27,17,10,hair);R(c,x-4,y-14,9,3,light)}
   return true;
 }
 function drawPerson(c,x,y,n,z,ms){betterCharacter(c,x,y,'boy',npcDirection(n,z),0,true);}
 function lighting(c,view,T,ms){if(state.dungeon||state.v51Indoor)return;
   // Warm window glow at night, softly animated. Do not affect collision pixels.
   if(v4Time().night){for(const b of BUILDINGS){const x=(b.x-view.x0)*T+72,y=(b.y-view.y0)*T+55;
    const g=c.createRadialGradient(x,y,8,x,y,65);g.addColorStop(0,'#ffe8a43d');g.addColorStop(1,'#ffe8a400');c.fillStyle=g;c.fillRect(x-65,y-65,130,130);}}
   if(state.zone%4===3){const x=(Math.sin(ms*.0004)*.5+.5)*view.w*T,y=20;c.fillStyle='#fff8ce0e';c.fillRect(x,0,3,view.h*T)}
 }
 // Touch/camera-facing UI feedback.
 const style=document.createElement('style');style.textContent='.map.hd-render{box-shadow:inset 0 0 0 3px #233e51}.maptop b::after{content:" · HD-Pixel 5.6";color:#ffe2a4;font-size:.76em}.tablet-help{line-height:1.4}';document.head.appendChild(style);
 const guide=showGuide;
 showGuide=function(){guide();document.getElementById('modal-content')?.insertAdjacentHTML('beforeend','<p>🏠 <b>Gebäude:</b> Nur durch die Vordertür auf der Südseite hineingehen (von unten nach oben laufen oder A drücken). Wände und Dächer sind nicht begehbar.</p><p>🧍 <b>Personen:</b> Sie versperren den Weg. Stelle dich an eine der vier Seiten und drücke A, um sie anzusprechen. Sie schauen dich dabei an.</p>')};
 window.PokemonWorld56={buildings:BUILDINGS,buildingAt,isDoor,npcAt,npcFacing:npcDirection,repairOldPosition,paintTile:tileArt,drawStructures:paintStructures,character:betterCharacter,drawPerson,lighting,version:'5.6.0'};
 // Existing on-screen controls sometimes keep a reference to PokemonGame.walk.
 if(window.PokemonGame)window.PokemonGame.walk=(dx,dy)=>walk(dx,dy);
 if(state?.starterChosen)repairOldPosition();
})();
