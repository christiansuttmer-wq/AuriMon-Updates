/* AuriMon 1.4.32: actual 50-stage companion rendering / saved follow choice. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/aurimon_world50_pilot.js','utf8');
const from=source.indexOf(' const followerImages=new Map();');
const to=source.indexOf(' function sprite(x,y,tick){',from);
assert(from>=0&&to>from,'Follower implementation must exist in the 50-stage renderer');
assert.match(source,/const buddy=followerInfo\(\)/);
assert.match(source,/paintFollower\(buddy,tick\)/);
assert.match(source,/sprite\(state\.x,state\.y,tick\)/);
assert.match(source,/state\.party\?\.find\(p=>p\.uid===state\.followerUid\)/,'Chosen follower must be respected');
const state={
 x:9,y:9,facing:'up',followerUid:'squirtle',
 party:[{uid:'bulbasaur',id:1,shiny:false},{uid:'squirtle',id:7,shiny:false}]
};
const drawn=[],bad=new Set(),c={
 save(){drawn.push('save')},restore(){drawn.push('restore')},translate(){},scale(){},
 drawImage(){drawn.push('image')},fillText(s){drawn.push('text:'+s)},
 set font(v){},set textAlign(v){},set textBaseline(v){}
};
let stage=0,slot=1,images=0;
class FakeImage{
 constructor(){images++;this.complete=false;this.naturalWidth=0;this.failed=false;}
 set src(v){this.source=v;}
}
const context={
 state,POKE:{1:{symbol:'🌿',name:'Bisasam'},7:{symbol:'💧',name:'Schiggy'}},
 window:{PokemonProfiles:{get activeSlot(){return slot}},
   ARIMON_BATTLE_FRONT:{1:'front1.png',7:'front7.png'},
   ARIMON_BATTLE_BACK:{1:'back1.png',7:'back7.png'}},
 ensure:()=>({stage}),
 safe:(x,y)=>x>=0&&x<20&&y>=0&&y<12,
 passable:t=>t!=='#',tile:(x,y)=>bad.has(x+','+y)?'#':'p',npc:()=>false,
 canvas:{isConnected:false},mobileCanvas:{isConnected:false},
 active:()=>false,draw(){},Image:FakeImage,
 T:48,c,Math,Map,Object,
 ellipse(){drawn.push('shadow')},rounded(){drawn.push('placeholder')}
};
const test=source.slice(from,to)+'\n globalThis.verifyFollower={followerInfo,paintFollower,followerImage};';
vm.runInNewContext(test,vm.createContext(context),{timeout:2000});
const api=context.verifyFollower;
let f=api.followerInfo();
assert.equal(f.mon.uid,'squirtle','Explicitly chosen team member must follow');
assert.equal(f.x,9);assert.equal(f.y,10,'Initial companion stays behind north-facing hero');
api.paintFollower(f,0);
assert(drawn.includes('text:💧'),'Sprite loading placeholder must make the Pokémon visible');
assert.equal(images,1,'One image request per Pokémon and facing');
const img=api.followerImage(f.mon,false);
img.complete=true;img.naturalWidth=96;
drawn.length=0;api.paintFollower(f,100);
assert(drawn.includes('image'),'Actual original Pokémon image must be drawn after loading');
state.x=10;state.facing='right';
f=api.followerInfo();
assert.equal(f.x,9);assert.equal(f.y,9,'Companion occupies hero previous tile after moving');
state.x=11;f=api.followerInfo();
assert.equal(f.x,10);assert.equal(f.y,9,'Companion moves on each step');
state.followerUid='bulbasaur';f=api.followerInfo();
assert.equal(f.mon.id,1,'Team follow button switches shown Pokémon');
assert.equal(f.x,10,'New follower starts behind currently facing hero');
bad.add('10,9');stage=1;
f=api.followerInfo();
assert.notEqual(f.x+','+f.y,'10,9','Follower should avoid blocking terrain on stage change');
slot=2;state.party=[{uid:'squirtle',id:7}];state.followerUid='old-no-longer-in-party';
f=api.followerInfo();
assert.equal(f.mon.id,7,'Missing saved UID falls back to actual party member');
state.party=[];
assert.equal(api.followerInfo(),null,'No phantom Pokémon when team is empty');
console.log('[PASS] AuriMon companion: selected follower, real sprites, offline fallback, following movement, obstacle and stage protection, profile isolation.');
