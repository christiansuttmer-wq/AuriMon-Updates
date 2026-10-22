/* AuriMon forms & special mechanics — additive, per-profile and backwards compatible.
 * All form keys are separate from the 1,025 national species IDs.
 */
'use strict';
(()=>{
 const catalog=window.AuriSpecialFormCatalog;
 if(!catalog||catalog.speciesCount!==D.length)throw Error('AuriMon-Formenkatalog passt nicht zum Pokédex.');
 const equipment=[
 ['formenpass','🎭 Formenpass',650],['mega_ring','💍 Mega-Ring',950],
 ['mega_stone','💎 Mega-Stein',1250],['primal_orb','🔴 Ursprungs-Kugel',1500],
 ['dynamax_band','⌚ Dynamax-Band',1450],['tera_orb','🔮 Tera-Kugel',1450],
 ['form_talisman','🪬 Formen-Talisman',1050]
 ];
 for(const [id,icon,price] of equipment){
  ITEM_INFO[id]=[id.replace(/_/g,' '),icon,'Schaltet passende Spezialformen oder Kampftechniken frei.',price];
  START_BAG[id]??=0;state.bag[id]??=0;
 }
 for(const type of ELEMENT_TYPES){
  const id='z_crystal_'+type;ITEM_INFO[id]=[type+'-Z-Kristall','✨','Eine Z-Attacke je Kampf.',650];START_BAG[id]??=0;
 }
 const formsFor=id=>catalog.bySpecies[id]||[];
 const getForm=(p,temporary=true)=>p?formsFor(p.id).find(f=>f.key===(temporary&&p.battleFormKey||p.formKey))||null:null;
 const formTypes=p=>p.battleTeraType?[p.battleTeraType]:(getForm(p)?.types||POKE[p.id].types);
 const formName=p=>POKE[p.id].name+(getForm(p)?' – '+getForm(p).label:'');
 const cosmetic=f=>f&&!f.battleOnly&&!['mega','primal','gmax','battle'].includes(f.kind);
 const artFor=(p,cls='')=>{
  const f=getForm(p);if(!f)return art(p.id,cls);
  const url='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+
   (cls.includes('allyart')?'back/':'other/official-artwork/')+f.pokemonId+'.png';
  return art(p.id,cls).replace(/<img src="[^"]*"/,'<img src="'+url+'"').replace(/alt="[^"]*"/,'alt="'+formName(p).replace(/"/g,'&quot;')+'"');
 };
 const originalWild=randomWild;
 randomWild=function(z){
  const p=originalWild(z);
  if(z>=10&&Math.random()<.25){
   const regional=formsFor(p.id).filter(f=>cosmetic(f)&&['alola','galar','hisui','paldea'].includes(f.kind));
   if(regional.length)p.formKey=regional[Math.floor(Math.random()*regional.length)].key;
  }
  return p;
 };
 const originalTeam=renderTeam;
 renderTeam=function(){
  originalTeam();
  [...$('team-list').children].forEach((card,i)=>{
   const p=state.party[i];if(!p)return;
   const f=getForm(p,false),row=card.querySelector('.poke-row .art'),name=card.querySelector('.poke-desc strong');
   if(f&&row)row.outerHTML=artFor(p);
   if(f&&name)name.textContent=formName(p)+' · Lv.'+p.level;
   const bar=card.querySelector('.rowactions');
   if(bar&&formsFor(p.id).length){
    const btn=document.createElement('button');btn.className='smallbtn gold';
    btn.dataset.action='forms-open:'+p.uid;btn.textContent='🎭 Formen';bar.appendChild(btn);
   }
  });
  [...$('box-list').children].forEach((card,i)=>{
   const p=state.box[i];if(!p||!getForm(p,false))return;
   const label=card.querySelector('b');if(label)label.textContent=formName(p);
   const img=card.querySelector('.art');if(img)img.outerHTML=artFor(p);
  });
 };
 function formMenu(uid){
  const p=mon(uid);if(!p)return;
  const form=getForm(p,false),pass=bagCount('formenpass');
  const button=(f)=>'<div class="bag-entry"><b>'+f.label+'</b><small>'+f.types.join(' / ')+'</small>'+
   '<button class="smallbtn gold" data-action="forms-pick:'+uid+':'+f.key+'" '+
   (!pass||!cosmetic(f)||form?.key===f.key?'disabled':'')+'>Wählen</button></div>';
  openModal('<h2>🎭 '+POKE[p.id].name+' – alle Gestalten</h2><p>Wechselbare Formen brauchen einen Formenpass. Kampfgestalten werden im Kampf aktiviert.</p>'+
   '<div class="special-forms-list"><div class="bag-entry">Normale Form <button class="smallbtn" data-action="forms-pick:'+uid+':base" '+
   (!pass||!form?'disabled':'')+'>Aktivieren</button></div>'+formsFor(p.id).map(button).join('')+'</div>'+
   '<button class="btn ghost" data-action="close">Zurück</button>');
 }
 function pick(uid,key){
  const p=mon(uid);if(!p||!bagCount('formenpass'))return;
  if(key!=='base'&&!formsFor(p.id).some(f=>f.key===key&&cosmetic(f)))return;
  if(key==='base')delete p.formKey;else p.formKey=key;
  save();render();formMenu(uid);
 }
 const goods=[...equipment.map(x=>x[0]),...ELEMENT_TYPES.map(x=>'z_crystal_'+x)];
 function market(){
  openModal('<h2>🔮 Spezialmarkt</h2><p>Ringe, Kristalle und Bänder bleiben im Rucksack. Einmalige Kampfaktivierungen werden pro Kampf zurückgesetzt.</p>'+
  '<div class="special-forms-list">'+goods.map(id=>'<div class="bag-entry"><b>'+ITEM_INFO[id][1]+' '+ITEM_INFO[id][0]+
   '</b><small>🪙 '+ITEM_INFO[id][3]+' · Tasche: '+bagCount(id)+'</small>'+
   '<button class="smallbtn gold" data-action="forms-buy:'+id+'">Kaufen</button></div>').join('')+'</div>'+
  '<button class="btn ghost" data-action="forms-back">Zum Markt</button>');
 }
 function buy(id){
  if(!goods.includes(id))return;
  const price=ITEM_INFO[id][3];if(state.coins<price)return toast('🪙 Nicht genug Münzen.');
  state.coins-=price;gainItem(id,1);save();render();market();
 }
 const oldShop=showShop;
 showShop=function(){
  oldShop();const actions=$('modal-content')?.querySelector('.dialog-actions');
  if(actions){const b=document.createElement('button');b.className='btn gold';b.dataset.action='forms-market';
   b.textContent='🔮 Spezialformen & Kampfitems';actions.prepend(b)}
 };
 function revert(p){
  if(!p)return;
  if(p.auriDyna){
   const original=hpMax(p.id,p.level);
   p.hp=p.hp<=0?0:Math.min(original,Math.max(1,Math.ceil(p.hp/2)));
   delete p.auriDyna;
  }
  delete p.battleFormKey;delete p.battleTeraType;
 }
 const revertParty=()=>{for(const p of [...state.party,...state.box])revert(p)};
 const oldWin=battleVictory;
 battleVictory=function(){revertParty();return oldWin()};
 const oldLose=battleDefeat;
 battleDefeat=function(){revertParty();return oldLose()};
 const oldFlee=flee;
 flee=function(){const b=battle,result=oldFlee();if(b&&!battle)revertParty();return result};
 const oldStart=startBattle;
 startBattle=function(...args){
  revertParty();const r=oldStart(...args);
  if(battle){battle.auriUsed=false;battle.auriZUsed=false;battle.auriZReady=null}
  return r;
 };
 function activateForm(uid,key){
  const p=mon(uid);
  if(!battle||!p||p.uid!==chooseAlive()?.uid||battle.auriUsed)return;
  const f=formsFor(p.id).find(f=>f.key===key);
  if(!f||!['mega','primal','battle'].includes(f.kind))return;
  const items=f.kind==='mega'?['mega_ring','mega_stone']:f.kind==='primal'?['primal_orb']:['form_talisman'];
  if(items.some(id=>!bagCount(id)))return toast('🔒 Passende Spezialitems fehlen.');
  battle.auriUsed=true;p.battleFormKey=key;closeModal();
  battle.log='✨ '+formName(p)+' aktiviert!';renderBattle();save();
 }
 function activateDyna(){
  const p=chooseAlive();
  if(!p||!battle||battle.auriUsed||!bagCount('dynamax_band'))return;
  battle.auriUsed=true;
  const gmax=formsFor(p.id).find(f=>f.kind==='gmax');
  if(gmax)p.battleFormKey=gmax.key;
  p.auriDyna={turns:3};p.hp*=2;
  battle.log='⌚ '+formName(p)+' wächst für drei Angriffszüge!';renderBattle();save();
 }
 function activateTera(type){
  const p=chooseAlive();
  if(!p||!battle||battle.auriUsed||!bagCount('tera_orb')||!ELEMENT_TYPES.includes(type))return;
  battle.auriUsed=true;p.battleTeraType=type;closeModal();
  battle.log='🔮 '+POKE[p.id].name+' wird zum Tera-Typ '+type+'!';renderBattle();save();
 }
 function activateZ(){
  const p=chooseAlive();if(!p||!battle||battle.auriZUsed||battle.auriZReady)return;
  const type=formTypes(p)[0];if(!bagCount('z_crystal_'+type))return;
  battle.auriZReady=type;battle.log='✨ '+type+'-Z-Attacke bereit!';renderBattle();
 }
 const oldAttack=battleAttack;
 battleAttack=function(type){
  if(!battle)return;
  const p=chooseAlive(),current=battle,wasZ=current.auriZReady;
  oldAttack(type);
  if(wasZ&&type===wasZ){
   current.auriZReady=null;current.auriZUsed=true;
   if(battle===current)battle.log+=' ✨ Z-Kristall eingesetzt!';
  }
  if(p?.auriDyna&&current===battle){
   if(--p.auriDyna.turns<=0){revert(p);battle.log+=' ⌚ Dynamax beendet.'}
  }
  if(battle===current){renderBattle();save()}
 };
 const oldSwitch=battleSwitch;
 battleSwitch=function(uid){const r=oldSwitch(uid);if(battle)renderBattle();return r};
 const oldAction=doAction;
 doAction=function(act,el){
  if(typeof act==='string'){
   const [cmd,uid,key]=act.split(':');
   if(cmd==='forms-open')return formMenu(uid);
   if(cmd==='forms-pick')return pick(uid,key);
   if(cmd==='forms-market')return market();
   if(cmd==='forms-buy')return buy(uid);
   if(cmd==='forms-back')return showShop();
   if(cmd==='forms-transform')return activateForm(uid,key);
   if(cmd==='forms-tera')return activateTera(uid);
  }
  return oldAction(act,el);
 };
 const oldBattleAction=battleAction;
 battleAction=function(act){
  if(typeof act!=='string'||!act.startsWith('special:'))return oldBattleAction(act);
  if(!battle||!chooseAlive())return;
  const kind=act.slice(8),p=chooseAlive();
  if(['mega','primal','battle'].includes(kind)){
   const available=formsFor(p.id).filter(f=>f.kind===kind);
   if(available.length===1)return activateForm(p.uid,available[0].key);
   return openModal('<h2>✨ Kampfgestalt wählen</h2>'+available.map(f=>'<div class="bag-entry"><b>'+f.label+
    '</b><button class="smallbtn gold" data-action="forms-transform:'+p.uid+':'+f.key+'">Aktivieren</button></div>').join('')+
    '<button class="btn ghost" data-action="close">Zurück</button>');
  }
  if(kind==='dyna')return activateDyna();
  if(kind==='z')return activateZ();
  if(kind==='tera')return openModal('<h2>🔮 Tera-Typ wählen</h2><div class="special-type-grid">'+
   ELEMENT_TYPES.map(t=>'<button class="smallbtn gold" data-action="forms-tera:'+t+'">'+t+'</button>').join('')+
   '</div><button class="btn ghost" data-action="close">Zurück</button>');
 };
 const oldDamage=aurimonDamage;
 aurimonDamage=function(att,tgt,move,weather='Klar'){
  const af=getForm(att),df=getForm(tgt),z=!!battle?.auriZReady&&att?.uid===chooseAlive()?.uid&&battle.auriZReady===move.type;
  if(!af&&!df&&!att.battleTeraType&&!tgt.battleTeraType&&!att.auriDyna&&!tgt.auriDyna&&!z)return oldDamage(att,tgt,move,weather);
  const physical=['Normal','Kampf','Flug','Gift','Boden','Gestein','Käfer','Geist','Stahl'].includes(move.type);
  const ix=physical?1:3,dx=physical?2:4;
  const ast=(af?.stats||window.POKEMON_BASESTATS[att.id])[ix],dst=(df?.stats||window.POKEMON_BASESTATS[tgt.id])[dx];
  const a=Math.max(1,Math.floor((2*ast+15)*att.level/100)+5),d=Math.max(1,Math.floor((2*dst+15)*tgt.level/100)+5);
  const natural=af?.types||POKE[att.id].types;
  const stab=att.battleTeraType&&natural.includes(move.type)&&att.battleTeraType===move.type?2:
   formTypes(att).includes(move.type)||natural.includes(move.type)?1.5:1;
  const mult=effectiveness(move.type,formTypes(tgt));
  const crit=Math.random()<.0625;
  const w=weather==='Regen'?(move.type==='Wasser'?1.5:move.type==='Feuer'?.5:1):
          weather==='Sonnig'?(move.type==='Feuer'?1.5:move.type==='Wasser'?.5:1):1;
  const power=Math.max(1,move.power)*(z?2:1);
  const raw=Math.floor(Math.floor((2*att.level/5+2)*power*a/d)/50)+2;
  const boost=(att.auriDyna?1.25:1)*(tgt.auriDyna?.5:1)*(physical&&att.status==='burn'?.5:1);
  return {amount:mult===0?0:Math.max(1,Math.floor(raw*stab*mult*w*boost*(crit?1.5:1)*(.85+Math.random()*.15))),mult,crit};
 };
 const oldRenderBattle=renderBattle;
 renderBattle=function(){
  oldRenderBattle();
  if(!battle)return;
  const p=chooseAlive(),enemy=foe(),box=$('battle-content');
  if(!p||!enemy||!box)return;
  for(const [m,klass] of [[enemy,'enemyart'],[p,'allyart']]){
   const node=box.querySelector('.arena .'+klass);
   if(node&&getForm(m))node.outerHTML=artFor(m,klass);
  }
  const ename=box.querySelector('.battlemon.enemylabel b'),pname=box.querySelector('.battlemon.allylabel b');
  if(ename)ename.textContent=formName(enemy);
  if(pname)pname.textContent=formName(p)+(p.battleTeraType?' 🔮 '+p.battleTeraType:'');
  const attack=box.querySelector('.battleactions .special');
  if(attack){const type=formTypes(p)[0];attack.dataset.battle='attack:'+type;attack.textContent='✨ '+(TYPE_MOVE[type]||type)}
  if(p.auriDyna){
   const life=box.querySelector('.battlemon.allylabel small'),bar=box.querySelector('.battlemon.allylabel .hpbar span');
   if(life)life.textContent='⌚ '+p.auriDyna.turns+' Runden · '+p.hp+' KP';
   if(bar)bar.style.width=Math.min(100,100*p.hp/(2*hpMax(p.id,p.level)))+'%';
  }
  const controls=box.querySelector('.battleactions');if(!controls)return;
  const available=[];
  if(!battle.auriUsed){
   if(formsFor(p.id).some(f=>f.kind==='mega')&&bagCount('mega_ring')&&bagCount('mega_stone'))available.push(['💎 Mega','mega']);
   if(formsFor(p.id).some(f=>f.kind==='primal')&&bagCount('primal_orb'))available.push(['🔴 Proto','primal']);
   if(formsFor(p.id).some(f=>f.kind==='battle')&&bagCount('form_talisman'))available.push(['🪬 Form','battle']);
   if(bagCount('dynamax_band'))available.push(['⌚ Dynamax','dyna']);
   if(bagCount('tera_orb'))available.push(['🔮 Tera','tera']);
  }
  if(!battle.auriZUsed&&!battle.auriZReady&&bagCount('z_crystal_'+formTypes(p)[0]))available.push(['✨ Z-Attacke','z']);
  for(const [name,kind] of available)controls.insertAdjacentHTML('beforeend','<button class="special" data-battle="special:'+kind+'">'+name+'</button>');
 };
 const oldGuide=showGuide;
 showGuide=function(){oldGuide();$('modal-content')?.insertAdjacentHTML('beforeend',
  '<p>🎭 <b>Formen und Spezialmechaniken:</b> Wähle im Team dauerhafte Alternativ- und Regionalformen. Kämpfe mit Mega-Entwicklung, Protomorphose, Dynamax, Gigadynamax, Tera, Z-Attacken und besonderen Kampfgestalten. Die benötigten Items gibt es im Spezialmarkt.</p>')};
 window.AuriFormSystem={catalog,formsFor,getForm,formTypes,formName,cosmetic,artFor,activateDyna,activateTera,activateZ,
  inspect:()=>({species:catalog.speciesCount,forms:catalog.totalForms,kinds:catalog.kinds,elementTypes:ELEMENT_TYPES.length})};
})();
