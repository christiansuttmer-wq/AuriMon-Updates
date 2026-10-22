/* New Game+ profile-integrity regression: Gen1–9 Dex and team must survive.
 * Runs the actual reset function with disposable storage, not real saves.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const v55=fs.readFileSync('app/src/main/assets/v5_5.js','utf8');
const section=(start,end)=>{const a=v55.indexOf(start),b=v55.indexOf(end,a+start.length);assert(a>=0&&b>a,'Missing NG+ block: '+start);return v55.slice(a,b)};
const old={
 leagueDone:true,created:12345,profileName:'Aurelio',profileGender:'boy',
 party:[{uid:'hero',id:906,level:140,hp:40,moves:[]}],
 box:[{uid:'box1',id:1025,level:112,hp:20,moves:[]}],
 seen:[1,151,152,251,906,1025],caught:[1,151,152,251,906,1025],
 v55Hall:[],v55Trophies:['first'],v55Prestige:1,v55FinalReward:false,v54Photos:[],
 bag:{ball:50,greatball:20,candy:8},coins:2000,achievements:['starter'],followerUid:'hero',activeUid:'hero',
 epicQuests:{10:{claimed:true,steps:250}},aurWorld50:{stage:100,runestones:['rune:100:west'],completed:[95]}
};
const original=JSON.stringify(old);
const data=new Map([['another-player-slot','do-not-touch']]);
let modalTitle='',saveCalls=0;
const ctx={
 state:old,PROFILE_PREFIX:'pokemon_abenteuer_v55_ng_backup_',
 window:{PokemonProfiles:{activeSlot:1}},safeData(){},ready:()=>true,
 defaultState:()=>({v55Hall:[],v55Trophies:[],v55Prestige:0,party:[],box:[],seen:[],caught:[],bag:{}}),
 START_BAG:{ball:10,potion:2},
 localStorage:{setItem:(key,value)=>data.set(key,value),getItem:key=>data.get(key)||null},
 v41ScaleSave(){},hpMax:(id,level)=>level*2,v4Moves:()=>[],
 save:()=>{saveCalls++},render(){},modal:(title)=>{modalTitle=title},toast(){},
 document:{querySelectorAll:()=>[]},$:()=>({classList:{add(){}}}),battle:null,modalOpen:false,currentPage:'world'
};
vm.runInNewContext(section('  const unique=x=>','  const safeData=')+
 '\n'+section('  function plusConfirm()','  function restoreMenu()')+
 '\nglobalThis.runNewGamePlus=plusConfirm;',vm.createContext(ctx),{timeout:3500});
ctx.runNewGamePlus();
const next=ctx.state;
assert.notEqual(next,old,'NG+ did not replace the active state');
assert.equal(data.get('pokemon_abenteuer_v55_ng_backup_1'),original,'Original save was not backed up before reset');
assert.equal(data.get('another-player-slot'),'do-not-touch','Another player profile was overwritten');
assert.deepEqual(Array.from(next.caught),[1,151,152,251,906,1025],'NG+ erased Gen2–9 captures');
assert.deepEqual(Array.from(next.seen),[1,151,152,251,906,1025],'NG+ erased Gen2–9 seen Pokémon');
assert.equal(next.party[0].id,906);
assert.equal(next.box[0].id,1025);
assert.equal(next.v55Prestige,2);
assert.deepEqual(Array.from(next.v55Trophies),['first']);
assert(!next.epicQuests||Object.keys(next.epicQuests).length===0,'New story still contains completed old quest flags');
assert(modalTitle.includes('Neues Spiel+ gestartet'),'Missing success confirmation');
assert(saveCalls>0,'New profile never saved');
console.log('[PASS] NG+ preserves all Gen1–9 Pokémon and Pokédex IDs, backs up the exact original, resets quests only and isolates player slots.');
