'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=name=>fs.readFileSync('app/src/main/assets/'+name,'utf8');
const html=src('index.html'),v2=src('aurimon_reset_v200.js'),v158=src('aurimon_reset_v158.js');
assert(html.indexOf('aurimon_reset_v158.js')>=0);
assert(html.indexOf('aurimon_reset_v158.js')<html.indexOf('aurimon_reset_v200.js'));
assert(html.indexOf('aurimon_reset_v200.js')<html.indexOf('pokemon_stats_151.js'));
assert.match(html,/data-game-version="2\.0\.0"/);
assert.match(html,/aurimon_brand_2_0\.css/);
assert.match(src('profiles.js'),/aur2-greeting/);
assert.match(src('profiles.js'),/aurimon_logo_2\.webp/);
const store=new Map([
 ['aurimon_reset_v158_completed','1'],
 ['pokemon_abenteuer_v43_player_1','save1'],
 ['pokemon_abenteuer_v43_player_6','save6'],
 ['pokemon_abenteuer_v43_backup_1_1','backup1'],
 ['pokemon_abenteuer_v55_ng_backup_1','newgame+'],
 ['aurimon_story_1_3_15_slot_3','story'],
 ['aurimon_hidden_quest_progress','hidden']
]);
let cleared=0;
const storage={
 get length(){return store.size;},
 getItem:k=>store.has(k)?store.get(k):null,
 setItem:(k,v)=>store.set(k,String(v)),
 clear(){cleared++;store.clear()}
};
let sessions=0;
const c=vm.createContext({window:{localStorage:storage,sessionStorage:{clear(){sessions++}}},console});
vm.runInContext(v158,c);
assert.equal(cleared,0,'Old reset should not erase prior v1.5.10 saves before v2 reset');
vm.runInContext(v2,c);
assert.equal(cleared,1);
assert.equal(store.size,2,'Only v2 and legacy reset marker may survive');
assert.equal(store.get('aurimon_reset_v200_completed'),'1');
assert.equal(store.get('aurimon_reset_v158_completed'),'1');
assert.equal(sessions,1);
assert.equal(c.window.AuriReset200.performed,true);
store.set('pokemon_abenteuer_v43_player_1','NEW2.0SAVE');
vm.runInContext(v158,c);vm.runInContext(v2,c);
assert.equal(cleared,1,'2.0 must NEVER delete new saves after reboot');
assert.equal(store.get('pokemon_abenteuer_v43_player_1'),'NEW2.0SAVE');
assert.equal(c.window.AuriReset200.alreadyDone,true);
console.log('[PASS] v2.0.0 erases all six old saves, backups and quest data one time only; all NEW 2.0 profiles survive reboot. Greeting and assets included.');
