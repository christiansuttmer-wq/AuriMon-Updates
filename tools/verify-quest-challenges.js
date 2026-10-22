/* AuriMon full quest challenge coverage: daily, rival, cups, shadow, league, master path.
 * Executes real game functions with disposable test states. Player files untouched.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ROOT='app/src/main/assets/';
const read=n=>fs.readFileSync(ROOT+n,'utf8');
const between=(src,a,b)=>{const x=src.indexOf(a),y=src.indexOf(b,x+a.length);assert(x>=0&&y>x,'Missing logic block '+a);return src.slice(x,y)};
const noop=()=>{};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function envFor(state){
  const ctx={state,battle:null,clamp,save:noop,render:noop,closeModal:noop,toast:noop,modal:noop,chooseAlive:()=>true,
    gainItem:(id,n=1)=>{state.bag[id]=(state.bag[id]||0)+n},newMon:(id,level)=>({id,level,hp:level+id}),
    startBattle:(kind,enemies,name,key,reward)=>{ctx.battle={kind,enemies,name,key,reward}},
    battleVictory:()=>{ctx.battle=null},battleDefeat:noop,
    $:()=>({insertAdjacentHTML:noop,querySelector:()=>({textContent:'',insertAdjacentHTML:noop}),classList:{add:noop,remove:noop}}),
    window:{PokemonProfiles:{activeSlot:1}}};
  return ctx;
}
function evaluate(ctx,source,body,expose){
  vm.runInNewContext(body+'\nglobalThis.audit={'+expose.join(',')+'};',vm.createContext(ctx),{timeout:4000});
  return ctx.audit;
}

// Four daily quests: cannot claim before requirements, reward once and preserve same-day state.
{
 const code=read('v4.js');
 const state={steps:10,battleWins:0,caught:[],trainerWins:[],bag:{},daily:null};
 const ctx=envFor(state);
 ctx.v4QuestLog=noop;ctx.v4Time=()=>({date:'2026-10-22',hour:12,night:false});
 const daily=evaluate(ctx,code,between(code,'function v4Daily()','function v4CanLegend(id)')+
    '\n'+between(code,'function v4Claim(id)','function v4TrainerPass()'),['v4Daily','v4QuestRows','v4Claim']);
 const ids=['gehen','kaempfen','fangen','trainer'];
 for(const id of ids)daily.v4Claim(id);
 assert.equal(Object.keys(state.bag).length,0,'Daily quest paid before completion');
 state.steps+=30;state.battleWins=3;state.caught=[1];state.trainerWins=Array.from({length:10},(_,i)=>'t'+i);
 for(const id of ids)daily.v4Claim(id);
 assert.equal(daily.v4Daily().claimed.length,4,'Four daily tasks not credited');
 const rewards=JSON.stringify(state.bag);
 for(const id of ids)daily.v4Claim(id);
 assert.equal(JSON.stringify(state.bag),rewards,'Repeat daily reward exploit');
}
// Six rival encounters and 3*3 cup rounds, including rematch/no duplicate trophy.
{
 const code=read('v5_2.js');
 const state={zone:0,starterChosen:true,party:[{id:1,level:20}],badges:Array.from({length:10},(_,i)=>i),
  bag:{},coins:0,battleWins:0,v52RivalWins:[],v52Tournaments:{0:0,1:0,2:0},v52Rematches:{},v52TrainingWins:0,v52TournamentWins:0};
 const ctx=envFor(state);ctx.ready=()=>true;ctx.escapeTrainerName=()=> 'Trainer';
 const head=between(code,'  const RIVAL_ZONES=','  function data()');
 const methods=between(code,'  function data()','  const hadDefault=')+
  between(code,'  function rivalTeam()','  function trainingMenu()');
 const victory=between(code,'  const originalWin=battleVictory;','  const oldLoss=battleDefeat;');
 const api=evaluate(ctx,code,head+methods+victory,['rivalTeam','doRival','startCup','battleVictory','data','TOURNEYS','RIVAL_ZONES']);
 assert.equal(api.RIVAL_ZONES.length,6);
 for(const z of api.RIVAL_ZONES){
  state.zone=z;api.doRival();
  assert(ctx.battle?.kind==='v52-rival','Rival battle not offered in region '+z);
  assert(ctx.battle.enemies.length>=2&&ctx.battle.enemies.length<=6);
  api.battleVictory();
  assert(state.v52RivalWins.includes(z),'Rival win not saved '+z);
  const done=state.v52RivalWins.length;
  api.doRival();api.battleVictory();
  assert.equal(state.v52RivalWins.length,done,'Rival win counted twice '+z);
 }
 for(let id=0;id<3;id++){
  for(let round=0;round<3;round++){
   api.startCup(id);
   assert(ctx.battle&&ctx.battle.key==='v52:cup:'+id+':'+round,'Pokalrunde gesperrt '+id+':'+round);
   api.battleVictory();
   assert.equal(state.v52Tournaments[id],round+1,'Pokalrunde not saved '+id+':'+round);
  }
 }
 assert.equal(state.v52TournamentWins,3,'Not all three cup trophies earned');
 const medals=state.v52TournamentWins,bag=JSON.stringify(state.bag);
 api.startCup(2);api.battleVictory();
 assert.equal(state.v52TournamentWins,medals,'Cup trophy duplicated by rematch');
 assert.equal(JSON.stringify(state.bag),bag,'Cup candy reward duplicated');
}
// Five secondary shadow commander chapters after the original rocket encounter.
{
 const code=read('v5_3.js'),zones=[3,5,7,8,9];
 const state={zone:zones[0],party:[{id:1}],starterChosen:true,rocketWins:zones.slice(),
  v53StoryWins:[],bag:{},coins:0,battleWins:0};
 const ctx=envFor(state);ctx.checkData=noop;ctx.TEAM_ZONES=zones;
 const fight=between(code,' function shadowFight()',' function fossilDialog()');
 const win=between(code,' const origWin=battleVictory;',' const origTravel=renderTravel;');
 const api=evaluate(ctx,code,fight+win,['shadowFight','battleVictory']);
 for(const z of zones){
  state.zone=z;api.shadowFight();
  assert(ctx.battle?.kind==='v53-shadow','Shadow chapter not unlocked '+z);
  api.battleVictory();
  assert(state.v53StoryWins.includes(z),'Shadow chapter not marked complete '+z);
  const won=state.v53StoryWins.length,before=JSON.stringify(state.bag);
  api.shadowFight();
  assert.equal(state.v53StoryWins.length,won,'Shadow chapter replay count '+z);
  assert.equal(JSON.stringify(state.bag),before,'Shadow chapter reward repeated '+z);
 }
 assert.equal(state.v53StoryWins.length,5);
}
// The five league fights must unlock consecutively after all forty arena seals.
{
 const code=read('v4.js');
 const state={zone:39,badges:Array.from({length:40},(_,i)=>i),leagueWins:[],leagueDone:false,
  achievements:[],bag:{},coins:0,battleWins:0};
 const ctx=envFor(state);
 ctx.AREAS=Array.from({length:40},(_,i)=>({name:'Region '+i}));
 const battle=between(code,'function v4LeagueBattle(index)','const v4OldVictory=battleVictory;');
 const win=between(code,'const v4OldVictory=battleVictory;','const v4OldCenter=healCenter;');
 const api=evaluate(ctx,code,battle+win,['v4LeagueBattle','battleVictory']);
 api.v4LeagueBattle(1);
 assert.equal(ctx.battle,null,'League opponent #2 should be locked before #1');
 for(let i=0;i<5;i++){
  api.v4LeagueBattle(i);
  assert.equal(ctx.battle?.key,'league:'+i,'League challenge '+i+' unavailable');
  assert.equal(ctx.battle.enemies.length,i===4?6:5,'League team size '+i);
  api.battleVictory();
  assert(state.leagueWins.includes(i),'League victory '+i+' missing');
 }
 assert(state.leagueDone,'League completion flag missing');
 assert.equal(state.leagueWins.length,5);
 const earned=state.coins;
 api.v4LeagueBattle(4);api.battleVictory();
 assert.equal(state.coins,earned,'League completion coin reward duplicated');
}
// Four master-path trials: gates, six-mon final and once-only grand reward.
{
 const code=read('v5_5.js');
 const names=vm.runInNewContext(code.match(/PATH_NAMES=(\[[^;]+?\]);/)[1]);
 const teams=vm.runInNewContext(code.match(/PATH_TEAMS=(\[[^;]+?\]);/)[1]);
 const levels=vm.runInNewContext(code.match(/PATH_LEVELS=(\[[^;]+?\]);/)[1]);
 const state={party:[{id:1}],leagueDone:true,v55Prestige:0,v55PathWins:[],bag:{},coins:0,battleWins:0};
 const ctx=envFor(state);ctx.ready=()=>true;ctx.safeData=noop;ctx.PATH_NAMES=names;ctx.PATH_TEAMS=teams;ctx.PATH_LEVELS=levels;ctx.record=noop;ctx.safe=x=>String(x);
 const start=between(code,'  function startPath(n)','  function completedDex()');
 const win=between(code,'  const origWin=battleVictory;','  const origTravel=renderTravel;');
 const api=evaluate(ctx,code,start+win,['startPath','battleVictory']);
 api.startPath(2);assert.equal(ctx.battle,null,'Skipped master path trial');
 for(let n=0;n<4;n++){
  api.startPath(n);
  assert.equal(ctx.battle?.key,'v55:path:'+n,'Missing master trial '+n);
  assert.equal(ctx.battle.enemies.length,n===3?6:5,'Master trial team size '+n);
  api.battleVictory();
  assert(state.v55PathWins.includes(n),'Master trial progress missing '+n);
 }
 assert.equal(state.v55PathWins.length,4);
 const candy=state.bag.candy||0;
 api.startPath(3);api.battleVictory();
 assert.equal(state.bag.candy||0,candy,'Grand master-path candy repeated');
}
console.log('[PASS] 4 daily quests, 6 rivals, 9 cup rounds, 5 shadow commanders, 5 league battles and 4 master path trials; progression, gates and rewards verified.');
