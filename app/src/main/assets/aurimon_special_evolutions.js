/* Modern evolution challenges: all previously "trial" evolutions are playable,
 * using the real evolution trigger metadata and adapted in-game goals.
 * Crucial: existing creatures, IDs, evolutions and player saves remain intact.
 */
'use strict';
(()=>{
 const rules=window.AuriSpecialEvolutionRules;
 if(!rules||Object.keys(rules).length!==64)throw Error('Special evolution rule table incomplete.');
 const pokeApiTypes=['Normal','Kampf','Flug','Gift','Boden','Gestein','Käfer','Geist','Stahl','Feuer','Wasser','Pflanze','Elektro','Psycho','Eis','Drache','Unlicht','Fee'];
 const typeTarget={979:'Geist',981:'Psycho',982:'Normal',904:'Gift',899:'Psycho',900:'Gestein',902:'Wasser',983:'Unlicht'};
 const rule=(p,e)=>rules[p.id+':'+e.to];
 const statField=p=>p.auriEvoStats||(p.auriEvoStats={moves:{},crits:0,taken:0,wins:0,levels:0});
 const focusIds={attack:'Angriff',defense:'Verteidigung',balance:'Ausgeglichen'};
 for(const [id,title] of Object.entries(focusIds)){
  const key='evo_focus_'+id;ITEM_INFO[key]=['Trainingsband '+title,'🥋','Bestimmt die Spezialentwicklung von Rabauz.',330];START_BAG[key]??=0;
 }
 const requireCoins=r=>r.trigger==='gimmighoul-coins'?999:0;
 function reason(p,e){
  const r=rule(p,e),info=statField(p),level=r.minLevel||e.at||25;
  if(p.level<level)return 'Benötigt Level '+level;
  const requiredForm=window.AuriFormSystem?.formsFor(p.id).find(f=>f.formId===r.formId);
  if(r.formId>=10000&&requiredForm&&p.formKey!==requiredForm.key)
   return 'Benötigt '+requiredForm.label+' (Formenpass)';
  if(r.time){
   const hour=new Date().getHours();
   if(r.time==='day'&&(hour<7||hour>=20))return 'Nur tagsüber (7–20 Uhr)';
   if(r.time==='night'&&hour>=7&&hour<20)return 'Nur nachts (20–7 Uhr)';
  }
  if(r.gender&&((r.gender===1?'female':'male')!==(p.gender||'male')))
   return r.gender===1?'Nur weibliche Pokémon':'Nur männliche Pokémon';
  if(r.minimumHappiness&&bondSteps(p)<r.minimumHappiness)return 'Freundschaft '+bondSteps(p)+'/'+r.minimumHappiness;
  if(r.affection&&bondSteps(p)<r.affection*45)return 'Gemeinsame Schritte: '+bondSteps(p)+'/'+r.affection*45;
  if(r.beauty&&bondSteps(p)<r.beauty*2)return 'Schönheits-Training: '+bondSteps(p)+'/'+r.beauty*2;
  if(r.heldItem&&!bagCount('evoitem_'+r.heldItem))return 'Benötigt gehaltenes Item '+r.heldItem;
  if(r.triggerItem&&!bagCount('evoitem_'+r.triggerItem))return 'Benötigt Entwicklungsitem '+r.triggerItem;
  if(r.partySpecies&&!state.party.some(m=>m.id===r.partySpecies))return 'Passendes Partner-Pokémon im Team erforderlich';
  if(r.partyType&&!state.party.some(m=>window.POKEDEX[m.id-1]?.types?.includes(pokeApiTypes[r.partyType-1])))return 'Pokémon eines passenden Typs im Team erforderlich';
  if(r.rain&&typeof v4Weather==='function'&&v4Weather(state.zone)!=='Regen')return 'Nur bei Regen in der Spielwelt';
  if(r.relativeStats!==undefined){
   const needed=r.relativeStats===1?'attack':r.relativeStats===-1?'defense':'balance';
   if(p.auriEvoFocus!==needed)return 'Trainingsband '+focusIds[needed]+' benutzen';
  }
  const trigger=r.trigger,move=r.moveType||typeTarget[r.target]||POKE[p.id].types[0],count=info.moves[move]||0;
  if(trigger==='shed')return 'Entsteht automatisch zusätzlich bei Ninjask-Entwicklung (freier Teamplatz + AuriBall)';
  if(['level-up','trade','unclassified'].includes(trigger)){
   if(r.knownMove||r.knownMoveType)if(count<8)return 'Setze '+move+'-Attacken ein: '+count+'/8';
   if(trigger==='trade'&&!bagCount('Tausch-Kabel'))return 'Tausch-Kabel benötigt';
   return null;
  }
  if(trigger==='use-item')return null;
  if(trigger==='use-move'&&count<20)return move+'-Attacken einsetzen: '+count+'/20';
  if(['agile-style-move','strong-style-move'].includes(trigger)&&count<12)return move+'-Attacken einsetzen: '+count+'/12';
  if(trigger==='three-critical-hits'&&info.crits<3)return 'Drei Volltreffer: '+info.crits+'/3';
  if(trigger==='take-damage'&&info.taken<49)return 'Mindestens 49 KP Schaden im Kampf erleiden: '+info.taken+'/49';
  if(trigger==='recoil-damage'&&info.taken<60)return 'Mindestens 60 KP Kampfschaden erleiden: '+info.taken+'/60';
  if(trigger==='three-defeated-bisharp'&&info.wins<3)return 'Drei Kämpfe mit diesem Pokémon gewinnen: '+info.wins+'/3';
  if(trigger==='in-battle-level-up'&&info.levels<1)return 'Steige mindestens einmal in einem Kampf auf';
  if(trigger==='spin'&&bondSteps(p)<80)return 'Wirble mindestens 80 Schritte mit diesem Pokémon: '+bondSteps(p)+'/80';
  if(trigger==='gimmighoul-coins'&&state.coins<999)return '999 Münzen sammeln: '+state.coins+'/999';
  if(trigger==='meltan-candies'&&bagCount('candy')<40)return '40 EP-Bonbons sammeln: '+bagCount('candy')+'/40';
  return null;
 }
 const originalReason=evolutionReason;
 evolutionReason=function(p,e){
  if(e.kind!=='trial')return originalReason(p,e);
  const r=rule(p,e);if(!r)return e.note||'Entwicklungsbedingung unbekannt';
  const base=originalReason(p,{...e,kind:'special',note:''});
  return base||reason(p,e);
 };
 const oldLabel=evolutionLabel;
 evolutionLabel=function(p,e){
  if(e.kind!=='trial')return oldLabel(p,e);
  const req=evolutionReason(p,e);
  return 'Spezialentwicklung'+(req?' · '+req:' · Bereit!');
 };
 const oldEvolve=evolve;
 evolve=function(uid,to){
  const p=mon(uid),e=p&&POKE[p.id]?.evol.find(x=>x.to===to),r=e&&rule(p,e);
  const before=p?.id;
  const result=oldEvolve(uid,to);
  if(p&&before!==p.id&&r){
   if(r.trigger==='trade')state.bag['Tausch-Kabel']--;
   if(r.triggerItem)state.bag['evoitem_'+r.triggerItem]--;
   if(r.trigger==='gimmighoul-coins')state.coins-=999;
   if(r.trigger==='meltan-candies')state.bag.candy-=40;
   if(r.heldItem&&!e.heldItem)state.bag['evoitem_'+r.heldItem]--;
   delete p.auriEvoFocus;delete p.auriEvoStats;save();
  }
  // Nincada's Shedinja mechanic creates a SECOND creature when Ninjask evolves.
  if(p&&before===290&&p.id===291&&state.party.length<6&&bagCount('ball')){
   const extra=newMon(292,p.level);extra.shiny=p.shiny;state.party.push(extra);
   state.bag.ball--;seen(292);caught(292);save();
   toast('👻 Ninjatom entsteht zusätzlich im freien Teamplatz!');
  }
  return result;
 };
 const oldBattleAttack=battleAttack;
 battleAttack=function(type){
  const p=chooseAlive(),live=!!battle;
  if(live&&p&&ELEMENT_TYPES.includes(type)){
   const s=statField(p);s.moves[type]=(s.moves[type]||0)+1;
  }
  return oldBattleAttack(type);
 };
 const oldDamage=aurimonDamage;
 aurimonDamage=function(a,t,m,w){
  const hit=oldDamage(a,t,m,w);
  if(battle&&a&&a.uid===chooseAlive()?.uid&&hit.crit)statField(a).crits++;
  return hit;
 };
 const oldEnemyTurn=enemyTurn;
 enemyTurn=function(...args){
  const p=chooseAlive(),hp=p?.hp||0,result=oldEnemyTurn(...args);
  if(p&&hp>p.hp)statField(p).taken+=hp-p.hp;
  return result;
 };
 const oldWin=battleVictory;
 battleVictory=function(){
  const p=chooseAlive();if(p&&battle)statField(p).wins++;
  return oldWin();
 };
 const oldXp=gainXP;
 gainXP=function(p,amount){
  const before=p?.level||0,result=oldXp(p,amount);
  if(p&&battle&&p.level>before)statField(p).levels+=p.level-before;
  return result;
 };
 const oldAction=doAction;
 doAction=function(act,el){
  if(typeof act==='string'&&act.startsWith('evo-focus:')){
   const [,uid,kind]=act.split(':'),p=mon(uid),item='evo_focus_'+kind;
   if(!p||!focusIds[kind]||!bagCount(item))return;
   state.bag[item]--;p.auriEvoFocus=kind;save();render();toast('🥋 Trainingsstil '+focusIds[kind]+' aktiviert!');return;
  }
  return oldAction(act,el);
 };
 const oldMenu=showEvolutions;
 showEvolutions=function(uid){
  oldMenu(uid);const p=mon(uid);if(p?.id!==236)return;
  const el=$('modal-content');if(!el)return;
  el.insertAdjacentHTML('beforeend','<div class="bag-entry"><b>🥋 Rabauz-Trainingsstil wählen</b>'+
   Object.keys(focusIds).map(k=>'<button class="smallbtn" data-action="evo-focus:'+uid+':'+k+'">'+
   focusIds[k]+' ('+bagCount('evo_focus_'+k)+')</button>').join('')+'</div>');
 };
 // Items exist alongside the already-established shop page; special items
 // are purchaseable via the battle-mechanic market without additional save slots.
 const oldShop=showShop;
 showShop=function(){
  oldShop();
  const el=$('modal-content');
  if(!el)return;
  el.insertAdjacentHTML('beforeend','<div class="bag-entry"><b>🥋 Spezial-Entwicklungen</b>'+
  Object.entries(focusIds).map(([k,name])=>'<button class="smallbtn gold" data-action="evo-buy:'+('evo_focus_'+k)+':0">'+name+'</button>').join('')+'</div>');
 };
 // The action handler for AuriEvolutionItems is not guaranteed to include the
 // 3 training bands, so intercept these explicit purchases ourselves.
 const shopActions=doAction;
 doAction=function(act,el){
  if(typeof act==='string'&&act.startsWith('evo-buy:evo_focus_')){
   const key=act.split(':')[1],price=ITEM_INFO[key]?.[3];if(!price)return;
   if(state.coins<price)return toast('🪙 Nicht genug Münzen.');
   state.coins-=price;gainItem(key);save();render();return showShop();
  }
  return shopActions(act,el);
 };
 window.AuriSpecialEvolutions={rules,reason,progress:p=>statField(p),total:Object.keys(rules).length};
})();
