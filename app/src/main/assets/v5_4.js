/* AuriMon 5.4.0 – Freundschaft, Lager, Eier, Bewegungsdetails und Fotoalbum.
 * Additive Erweiterung. Nur Kanto #001–151; sechs Spielerprofile bleiben getrennt.
 */
'use strict';
(() => {
 const MAX_EGGS=3, MAX_PHOTOS=20, EGG_STEPS=120, CARE_COOLDOWN=40;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const hasProfile=()=>Number.isInteger(window.PokemonProfiles?.activeSlot)&&window.PokemonProfiles.activeSlot>=1;
 const ready=()=>hasProfile()&&state.starterChosen&&state.party.length>0;
 const all=()=>state.party.concat(state.box).filter(m=>m&&POKE[m.id]);
 const baseId=id=>{let n=Number(id),limit=0;while(evoTo[n]&&limit++<4)n=evoTo[n];return n};
 const lovable=m=>m&&POKE[m.id]&&m.id>=1&&m.id<=151;
 const nonLegend=m=>lovable(m)&&m.id<144;
 const displayName=m=>esc(POKE[m.id].name);
 const buttons=(text,act,disabled=false)=>`<button type="button" data-action="${act}" ${disabled?'disabled':''}>${text}</button>`;
 function data(){
  if(!state||typeof state!=='object')return;
  if(!Array.isArray(state.v54Eggs))state.v54Eggs=[];
  state.v54Eggs=state.v54Eggs.filter(e=>e&&Number.isInteger(e.id)&&e.id>=1&&e.id<=143&&Number.isFinite(e.steps)).slice(0,MAX_EGGS);
  if(!Array.isArray(state.v54Photos))state.v54Photos=[];
  state.v54Photos=state.v54Photos.filter(p=>p&&typeof p.image==='string'&&p.image.startsWith('data:image/jpeg;base64,')&&p.image.length<160000).slice(-MAX_PHOTOS);
  if(!state.v54LastCare||typeof state.v54LastCare!=='object'||Array.isArray(state.v54LastCare))state.v54LastCare={};
  if(typeof state.v54Pair!=='string')state.v54Pair='';
  if(!Number.isFinite(state.v54Hatched))state.v54Hatched=0;
  if(!Number.isFinite(state.v54PlayCount))state.v54PlayCount=0;
  for(const m of all()){
   m.friendship=clamp(Number.isFinite(m.friendship)?m.friendship:70,0,255);
  }
 }
 const prevDefault=defaultState;
 defaultState=function(){return {...prevDefault(),v54Eggs:[],v54Photos:[],v54LastCare:{},v54Pair:'',v54Hatched:0,v54PlayCount:0}};
 const prevNewMon=newMon;
 newMon=function(id,lv){const m=prevNewMon(id,lv);m.friendship=70;return m};
 function mood(m){const v=m.friendship??70;return v>=210?'💖 Unzertrennlich':v>=150?'🥰 Sehr glücklich':v>=95?'😊 Vertraut dir':v>=50?'🙂 Neugierig':'😔 Noch schüchtern'}
 function bond(m,points){if(!lovable(m))return; m.friendship=clamp((m.friendship??70)+points,0,255)}
 function camp(){if(!ready())return;data();
  const team=state.party.map(m=>`<article class="v54-mon"><div class="v54-mon-head">${art(m.id,'thumb')}<div><b>${displayName(m)} ${m.shiny?'✨':''}</b><small>Lv. ${m.level} · ${mood(m)}</small></div></div><div class="v54-friend"><i style="width:${Math.round(m.friendship/255*100)}%"></i></div><div class="v54-mini">${m.friendship}/255 Freundschaft · KP ${Math.round(m.hp)}/${hpMax(m.id,m.level)}</div>${buttons('💗 Spielen','v54-care:'+encodeURIComponent(m.uid),(state.steps-(state.v54LastCare[m.uid]??-10000))<CARE_COOLDOWN)}</article>`).join('');
  modal('🏕️ AuriMon-Lager',`<div class="v54-camp-scene"><div class="v54-stars">✦　⋆　✧　✦</div><div class="v54-tent">⛺</div><div class="v54-camp-buddies">${state.party.map(m=>`<span title="${displayName(m)}">${POKE[m.id].symbol}</span>`).join('')}</div><div class="v54-ground"></div></div><p>Deine sechs Begleiter entspannen am Lagerfeuer. Spielen stärkt die Freundschaft. Nach 40 weiteren Schritten kannst du erneut mit demselben AuriMon spielen.</p><div class="v54-camp-grid">${team}</div><div class="v54-bottom">${buttons('🥚 Eier & Zucht','v54-eggs')}${buttons('📷 Fotoalbum','v54-album')}${buttons('📸 Erinnerungsfoto','v54-photo')}</div>`,[['Weiterreisen','close','gold']]);
 }
 function care(uid){if(!ready())return;data();const m=state.party.find(p=>p.uid===uid);if(!m)return;
  if(state.steps-(state.v54LastCare[uid]??-10000)<CARE_COOLDOWN)return toast('💗 Erst noch ein bisschen zusammen laufen!');
  state.v54LastCare[uid]=state.steps;bond(m,14);m.hp=Math.min(hpMax(m.id,m.level),m.hp+Math.max(1,Math.round(hpMax(m.id,m.level)*.1)));state.v54PlayCount++;
  save();toast(`💗 ${POKE[m.id].name} freut sich über deine Aufmerksamkeit!`);camp();
 }
 function compatible(a,b){if(!nonLegend(a)||!nonLegend(b)||a.uid===b.uid)return false;
  // Spielintern vereinfachte Zucht: derselbe Entwicklungsstamm oder Ditto mit anderer nichtlegendärer Art.
  return a.id===132&&b.id!==132||b.id===132&&a.id!==132||baseId(a.id)===baseId(b.id);
 }
 function offspring(a,b){const chosen=a.id===132?b:a;return baseId(chosen.id)}
 function eggs(){if(!ready())return;data();const eggs=state.v54Eggs.map((e,i)=>`<div class="v54-egg"><span>🥚</span><div><b>Ei ${i+1}</b><small>Noch ${Math.max(0,EGG_STEPS-e.steps)} Schritte bis zum Schlüpfen</small><div class="v54-friend"><i style="width:${Math.round(100*e.steps/EGG_STEPS)}%"></i></div></div></div>`).join('')||'<p>Noch keine Eier im Rucksack.</p>';
  const a=all().find(m=>m.uid===state.v54Pair);
  const eligible=all().filter(nonLegend);
  const candidates=a?eligible.filter(b=>compatible(a,b)):eligible;
  const desc=a?`Erster Elternteil: <b>${displayName(a)}</b>. Wähle jetzt einen passenden zweiten Elternteil.`:'Wähle ein AuriMon als ersten Elternteil. Möglich sind gleiche Entwicklungsfamilien oder Ditto mit einem anderen AuriMon.';
  const choices=candidates.map(m=>`<button class="v54-parent" data-action="${a?'v54-pair:':'v54-parent:'}${encodeURIComponent(m.uid)}">${POKE[m.id].symbol} ${displayName(m)} · Lv.${m.level}</button>`).join('')||'<p>Keine passenden AuriMon gefunden. Sammle ein zweites kompatibles AuriMon.</p>';
  modal('🥚 AuriMon-Eier',`<p>In deinem Lager können zwei passende AuriMon ein Ei erhalten. Das kostet 180 Münzen. Ein Ei schlüpft nach ${EGG_STEPS} gelaufenen Schritten, auch während der Erkundung.</p><div class="v54-egglist">${eggs}</div><p>${esc(state.v54Eggs.length+'/3 Eierplätze belegt')} · 🪙 ${state.coins} Münzen</p>${state.v54Eggs.length>=MAX_EGGS?'<p>🧺 Dein Eierkorb ist voll.</p>':`<p>${desc}</p><div class="v54-parents">${choices}</div>`}<div class="v54-bottom">${buttons('↩ Auswahl zurücksetzen','v54-pair-reset')}</div>`,[['Zum Lager','v54-camp','gold'],['Schließen','close']]);
 }
 function selectParent(uid){if(!ready())return;data();const m=all().find(m=>m.uid===uid&&nonLegend(m));if(!m)return;state.v54Pair=uid;save();eggs()}
 function pair(uid){if(!ready())return;data();const a=all().find(m=>m.uid===state.v54Pair),b=all().find(m=>m.uid===uid);if(!compatible(a,b)||state.v54Eggs.length>=MAX_EGGS)return toast('🥚 Die AuriMon passen nicht zusammen oder der Eierkorb ist voll.');if(state.coins<180)return toast('🪙 Für ein Ei fehlen 180 Münzen.');
  const id=offspring(a,b);if(!Number.isInteger(id)||id<1||id>143)return toast('🥚 Für dieses AuriMon gibt es kein Ei.');
  state.coins-=180;state.v54Eggs.push({id,steps:0,shiny:Math.random()<1/500,created:Date.now()});state.v54Pair='';save();toast('🥚 Ein AuriMon-Ei wurde ins Lager gelegt!');eggs();
 }
 function hatch(egg){if(!egg||!POKE[egg.id]||egg.id>143)return;
  const m=newMon(egg.id,5);m.shiny=!!egg.shiny;m.friendship=95;
  (state.party.length<6?state.party:state.box).push(m);caught(egg.id);state.v54Hatched++;return m;
 }
 function snap(){const canvas=document.getElementById('hd-map-canvas');const shot=document.createElement('canvas');shot.width=360;shot.height=224;const c=shot.getContext('2d');if(!c)return null;
  c.fillStyle='#10384e';c.fillRect(0,0,360,224);c.imageSmoothingEnabled=false;
  if(canvas&&canvas.width&&canvas.height){const ratio=Math.min(360/canvas.width,185/canvas.height);const w=Math.round(canvas.width*ratio),h=Math.round(canvas.height*ratio);c.drawImage(canvas,Math.round((360-w)/2),Math.round((185-h)/2),w,h)}else{
   c.fillStyle='#396f61';c.fillRect(0,0,360,176);c.fillStyle='#78b868';for(let i=0;i<16;i++)c.fillRect((i*71)%360,(i*33)%170,14,11);
  }
  c.fillStyle='#092b42';c.fillRect(0,184,360,40);c.font='bold 14px monospace';c.fillStyle='#ffffff';c.fillText('📍 '+AREAS[state.zone].name,11,205);c.fillStyle='#ffd36d';c.textAlign='right';c.fillText(new Date().toLocaleDateString('de-DE'),348,205);
  try{return shot.toDataURL('image/jpeg',.66)}catch(e){console.warn('Foto konnte nicht gespeichert werden:',e);return null}
 }
 function photo(){if(!ready()||battle)return;data();const pic=snap();if(!pic)return toast('📷 Kamera ist derzeit nicht verfügbar.');
  state.v54Photos.push({image:pic,zone:state.zone,at:Date.now(),buddy:active()?.id||0});if(state.v54Photos.length>MAX_PHOTOS)state.v54Photos.shift();
  save();toast('📸 Neues Erinnerungsfoto gespeichert!');album();
 }
 function album(){if(!ready())return;data();const photos=[...state.v54Photos].reverse().map((p,i)=>`<article class="v54-photo"><img src="${p.image}" alt="Foto aus ${esc(AREAS[p.zone]?.name||'der Spielwelt')}" loading="lazy"><div><b>${esc(AREAS[p.zone]?.name||'Abenteuer')}</b><small>${new Date(p.at).toLocaleDateString('de-DE')} · ${p.buddy&&POKE[p.buddy]?esc(POKE[p.buddy].name):'AuriMon-Reise'}</small></div></article>`).join('')||'<p>Dein Fotoalbum ist noch leer. Tippe draußen auf „Erinnerungsfoto“, um dein erstes Bild aufzunehmen.</p>';
  modal('📷 AuriMon-Fotoalbum',`<p>${state.v54Photos.length}/${MAX_PHOTOS} Erinnerungsfotos. Ältere Fotos werden ersetzt, wenn das Album voll ist. Bilder bleiben nur in diesem Spielerprofil gespeichert.</p><div class="v54-gallery">${photos}</div><div class="v54-bottom">${buttons('📸 Neues Foto','v54-photo')}</div>`,[['Zum Lager','v54-camp'],['Schließen','close']]);
 }
 const priorWalk=walk;
 walk=function(dx,dy){const current=hasProfile()?window.PokemonProfiles.activeSlot:0;const before=Number(state.steps)||0;
  priorWalk(dx,dy);if(!ready()||current!==window.PokemonProfiles.activeSlot)return;
  data();const steps=Math.max(0,(Number(state.steps)||0)-before);if(!steps)return;
  const hatches=[];
  for(const m of state.party)if(m.friendship<255&&Math.floor(state.steps/24)>Math.floor((state.steps-steps)/24))bond(m,1);
  for(const e of state.v54Eggs)e.steps+=steps;
  state.v54Eggs=state.v54Eggs.filter(e=>{if(e.steps>=EGG_STEPS){const baby=hatch(e);if(baby)hatches.push(POKE[baby.id].name);return false}return true});
  save();if(hatches.length){const notice='🥚 '+hatches.join(', ')+' ist aus einem Ei geschlüpft!';toast(notice);
   // Nicht über einem Kampf oder einem anderen Modalfenster öffnen.
   if(!battle&&!modalOpen)modal('🌟 Ein Ei ist geschlüpft!',notice+' Dein neues AuriMon wartet im Team oder in der Box.',[['Wie schön!','close','gold']]);
  }
 };
 const priorVictory=battleVictory;
 battleVictory=function(){if(battle&&ready()){data();for(const m of state.party)if(m.hp>0)bond(m,4)}return priorVictory()};
 const priorRenderTeam=renderTeam;
 renderTeam=function(){data();priorRenderTeam();[...$('team-list').children].forEach((card,i)=>{const m=state.party[i];if(!m)return;const p=card.querySelector('.poke-desc');if(p){const el=document.createElement('div');el.className='v54-friendline';el.textContent=`💗 Freundschaft: ${m.friendship}/255 · ${mood(m)}`;p.appendChild(el)}})};
 const priorRenderTravel=renderTravel;
 renderTravel=function(){priorRenderTravel();data();const line=document.createElement('section');line.className='v54-travel-card';line.innerHTML=`<h2>🏕️ AuriMon-Lager & Erinnerungen</h2><p>🥚 ${state.v54Hatched} AuriMon geschlüpft · 💗 ${state.v54PlayCount} gemeinsame Spiele · 📷 ${state.v54Photos.length} Fotos</p><div class="v54-bottom">${buttons('🏕️ Lager','v54-camp')}${buttons('🥚 Eier','v54-eggs')}${buttons('📷 Album','v54-album')}</div>`;$('journal')?.appendChild(line)};
 const priorAction=doAction;
 doAction=function(act,el){if(!act)return;
  if(act==='v54-camp')return camp();if(act==='v54-eggs')return eggs();if(act==='v54-album')return album();if(act==='v54-photo')return photo();
  if(act==='v54-pair-reset'){data();state.v54Pair='';save();return eggs()}
  if(act.startsWith('v54-care:'))return care(decodeURIComponent(act.slice(9)));
  if(act.startsWith('v54-parent:'))return selectParent(decodeURIComponent(act.slice(11)));
  if(act.startsWith('v54-pair:'))return pair(decodeURIComponent(act.slice(9)));
  return priorAction(act,el);
 };
 document.querySelector('.v4-shortcuts')?.insertAdjacentHTML('beforeend','<div class="v54-shortcuts"><button type="button" data-action="v54-camp">🏕️ Lager</button><button type="button" data-action="v54-eggs">🥚 Eier</button><button type="button" data-action="v54-album">📷 Fotos</button></div>');
 const priorGuide=showGuide;
 showGuide=function(){priorGuide();$('modal-content')?.insertAdjacentHTML('beforeend','<p>🏕️ 5.4: Im AuriMon-Lager stärkst du die Freundschaft. Paare verwandter AuriMon oder Ditto können Eier erhalten. Nach 120 Schritten schlüpfen sie. Im Fotoalbum speicherst du bis zu 20 Erinnerungsbilder der HD-Pixelwelt.</p>')};
 window.PokemonAdventure54={version:'5.4.0',maxSpecies:151,maxEggs:MAX_EGGS,maxPhotos:MAX_PHOTOS,eggSteps:EGG_STEPS,
  data:()=>{data();return{eggs:state.v54Eggs.map(e=>({id:e.id,steps:e.steps})),photos:state.v54Photos.length,hatched:state.v54Hatched,friendship:state.party.map(m=>({id:m.id,value:m.friendship}))}},camp,album,eggs};
 data();
})();
