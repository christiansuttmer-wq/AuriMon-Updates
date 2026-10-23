/* AuriMon final mechanics tests: 1,025 species obtainable and full modern type chart.
 * Read engine constants in isolation: no Android/DOM access or save mutation.
 */
'use strict';
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const dir = 'app/src/main/assets/';
const source = name => fs.readFileSync(dir + name,'utf8');
const context = {window:{}};
vm.runInNewContext(source('pokemon_stats_151.js'), vm.createContext(context));
vm.runInNewContext(source('dex.js'), context);
vm.runInNewContext(source('pokemon_gen2_9.js'), context);
vm.runInNewContext(source('pokemon_gen9_evolutions.js'), context);
const engine = source('game.js');
const head = engine.slice(0,engine.indexOf('function sprite('));
assert(head.length > 5000,'Engine initialization marker');
vm.runInNewContext(head + '\nglobalThis.audit = {dex:D, species:POKE, pools:ZONE_POOLS, types:TYPES, areas:AREAS, rareStrength:AREA_STRENGTH};', context);
const {dex,pools,types,areas,rareStrength} = context.audit;
assert.equal(dex.length,1025);
assert.equal(pools.length,40);
assert.equal(areas.length,40);
const regions = new Map();
for (let z=0;z<40;z++) {
  assert(pools[z].length>0, 'Empty regional pool '+z);
  for(const id of pools[z]) {
    assert(id>=1&&id<=1025,'Bad regional species ID '+id);
    if (!regions.has(id)) regions.set(id,[]);
    regions.get(id).push(z);
  }
  assert(rareStrength[z].wild[0]<=rareStrength[z].wild[1]);
}
for(let id=1;id<=1025;id++)assert(regions.has(id),'Unobtainable wild species '+id);
const allTypes = ['Normal','Feuer','Wasser','Pflanze','Elektro','Eis','Kampf','Gift','Boden','Flug','Psycho','Käfer','Gestein','Geist','Drache','Unlicht','Stahl','Fee'];
assert.deepEqual(Object.keys(types).sort(),allTypes.slice().sort());
const verify = (attack,defend,mult) => assert.equal(types[attack]?.[defend] ?? 1,mult,attack+' attacking '+defend);
const immune = [['Normal','Geist'],['Kampf','Geist'],['Gift','Stahl'],['Boden','Flug'],['Elektro','Boden'],['Psycho','Unlicht'],['Geist','Normal'],['Drache','Fee']];
for(const [a,d] of immune)verify(a,d,0);
const extra = [
 ['Kampf','Unlicht',2],['Kampf','Fee',.5],['Gift','Fee',2],['Flug','Stahl',.5],
 ['Psycho','Unlicht',0],['Psycho','Kampf',2],['Käfer','Unlicht',2],['Käfer','Fee',.5],
 ['Geist','Unlicht',.5],['Drache','Stahl',.5],['Stahl','Fee',2],['Fee','Drache',2],
 ['Feuer','Stahl',2],['Wasser','Feuer',2],['Pflanze','Wasser',2],['Eis','Drache',2],
 ['Unlicht','Psycho',2],['Boden','Elektro',2],['Normal','Stahl',.5],['Normal','Wasser',1],
 ['Fee','Gift',.5],['Gestein','Flug',2],['Kampf','Geist',0],['Flug','Kampf',2]
];
for(const x of extra)verify(...x);
assert.match(engine,/hit\.amount=hit\.mult===0\?0:Math\.max\(1,Math\.round\(hit\.amount\*\.72\)\)/);
const finalSource=source('aurimon_final_pass.js');
let selected=null,modalHtml='';
context.state={zone:1,caught:[],seen:[]};
context.randomWild=()=>({id:1});
context.newMon=(id,level)=>({id,level,uid:'test-'+id});
context.doAction=()=>{};
context.openModal=html=>modalHtml=html;
context.window.AuriFormSystem={formsFor:()=>[]};
vm.runInNewContext(finalSource,context);
for(let z=0;z<40;z++){
  const fromApi=context.window.AuriFinalPass.getRegionalSpecies(z);
  assert.deepEqual(Array.from(fromApi),Array.from(new Set(pools[z])));
  const pick=context.randomWild(z);
  assert(pools[z].includes(pick.id),'Generated monster outside region '+z);
  assert(pick.level>=rareStrength[z].wild[0]&&pick.level<=rareStrength[z].wild[1]);
}
context.doAction('regional-dex:39:0',null);
assert(modalHtml.includes('Regionaldex')&&modalHtml.includes(areas[39].name));
assert(modalHtml.includes('Seite 1 / '));
assert.match(source('index.html'),/data-action="regional-dex"/);
assert.match(source('index.html'),/aurimon_final_pass\.js/);
assert.match(source('index.html'),/data-game-version="1\.5\.10"/);
console.log('[PASS] Complete 18-type combat table, immunities, 1,025 capturable species in 40 regions, regional guide and safe wild generation.');
