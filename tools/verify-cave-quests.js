/* Seven real cave puzzles, two mandatory switches, final treasure and idempotency.
 * Disposable Node state only; no player saves are opened.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/assets/v4.js','utf8');
const codeBetween=(first,last)=>{
 const i=source.indexOf(first),j=source.indexOf(last,i+first.length);
 assert(i>=0&&j>i,'Could not find cave source block '+first);return source.slice(i,j);
};
const map=vm.runInNewContext(source.match(/const V4_DUNGEON=(\[[\s\S]*?\]);/)[1]);
const zones=vm.runInNewContext(source.match(/const V4_CAVES=(\[[^\]]+\]);/)[1]);
assert.equal(zones.length,7,'Expected seven classic cave quests');
const state={dungeon:null,caveSolved:[],found:[],bag:{},coins:0,steps:0,x:5,y:7};
const context={state,V4_DUNGEON:map,modalOpen:false,battle:null,save(){},render(){},toast(){},modal(){},
 ITEM_INFO:{candy:['EP-Bonbon'],'Tausch-Kabel':['Tausch-Kabel']},
 gainItem:(id,n=1)=>{state.bag[id]=(state.bag[id]||0)+n}};
const c=codeBetween('function v4CaveTile(x,y)','const v4OldWild')+
 '\n'+codeBetween('function v4WalkCave(dx,dy)','const v4OldWalk')+
 '\nglobalThis.auditCaves={v4CaveTile,v4WalkCave};';
vm.runInNewContext(c,vm.createContext(context),{timeout:3000});
const api=context.auditCaves;
const directions=[[1,0],[-1,0],[0,1],[0,-1]];
function routeTo(tx,ty){
 const d=state.dungeon,queue=[[d.x,d.y,[]]],seen=new Set();
 for(let i=0;i<queue.length;i++){
  const [x,y,route]=queue[i],key=x+','+y;
  if(seen.has(key))continue;seen.add(key);
  if(x===tx&&y===ty)return route;
  for(const [dx,dy] of directions){
   const nx=x+dx,ny=y+dy,t=api.v4CaveTile(nx,ny);
   if(!['dungeonwall','door'].includes(t))queue.push([nx,ny,[...route,[dx,dy]]]);
  }
 }
 throw Error('Unreachable cave objective '+tx+','+ty);
}
function traverse(tx,ty){
 for(const [dx,dy] of routeTo(tx,ty))api.v4WalkCave(dx,dy);
}
function solve(z){
 state.dungeon={zone:z,x:5,y:7,switches:[],picked:false};
 const before=state.coins;
 assert.equal(api.v4CaveTile(5,2),'door','Cave door should be closed before the switches');
 traverse(1,3);
 assert.equal(state.dungeon.switches.length,1,'First switch missing in cave '+z);
 assert.equal(api.v4CaveTile(5,2),'door','Cave opened with only one switch '+z);
 traverse(9,3);
 assert.equal(state.dungeon.switches.length,2,'Second switch missing in cave '+z);
 assert.notEqual(api.v4CaveTile(5,2),'door','Cave stays locked after both switches '+z);
 traverse(5,1);
 assert(state.caveSolved.includes(z),'Cave treasure quest did not finish '+z);
 return state.coins-before;
}
for(const z of zones)assert.equal(solve(z),300,'Wrong cave reward '+z);
assert.equal(state.caveSolved.length,7,'Not all seven caves complete');
const total=state.coins,bag=JSON.stringify(state.bag);
assert.equal(solve(zones[0]),0,'Repeated cave paid coins twice');
assert.equal(state.coins,total);
assert.equal(JSON.stringify(state.bag),bag,'Repeated cave paid items twice');
console.log('[PASS] 7 traversable caves, 14 switch activations, seven unique treasures, one-time rewards, replay protection.');
