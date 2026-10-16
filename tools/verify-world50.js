/* AuriMon 50-stage CI regression check. No credentials, no player data. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('app/src/main/assets/aurimon_world50_pilot.js','utf8');
const st={starterChosen:true,zone:0,x:9,y:9,facing:'down',found:[],badges:[],trainerWins:[],coins:0,steps:0,
 aurWorld50:{stage:0,runestones:[],completed:[]}};
const ctx={
 window:{PokemonGame:{},PokemonProfiles:{activeSlot:1},addEventListener(){}},
 document:{createElement:()=>({setAttribute(){},getContext:()=>({scale(){}})}),addEventListener(){}},
 state:st,requestAnimationFrame(){},
};
for(const n of ['renderMap','walk','interact','trainerParty','randomWild','gymParty','enterZone','battleDefeat','atPosition','trainers','drops','render','doAction'])
 ctx[n]=()=>{};
vm.runInNewContext(code,vm.createContext(ctx),{filename:'aurimon_world50_pilot.js',timeout:2000});
const api=ctx.window.PokemonGame.world50;
assert(api,'World50 API was not registered');
assert.equal(api.getCount(),50);
assert.equal(api.names.length,50);
assert.equal(api.names[49],'Kronenarena');
const reports=api.validate();
assert.equal(reports.length,50);
for(const r of reports)assert(r.reachable,'Stage '+r.stage+': missing accessible targets');
for(let i=0;i<50;i++){
 const m=api.getMap(i);
 assert.equal(m.length,12);for(const row of m)assert.equal(row.length,20);
 assert.equal(m[6][19],'E','Missing east exit on stage '+(i+1));
 if(i%5===3){
  assert.equal(m.flat().filter(t=>t==='R').length,3,'Missing runes at stage '+(i+1));
  assert.equal(m[6][17],'G','Dungeon gate missing at '+(i+1));
 }
 if(i%5===0)assert.equal(api.getRegion(i),[
 'Sonnenwiese','Mondsee','Felsenwald','Blumenpfad','Windküste','Bernsteinwald',
 'Flüsterdorf','Kristallsee','Vulkanpass','Wolkenhöhe'][i/5]);
}
const identities=new Map();
for(let stage=0;stage<50;stage++){
 const grid=api.getMap(stage),events=api.getFeatures(stage),key=grid.map(row=>row.join('')).join('/');
 assert(!identities.has(key),'Duplicate terrain layout: levels '+(identities.get(key)+1)+' and '+(stage+1));
 identities.set(key,stage);
 // Distinct interactables are essential: two people on one tile cannot both be spoken to.
 const occupied=new Map();
 for(const n of [...events.npcs.map(q=>({...q,kind:'NPC: '+q.kind})),...events.runes.map(q=>({...q,kind:'Rune'}))]){
  const k=n.x+','+n.y;
  assert(!occupied.has(k),'Stage '+(stage+1)+': '+n.kind+' covers '+occupied.get(k)+' at '+k);
  occupied.set(k,n.kind);
 }
 for(const b of events.buildings){
  const k=b.step.join(',');
  assert(!occupied.has(k),'Stage '+(stage+1)+': '+occupied.get(k)+' blocks '+b.kind+' entrance at '+k);
 }
 const blocked=new Set(events.npcs.map(n=>n.x+','+n.y));
 const queue=[stage===0?[9,9]:[1,6]],seen=new Set();
 while(queue.length){
  const [x,y]=queue.pop(),k=x+','+y;
  if(x<0||x>=20||y<0||y>=12||seen.has(k)||blocked.has(k)||'t#ba~'.includes(grid[y][x]))continue;
  seen.add(k);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);
 }
 if(stage%5!==3)assert(seen.has('19,6'),'NPC blocks exit on stage '+(stage+1));
 const adjacent=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((x+dx)+','+(y+dy)));
 for(const npc of events.npcs)assert(adjacent(npc.x,npc.y),'NPC unreachable on level '+(stage+1)+': '+npc.name);
 if(stage%5===0){
  for(const kind of ['side','runeA','runeB','cache'])
   assert(events.npcs.some(n=>n.kind===kind),'Missing '+kind+' on region '+(Math.floor(stage/5)+1));
 }
 if(stage%5===2&&[2,3,4,5,6,8,9].includes(Math.floor(stage/5)))
  assert(events.npcs.some(n=>n.kind==='cave'),'Missing cave in stage '+(stage+1));
}
console.log('[PASS] 50 maps / 10 dungeons / 10 regions / all quest NPCs reachable; 50 unique maps.');
