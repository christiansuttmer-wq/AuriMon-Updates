/* AuriMon 1.4.30: quests, rewards, narrative and progression regressions.
 * Runs without personal saves or Android SDK; tests real source logic in Node VM.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT='app/src/main/assets/';
const read=n=>fs.readFileSync(ROOT+n,'utf8');
const zones=['Sonnenwiese','Mondsee','Felsenwald','Blumenpfad','Windküste','Bernsteinwald','Flüsterdorf','Kristallsee','Vulkanpass','Wolkenhöhe'];
const leaders=["Lina","Finn","Rika","Elly","Noah","Mia","Leon","Ada","Bruno","Champion Nova"];
const badges=["Wiesenorden","Seeorden","Felsorden","Blütenorden","Küstenorden","Waldorden","Dorforden","Kristallorden","Flammenorden","Wolkenorden"];
const areas=zones.map((name,i)=>({name,leader:leaders[i],badge:badges[i]}));
const state={starterChosen:true,zone:0,x:9,y:9,facing:'down',found:[],badges:[],trainerWins:[],coins:0,steps:0,aurWorld50:{stage:0,runestones:[],completed:[]}};
const ctx={AREAS:areas,state,window:{PokemonGame:{},PokemonProfiles:{activeSlot:1},addEventListener(){}},document:{createElement(){return {setAttribute(){},getContext(){return {scale(){}}}}},addEventListener(){}},requestAnimationFrame(){}};
for(const n of ['renderMap','walk','interact','trainerParty','randomWild','gymParty','enterZone','battleDefeat','atPosition','trainers','drops','render','doAction'])ctx[n]=()=>{};
vm.runInNewContext(read('aurimon_world50_pilot.js'),vm.createContext(ctx),{timeout:3000});
const api=ctx.window.PokemonGame.world50,descs=api.getDescriptions();
assert.equal(api.getCount(),50);assert.equal(descs.length,50);
let questObjects=0;
for(let stage=0;stage<50;stage++){
 const k=stage%5,z=Math.floor(stage/5),q=api.getFeatures(stage),desc=descs[stage];
 assert(desc&&desc.length>25,'Missing objective '+(stage+1));
 assert(!/Finde eine Windmühle|zerbrochenes Siegel|gestohlene Akte/.test(desc),'Unimplemented objective '+(stage+1));
 if(k===0){
   for(const role of ['side','runeA','runeB','cache'])assert(q.npcs.some(n=>n.kind===role),'Missing '+role+' region '+(z+1));
   questObjects+=4;
 }
 if(k===3){
   assert.equal(q.runes.length,3,'Missing 3 runes in '+(stage+1));
   assert.equal(new Set(q.runes.map(r=>r.id)).size,3);
   assert.equal(q.runeOrder.length,3);
   assert(q.runeOrder.every(id=>q.runes.some(r=>r.id===id)));
   assert(desc.includes('drei Runen'), 'Rune objective missing '+stage);
   if(stage===3)assert(desc.includes('beliebiger Reihenfolge'),'Original rune rules must match');
   else {
     const sorted=q.runes.slice().sort((a,b)=>a.x-b.x);
     const loc=q.runeOrder.map(id=>['West','Mitte','Ost'][sorted.findIndex(r=>r.id===id)]);
     assert(desc.includes(loc.join(' → ')),'Rune order mismatch stage '+(stage+1));
   }
   questObjects+=3;
 }
 if(k===4){
   assert(q.buildings.some(b=>b.kind==='gym'),'Missing arena '+(stage+1));
   assert(desc.includes(leaders[z])&&desc.includes(badges[z]),'Arena text mismatch '+(stage+1));
   questObjects++;
 }
 if(k===1||k===2)assert(desc.includes('Ostausgang'),'Stage exit explanation '+(stage+1));
}
const chapterCode=read('auri_1_3_12_story_shop.js');
const chapterMatch=chapterCode.match(/const chapters = (\[[\s\S]*?\n\]);/);
assert(chapterMatch,'Story chapter array missing');
const chapters=vm.runInNewContext(chapterMatch[1]);
assert.equal(chapters.length,10);
for(let i=0;i<10;i++){
 assert.equal(chapters[i].length,4);
 assert.equal(chapters[i][1],zones[i],'Wrong chapter region '+i);
 assert(chapters[i][2].length>50&&chapters[i][3].length>15);
 assert(!/Rivale Finn|Finn ist.*Rivale|NACHTFALL|falsches Bündnis/i.test(chapters[i][2]+' '+chapters[i][3]));
}
assert(chapters[0][2].includes('Lina')&&chapters[9][2].includes('Champion Nova'));
const storyState={badges:[],starterChosen:true};
const storage=new Map(),storyCtx={
 state:storyState,window:{PokemonProfiles:{current(){return 1}}},
 localStorage:{getItem(k){return storage.has(k)?storage.get(k):null},setItem(k,v){storage.set(k,v)}},
 document:{querySelector(){return null},getElementById(){return null},addEventListener(){}},
 modalOpen:false
};
const storyTestCode=chapterCode.replace(/\}\)\(\);\s*$/, ' window.__questAuditStory={accessible,mark,completed,chapters};\n})();');
assert.notEqual(storyTestCode,chapterCode,'Story injection hook not applied');
vm.runInNewContext(storyTestCode,vm.createContext(storyCtx),{timeout:2000});
const journal=storyCtx.window.__questAuditStory;
assert(journal,'Story journal not exposed to test harness');
for(let medals=0;medals<=10;medals++){
 storyState.badges=Array.from({length:medals},(_,i)=>i);
 for(let i=0;i<10;i++){
  const allowed=i===9?medals===10:i<=medals;
  assert.equal(journal.accessible(i),allowed,'Story chapter unlock '+(i+1)+' badges='+medals);
 }
}
storyState.badges=[];journal.mark(0);journal.mark(0);
assert.equal(journal.completed().length,1,'Story saves duplicate or fails');
storyCtx.window.PokemonProfiles.current=()=>2;
assert.equal(journal.completed().length,0,'Story data leaking between slots');
// Side quests: execute the actual four task and reward functions under a controlled state.
const sideSource=read('v5_3.js');
const sideArray=sideSource.match(/const SIDESTORIES=(\[[\s\S]*?\]);/);
assert(sideArray,'Side quest titles not found');
const sideTitles=vm.runInNewContext(sideArray[1]);
assert.equal(sideTitles.length,10);
const start=sideSource.indexOf(' function sideTask(z)'),end=sideSource.indexOf(' function ruinPattern(z)',start);
assert(start>=0&&end>start,'Missing side quest logic');
const st={zone:0,steps:0,battleWins:0,coins:0,v53SideDone:[],v53SideActive:{},v51Puzzles:[],v51Caches:[],bag:{}};
let saves=0,dialogues=0,draws=0;
const sctx={state:st,SIDESTORIES:sideTitles,AREAS:areas,ITEM_INFO:{candy:['EP-Bonbon'],greatball:['Superball'],superpotion:['Supertrank']},
 ready:()=>true,checkData(){},esc:x=>String(x),modal(){dialogues++},save(){saves++},render(){draws++},
 gainItem(item,n){st.bag[item]=(st.bag[item]||0)+n}};
vm.runInNewContext(sideSource.slice(start,end),vm.createContext(sctx),{timeout:2000});
for(let z=0;z<10;z++){
 st.zone=z;st.steps=0;st.battleWins=0;st.v51Puzzles=[];st.v51Caches=[];st.v53SideActive={};
 const initial=st.coins;
 assert(!sctx.sideReady(z),'Quest should start locked');
 sctx.sideProgress();assert(st.v53SideActive[z],'Quest acceptance missing '+z);
 assert(!sctx.sideReady(z));
 if(z%4===0){assert(sideTitles[z].includes('24 Schritte'));st.steps=23;}
 if(z%4===1){assert(sideTitles[z].includes('Zwei Kämpfe'));st.battleWins=1;}
 if(z%4===2)assert(sideTitles[z].includes('Runenrätsel'));
 if(z%4===3)assert(sideTitles[z].includes('Runenschatz'));
 sctx.sideProgress();assert(!st.v53SideDone.includes(z),'Quest completed early '+z);
 if(z%4===0)st.steps=24; if(z%4===1)st.battleWins=2;
 if(z%4===2)st.v51Puzzles.push(z); if(z%4===3)st.v51Caches.push(z);
 assert(sctx.sideReady(z),'Quest not ready after target '+z);
 sctx.sideProgress();assert(st.v53SideDone.includes(z),'Quest not claimed '+z);
 assert.equal(st.coins,initial+120+22*z,'Quest coin reward '+z);
 const coins=st.coins,bag=JSON.stringify(st.bag);
 sctx.sideProgress();
 assert.equal(st.coins,coins,'Repeated quest coin reward '+z);
 assert.equal(JSON.stringify(st.bag),bag,'Repeated quest item '+z);
}
assert.equal(st.v53SideDone.length,10,'Ten quests not complete');
// Actual temples and shadow regions must have locations in world maps.
const templeZones=[7,8,9],shadowZones=[3,5,7,8,9],ruinZones=[2,3,4,5,6,8,9];
for(const z of templeZones)assert(api.getFeatures(z*5).npcs.some(n=>n.kind==='temple'),'No temple NPC in '+zones[z]);
for(const z of shadowZones)assert(api.getFeatures(z*5).npcs.some(n=>n.kind==='shadow'),'No shadow NPC in '+zones[z]);
for(const z of ruinZones)assert(api.getFeatures(z*5+3).npcs.some(n=>n.kind==='ruin'),'No ruin NPC in '+zones[z]);
// Trophy identifiers must be unique; half-time exactly 5/10 seals.
const tropSource=read('v5_5.js'),tm=tropSource.match(/const TROPHIES=\[([\s\S]*?)\n\s*\];/);
assert(tm,'Trophy list missing');
const ids=[...tm[1].matchAll(/id:'([^']+)'/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate trophy ID');
assert.match(tm[1],/id:'badge5'[^\n]*goal:5/);
assert.match(tm[1],/id:'badge10'[^\n]*goal:AREAS\.length/);
assert.match(tropSource,/\['dex151','badge5','badge10','league','path'\]/);
assert.match(read('v4.js'),/Fange eine neue AuriMon-Art/);
console.log('[PASS] 50 goals · 30 dungeon runes · 10 arenas · 10 chapters (unlock/save/profile) · 10 side quests (accept/progress/one-time rewards) · 7 ruins · 5 shadow sites · 3 temple regions · unique trophies.');
