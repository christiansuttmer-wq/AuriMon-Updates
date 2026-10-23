'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=name=>fs.readFileSync('app/src/main/assets/'+name,'utf8');
const index=source('index.html');
assert(index.indexOf('aurimon_reset_v158.js')>=0);
assert(index.indexOf('aurimon_reset_v158.js')<index.indexOf('pokemon_stats_151.js'));
assert(index.includes('data-game-version="1.5.10"'));
assert.match(source('game.js'),/content\.scrollTop=0/);
assert.match(source('arimons_0_4.js'),/Die \$\{LEADERS\.length\} Charakterporträts/);
assert.match(source('arimons_0_4.css'),/align-content:start/);
const v55=source('v5_5.js');
assert(v55.includes('Gesamter AuriDex: ')&&v55.includes('1.025'));
assert(v55.includes("if(act==='v55-open-dex'){closeModal();return switchPage('dex');}"));
const keys=[
 'pokemon_abenteuer_v43_player_1','pokemon_abenteuer_v43_player_2',
 'pokemon_abenteuer_v43_backup_1_1','pokemon_abenteuer_v55_ng_backup_1',
 'aurelio_pokemon_abenteuer_v4','aurelio_v4_slot_2',
 'aurimon_story_1_3_15_slot_3','arimon_hidden_quest_progress',
 'pokemon_abenteuer_v43_migration_done'
];
const store=new Map(keys.map((k,i)=>[k,JSON.stringify({save:i})]));
let n=0;const localStorage={
 get length(){return store.size},
 getItem:k=>store.has(k)?store.get(k):null,
 setItem:(k,v)=>store.set(k,String(v)),
 clear(){n++;store.clear();}
};
let sessionReset=0,sessionStorage={clear:()=>sessionReset++};
const context=vm.createContext({window:{localStorage,sessionStorage},console});
const code=source('aurimon_reset_v158.js');
vm.runInContext(code,context);
assert.equal(n,1);assert.equal(sessionReset,1);
assert.equal(store.size,1);assert.equal(store.get('aurimon_reset_v158_completed'),'1');
assert.equal(context.window.AuriReset158.removed,keys.length);
store.set('pokemon_abenteuer_v43_player_1','NEW-GAME');
vm.runInContext(code,context);
assert.equal(n,1,'Page reload deleted new progress again');
assert.equal(store.get('pokemon_abenteuer_v43_player_1'),'NEW-GAME');
assert.equal(context.window.AuriReset158.alreadyDone,true);
console.log('[PASS] All previous profiles, six-slot saves, backups, NG+ and story saves cleared exactly once before boot; Dex, leaderboard titles and gallery regression checks passed.');
