#!/usr/bin/env node
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import vm from 'node:vm';
const root='app/src/main/assets';
const files=fs.readdirSync(root).filter(n=>n.endsWith('.js'));
const findings=[];const counts={javascriptFiles:files.length,syntaxErrors:0,missingAssets:0,duplicateScriptIncludes:0,questIds:0,uniqueQuestIds:0,storyChapters:0,worldMaps:0,dungeons:0,regions:0};
function warn(severity,area,message){findings.push({severity,area,message});}
for(const n of files){const c=cp.spawnSync('node',['--check',path.join(root,n)],{encoding:'utf8'});if(c.status!==0){counts.syntaxErrors++;warn('critical','JS syntax',n+': '+(c.stderr||'').slice(0,250));}}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const f of ['src','href']){
 const ex=new RegExp('\\b'+f+'=["\\x27]([^"\\x27]+)["\\x27]','g');
 for(const m of html.matchAll(ex)){const p=m[1];if(/^(https?:|data:|#)/.test(p))continue;
 if(!fs.existsSync(path.join(root,p))){counts.missingAssets++;warn('medium','HTML asset','Referenced file not found: '+p);}}
}
const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(x=>x[1]);const duplicateSources=[...new Set(scripts.filter((s,i)=>scripts.indexOf(s)!==i))];counts.duplicateScriptIncludes=duplicateSources.length;
for(const n of duplicateSources)warn('high','HTML','Script loaded more than once: '+n);
const qtext=fs.readFileSync(path.join(root,'arimons_0_5_2.js'),'utf8');
const questIds=[...qtext.matchAll(/\{id:'([^']+)',\s*zone:(\d+)/g)].map(m=>({id:m[1],zone:Number(m[2])}));
counts.questIds=questIds.length;counts.uniqueQuestIds=new Set(questIds.map(x=>x.id)).size;
for(const q of questIds)if(q.zone>=40)warn('high','Secret quest',q.id+' points outside 40 regions');
for(const q of questIds)if(questIds.filter(p=>p.id===q.id).length>1)warn('high','Quest','Duplicate ID '+q.id);
const v52=fs.readFileSync(path.join(root,'v5_2.js'),'utf8');
const rival=v52.match(/const RIVAL_ZONES=\[([^\]]+)\]/);const rivalZones=rival?rival[1].split(',').map(Number):[];
for(const z of rivalZones)if(z>=10)warn('high','Rival','Rival encounter uses retired region '+z);
const tournament=[...v52.matchAll(/\{name:'([^']+)',min:(\d+),icon:[^,]+,zone:(\d+)/g)];
for(const t of tournament){if(+t[2]>40)warn('high','Tournament',t[1]+' needs more badges than the current 40');
 if(+t[3]>=40)warn('high','Tournament',t[1]+' references unreachable zone '+t[3]);}
const v53=fs.readFileSync(path.join(root,'v5_3.js'),'utf8');
function listLen(name){const m=v53.match(new RegExp('\\b'+name+'=\\[([^\\]]+)\\]'));return m?m[1].split(',').length:0;}
const teamLen=listLen('TEAM_ZONES'),ruinLen=listLen('RUIN_ZONES');
const teamNames=[...v53.matchAll(/\['([^']+)','Das Schatten-Team/g)];
if(teamLen!==5)warn('high','Shadow storyline','Five chapter narrative expects 5 commanders; actual accessible TEAM_ZONES='+teamLen);
if(ruinLen!==7)warn('medium','Ruins','Quest interface announces 7 ruins, but RUIN_ZONES has '+ruinLen);
const story=fs.readFileSync(path.join(root,'auri_1_3_12_story_shop.js'),'utf8');
const chapters=story.slice(story.indexOf('const chapters = ['),story.indexOf('];',story.indexOf('const chapters = [')));
const chapterTitles=[...chapters.matchAll(/^\s*\['([^']+)'/gm)].map(m=>m[1]);
counts.storyChapters=chapterTitles.length;
if(new Set(chapterTitles).size!==chapterTitles.length)warn('high','Story','Duplicate chapter title');
if(chapterTitles.length!==10)warn('high','Story','Expected 10 chapter titles but found '+chapterTitles.length);
if(/zone\s*>=\s*14/.test(qtext))warn('medium','Legacy coordinates','Hidden quest search uses the old 14-cell width; new maps are 20 cells wide. Gameplay interaction needs manual testing.');
const code=fs.readFileSync(path.join(root,'aurimon_world50_pilot.js'),'utf8');
const ELEMENT_TYPES=['Normal','Feuer','Wasser','Pflanze','Elektro','Eis','Kampf','Gift','Boden','Flug','Psycho','Käfer','Gestein','Geist','Drache','Unlicht','Stahl','Fee'];
const ctx={ELEMENT_TYPES,window:{PokemonGame:{},PokemonProfiles:{activeSlot:1},addEventListener(){}},document:{createElement:()=>({setAttribute(){},getContext:()=>({scale(){}})}),addEventListener(){}},state:{starterChosen:true,zone:0,x:9,y:9,aurWorld50:{stage:0,completed:[],runestones:[]}},AREAS:[{"leader":"Lina","badge":"Wiesenorden"},{"leader":"Finn","badge":"Seeorden"},{"leader":"Rika","badge":"Felsorden"},{"leader":"Elly","badge":"Blütenorden"},{"leader":"Noah","badge":"Küstenorden"},{"leader":"Mia","badge":"Waldorden"},{"leader":"Leon","badge":"Dorforden"},{"leader":"Ada","badge":"Kristallorden"},{"leader":"Bruno","badge":"Flammenorden"},{"leader":"Champion Nova","badge":"Wolkenorden"}]};
while(ctx.AREAS.length<40)ctx.AREAS.push({leader:'Kristallwächter '+ctx.AREAS.length,badge:'Kristallsiegel '+ctx.AREAS.length});
for(const n of ['renderMap','walk','interact','trainerParty','randomWild','gymParty','enterZone','battleDefeat','atPosition','trainers','drops','render','doAction','requestAnimationFrame'])ctx[n]=()=>{};
try{vm.runInNewContext(code,vm.createContext(ctx),{filename:'aurimon_world50_pilot.js',timeout:4000});
 const api=ctx.window.PokemonGame.world50;counts.worldMaps=api.names.length;counts.regions=40;
 if(api.names.length!==200)warn('critical','World','Not exactly 200 maps');
 const checked=api.validate();
 for(const row of checked)if(!row.reachable)warn('critical','World','Missing reachable objects on level '+row.stage);
 const mapFingerprints=new Map();counts.duplicateLayouts=0;
 for(let i=0;i<200;i++){
  const grid=api.getMap(i);if(grid.length!==12||grid.some(r=>r.length!==20))warn('critical','World','Invalid dimensions on '+(i+1));
  const fingerprint=grid.map(row=>row.join('')).join('|');
  if(mapFingerprints.has(fingerprint)){counts.duplicateLayouts++;warn('medium','Map duplicates','Level '+(i+1)+' has exactly the same tile layout as level '+(mapFingerprints.get(fingerprint)+1));}
  else mapFingerprints.set(fingerprint,i);
  if(i%5===3){counts.dungeons++;if(grid.flat().filter(t=>t==='R').length!==3||grid[6][17]!=='G')warn('critical','Dungeons','Rune/gate mismatch at '+(i+1));}
 }
}catch(e){warn('critical','World runtime',String(e));}
const hard=findings.filter(x=>x.severity==='critical');
const out={version:'1.5.1',counts,findings,hardFailures:hard.length,passedStructuralChecks:hard.length===0,limits:['Source-level and simulated map checks are not a full hands-on playthrough of every quest.','Android install and save migration are not tested by this browser package.']};
fs.mkdirSync('browser-dist',{recursive:true});
fs.writeFileSync('browser-dist/PRUEFBERICHT.json',JSON.stringify(out,null,2));
let md='# AuriMon v'+out.version+' – Browser- und Inhaltsprüfung\n\n';
md+='**Ergebnis:** '+(hard.length?'kritische Strukturfehler vorhanden':'Technische Grundstruktur bestanden')+'. In diesem Bericht markierte Aufgabenfehler sind noch NICHT als repariert bestätigt.\n\n';
md+='Geprüft: '+counts.javascriptFiles+' JavaScript-Dateien, '+counts.worldMaps+' Karten, '+counts.dungeons+' Dungeons, '+counts.questIds+' geheime Quest-IDs, '+counts.storyChapters+' Hauptgeschichten-Kapitel, referenzierte HTML-Dateien.\n\n';
md+='## Auffälligkeiten\n\n';
for(const f of findings)md+='- **'+f.severity.toUpperCase()+'** · '+f.area+': '+f.message+'\n';
md+='\n## Grenzen\n\n- Kein vollständiger manueller Quest-Durchlauf über alle Spielerprofile.\n- Keine Prüfung der Android-Installation; diese Browser-Dateien ersetzen keine APK.\n- Alte Regionszuordnungen wurden statisch geprüft; der vollständige Questverlauf muss zusätzlich gespielt werden.\n';
fs.writeFileSync('browser-dist/PRUEFBERICHT.md',md);
console.log(md);
if(hard.length)process.exit(2);
