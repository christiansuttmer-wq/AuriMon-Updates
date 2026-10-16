/* AuriMon World50 | Sonnenwiese 1–5 + Mondsee 6–10 — connected world pilot.
 * Version/build.gradle, all existing game species, slot IDs, and storage keys unchanged.
 * A single authored grid drives collision, painting, pickups, entrances and exits.
 */
'use strict';
(() => {
 const W=20,H=12,T=48;
 const TITLES=['Starterdorf','Blumenlichtung','Bachpfad','Wurzelruine','Sonnenarena','Seedorf','Schilfufer','Holzsteginseln','Versunkene Bibliothek','Mondarena'];
 const DESCS=['Professorin Mira erwartet dich im Dorf.','Über die Lichtung führt ein Weg zum Bach.','Zwei Holzbrücken queren das Wasser.','Aktiviere drei Wurzelrunen.','Bestehe Linas erste Arenaprüfung.','Lerne die Fischer des Mondsees kennen.','Im Schilf verstecken sich seltene Pokémon.','Folge den Stegen über das tiefblaue Wasser.','Aktiviere die Flutrunen in der Reihenfolge West, Mitte, Ost.','Finn erwartet dich zur zweiten Arenaprüfung.'];

 const REGIONS=['Sonnenwiese','Mondsee','Felsenwald','Blumenpfad','Windküste','Bernsteinwald','Flüsterdorf','Kristallsee','Vulkanpass','Wolkenhöhe'];
 const REGION_PALETTES=[['#94cf83','#72b875'],['#80c5a0','#5da08e'],['#84b7a1','#578d7b'],['#b5d88a','#8ebf83'],['#c1d8a1','#a2c48e'],['#e5b477','#b97d50'],['#828d9b','#626f87'],['#87bed2','#5e99b7'],['#9a897a','#6b6160'],['#cbd9cf','#a0bfca']];
 TITLES.push(...["Tannenlager","Steinsteig","Wasserfallbrücke","Bergwerksstollen","Gipfelarena","Blütendorf","Wildblumenfelder","Windmühlenwiese","Gewächshauslabyrinth","Blütenarena","Küstenhafen","Brandungsstrand","Leuchtturmklippen","Schmugglergrotten","Sturmarena","Herbstlichtung","Pilzwald","Baumkronenstege","Bernsteintempel","Waldarena","Nebelmarkt","Verlassene Gassen","Geisterbrunnen","Schattenkatakomben","Schattenarena","Kristallhafen","Schimmerufer","Frostfallpass","Resonanzgrotte","Kristallarena","Aschefeste","Glutpfad","Basaltbrücken","Magmakern","Flammenarena","Himmelstor","Wolkenstege","Sternenplateau","Himmelstempel","Kronenarena"]);
 DESCS.push(...["Raste vor dem felsigen Aufstieg.","Folge dem schmalen Gebirgspfad.","Überquere die Wasserfallstege.","Entschlüssele die Zeichen des Bergwerks.","Rika wartet auf dem Gipfel.","Das Dorf bereitet ein Blütenfest vor.","Suche Pokémon in den Blumen.","Folge den Windmühlen und Geheimpfaden.","Öffne das verwachsene Gewächshaus.","Ellys Blütenprüfung wartet.","Besuche Händler im Hafen.","Weiche Wellen und Sandbänken aus.","Erreiche den Leuchtturm.","Finde die verschlossenen Schmugglergänge.","Noah fordert dich im Sturm heraus.","Das Laub funkelt golden.","Zwischen den Pilzen liegen Geheimnisse.","Erkunde die Baumkronenstege.","Drei Zeichen wecken den Tempel.","Mia bewacht den Waldorden.","Auf dem Nebelmarkt kursieren Gerüchte.","Schatten verstecken sich in den Gassen.","Finde die Hinweise am Geisterbrunnen.","Entschlüssele Team Schattens Katakomben.","Leons Schattenprüfung wartet.","Kristalle beleuchten das Dorf.","Spiegelungen weisen verborgene Wege.","Eis und Felsen versperren den Pass.","Aktiviere die Resonanzkristalle.","Ada erwartet dich.","In der Aschefeste wird es heiß.","Entkomme den Glutfeldern.","Überquere die Basaltbrücken.","Finde den Weg durch den Magmakern.","Bruno erwartet dich.","Ein Tor führt über die Wolken.","Folge den Wolkenstegen.","Auf dem Plateau warten Rivalen.","Löse die letzten Himmelszeichen.","Champion Nova wartet im Finale."]);
 const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
 const clampStage=s=>Math.max(0,Math.min(49,Number(s)||0));
 const mapKey=(x,y)=>x+','+y;
 const rnd=(x,y,k=0)=>{let a=Math.imul(x+117,374761393)^Math.imul(y+79,668265263)^Math.imul(k+7,1274126177);a=Math.imul(a^(a>>>13),2246822519);return ((a^(a>>>15))>>>0)/4294967295};
 const GRID=()=>Array.from({length:H},()=>Array(W).fill('g'));
 const ROW=(a,y,x0,x1,t)=>{for(let x=x0;x<=x1;x++)a[y][x]=t};
 const COL=(a,x,y0,y1,t)=>{for(let y=y0;y<=y1;y++)a[y][x]=t};
 const BLOCK=(a,x0,y0,x1,y1,t)=>{for(let y=y0;y<=y1;y++)ROW(a,y,x0,x1,t)};
 const finish=(g,extras)=>({g,extras});
 const maps=[];
 function buildMaps(){
  // Draw the whole terrain BEFORE objects: no decorative image masks walkable geometry.
  for(let s=0;s<50;s++){
   const g=GRID();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||y===0||x===W-1||y===H-1)g[y][x]=(s%5===3?'#':'t');
   for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const n=rnd(x,y,20+s*71);if(n>.89)g[y][x]='t';else if(n>.70)g[y][x]='w'}
   const extras={buildings:[],npcs:[],loot:[],runes:[],gate:null,exit:[19,6],entry:[1,6],decor:[]};
   if(s===0){
    ROW(g,5,1,19,'p');COL(g,9,5,10,'p');ROW(g,8,4,15,'p');COL(g,3,4,8,'p');COL(g,15,4,8,'p');
    const buildings=[['center',2,2,'AuriCenter'],['market',8,2,'AuriMarkt'],['house',14,2,'Professorin Mira']];
    for(const [kind,x,y,name] of buildings){BLOCK(g,x,y,x+2,y+1,'b');g[y+2][x+1]='p';COL(g,x+1,y+2,5,'p');extras.buildings.push({kind,x,y,w:3,h:2,door:[x+1,y+1],step:[x+1,y+2],name})}
    extras.npcs=[{x:7,y:8,name:'Professorin Mira',kind:'guide'},{x:16,y:8,name:'Trainer Ben',kind:'trainer',j:0}];
    extras.loot=[{x:12,y:8,id:'0:50',item:'potion'}];extras.entry=[9,9];
   }else if(s===1){
    ROW(g,6,0,19,'p');COL(g,5,3,8,'p');ROW(g,3,3,14,'p');COL(g,14,3,8,'p');ROW(g,8,4,16,'p');
    extras.npcs=[{x:6,y:5,name:'Maja',kind:'trainer',j:10},{x:15,y:7,name:'Kim',kind:'trainer',j:11}];
    extras.loot=[{x:12,y:3,id:'1:50',item:'ball'}];
   }else if(s===2){
    BLOCK(g,8,1,10,10,'~');ROW(g,6,0,19,'p');ROW(g,9,7,12,'=' );ROW(g,6,8,10,'=');
    COL(g,5,4,9,'p');COL(g,15,3,9,'p');ROW(g,4,4,15,'p');ROW(g,9,4,16,'p');
    extras.npcs=[{x:6,y:5,name:'Sami',kind:'trainer',j:20},{x:14,y:8,name:'Tess',kind:'trainer',j:21}];
    extras.loot=[{x:17,y:9,id:'2:50',item:'greatball'}];
   }else if(s===3){
    BLOCK(g,1,1,18,10,'s');ROW(g,6,0,19,'p');
    // Three separated chambers, each reachable from main corridor.
    ROW(g,2,2,6,'#');ROW(g,2,13,17,'#');ROW(g,9,2,7,'#');ROW(g,9,12,17,'#');
    COL(g,7,1,4,'#');COL(g,12,7,10,'#');
    g[2][4]='s';g[2][15]='s';g[9][5]='s';g[9][15]='s';
    COL(g,4,3,6,'s');COL(g,15,3,6,'s');COL(g,10,6,9,'s');
    ROW(g,3,3,6,'s');ROW(g,3,13,16,'s');ROW(g,8,8,11,'s');
    extras.runes=[{x:4,y:3,id:'run:4:3'},{x:10,y:8,id:'run:10:8'},{x:15,y:3,id:'run:15:3'}];
    // Solid ancient wall from north to south. Only the magical middle gate opens after all three runes.
    // Without this the player could walk around the locked gate via rows 5/7.
    COL(g,17,1,10,'#');
    extras.gate={x:17,y:6};g[6][17]='G';
    extras.npcs=[{x:8,y:6,name:'Wurzelwächter',kind:'trainer',j:30}];
    extras.loot=[{x:16,y:8,id:'3:50',item:'candy'}];
   }else if(s===4){
    ROW(g,6,0,19,'p');ROW(g,5,2,17,'p');ROW(g,8,3,16,'p');COL(g,15,4,8,'p');COL(g,4,4,9,'p');
    BLOCK(g,13,2,17,3,'a');g[4][15]='p';
    extras.buildings=[{kind:'gym',x:13,y:2,w:5,h:2,door:[15,3],step:[15,4],name:'Sonnenarena'}];
    extras.npcs=[{x:10,y:8,name:'Arenatrainer Nia',kind:'trainer',j:40},{x:4,y:5,name:'Sanitäterin',kind:'heal'}];
    extras.loot=[{x:6,y:8,id:'4:50',item:'revive'}];
   }else if(s===5){
    ROW(g,6,0,19,'p');ROW(g,8,2,17,'p');ROW(g,4,3,16,'p');
    COL(g,6,3,9,'p');COL(g,12,3,9,'p');
    BLOCK(g,1,1,2,4,'~');BLOCK(g,17,1,18,4,'~');
    for(const [kind,x,y,name] of [['center',4,1,'Mondsee-AuriCenter'],['market',10,1,'Hafenladen'],['house',15,1,'Fischerhaus']]){
     BLOCK(g,x,y,x+2,y+1,'b');g[y+2][x+1]='p';extras.buildings.push({kind,x,y,w:3,h:2,door:[x+1,y+1],step:[x+1,y+2],name});
    }
    extras.npcs=[{x:9,y:8,name:'Fischerin Mira',kind:'guide'},{x:14,y:6,name:'Luis',kind:'trainer',j:60},{x:3,y:8,name:'Sanitäter',kind:'heal'}];
    extras.loot=[{x:8,y:4,id:'5:50',item:'potion'}];extras.entry=[1,6];
   }else if(s===6){
    BLOCK(g,5,1,7,10,'~');BLOCK(g,12,1,14,10,'~');
    ROW(g,6,0,19,'p');ROW(g,6,5,7,'=');ROW(g,6,12,14,'=');
    ROW(g,3,1,4,'p');ROW(g,3,8,11,'p');ROW(g,3,15,18,'p');
    ROW(g,9,1,4,'p');ROW(g,9,8,11,'p');ROW(g,9,15,18,'p');
    COL(g,3,3,9,'p');COL(g,9,3,9,'p');COL(g,16,3,9,'p');
    extras.npcs=[{x:9,y:3,name:'Schilf-Sammler',kind:'trainer',j:61},{x:16,y:9,name:'Anglerin Isa',kind:'trainer',j:62}];
    extras.loot=[{x:9,y:9,id:'6:50',item:'greatball'}];
   }else if(s===7){
    BLOCK(g,4,1,6,10,'~');BLOCK(g,10,1,12,10,'~');BLOCK(g,16,1,18,10,'~');
    ROW(g,6,0,19,'p');for(const [a,b] of [[4,6],[10,12],[16,18]])ROW(g,6,a,b,'=');
    ROW(g,3,1,3,'p');ROW(g,9,1,3,'p');COL(g,2,3,9,'p');
    ROW(g,3,7,9,'p');ROW(g,9,7,9,'p');COL(g,8,3,9,'p');
    ROW(g,3,13,15,'p');ROW(g,9,13,15,'p');COL(g,14,3,9,'p');
    ROW(g,9,4,6,'L');ROW(g,9,10,12,'L');
    extras.npcs=[{x:8,y:3,name:'Steg-Wächter',kind:'trainer',j:63},{x:14,y:9,name:'Nebel-Forscher',kind:'trainer',j:64}];
    extras.loot=[{x:2,y:3,id:'7:50',item:'revive'},{x:14,y:3,id:'7:51',item:'greatball'}];
   }else if(s===8){
    BLOCK(g,1,1,18,10,'s');ROW(g,6,0,19,'p');
    BLOCK(g,3,2,6,4,'~');BLOCK(g,9,7,12,9,'~');BLOCK(g,13,2,16,4,'~');
    ROW(g,3,4,6,'L');ROW(g,8,10,11,'L');ROW(g,3,13,15,'L');
    ROW(g,5,2,16,'s');ROW(g,7,2,16,'s');
    for(const [x,y] of [[4,3],[10,8],[15,3]])g[y][x]='R';
    extras.runes=[{x:4,y:3,id:'tide:4:3'},{x:10,y:8,id:'tide:10:8'},{x:15,y:3,id:'tide:15:3'}];
    COL(g,17,1,10,'#');g[6][17]='G';extras.gate={x:17,y:6};
    extras.npcs=[{x:9,y:5,name:'Bibliothekswächter',kind:'trainer',j:65}];
    extras.loot=[{x:13,y:7,id:'8:50',item:'candy'}];
   }else if(s===9){
    ROW(g,6,0,19,'p');ROW(g,5,2,17,'p');ROW(g,8,2,17,'p');
    COL(g,5,4,9,'p');COL(g,13,4,9,'p');
    BLOCK(g,12,2,16,3,'a');g[4][14]='p';
    extras.buildings=[{kind:'gym',x:12,y:2,w:5,h:2,door:[14,3],step:[14,4],name:'Mondarena'}];
    BLOCK(g,2,2,3,4,'~');BLOCK(g,17,2,18,4,'~');
    extras.npcs=[{x:8,y:8,name:'Arenatrainer Kian',kind:'trainer',j:66},{x:5,y:5,name:'Sanitäterin',kind:'heal'}];
    extras.loot=[{x:15,y:8,id:'9:50',item:'superpotion'}];
   }else if(s>=10){
    const z=Math.floor(s/5),k=s%5,terrain=z===2||z===6?'#':z===4||z===7||z===8||z===9?'~':'t';
    // Shared tiles drive terrain, collisions, buildings, pickups and path-finding.
    ROW(g,6,0,19,'p');ROW(g,3,1,18,'p');ROW(g,9,1,18,'p');
    COL(g,4,3,9,'p');COL(g,11,3,9,'p');COL(g,16,3,9,'p');
    if(k===0){
     BLOCK(g,1,1,2,3,z===8?'#':'~');BLOCK(g,17,1,18,3,z===2?'#':'~');
     for(const [kind,x,y,label] of [['center',4,1,'AuriCenter '+REGIONS[z]],['market',11,1,'Markt '+REGIONS[z]]]){
      BLOCK(g,x,y,x+2,y+1,'b');g[3][x+1]='p';
      extras.buildings.push({kind,x,y,w:3,h:2,door:[x+1,2],step:[x+1,3],name:label});
     }
     BLOCK(g,15,1,17,2,'b');g[3][16]='p';
     extras.buildings.push({kind:'atelier',x:15,y:1,w:3,h:2,door:[16,2],step:[16,3],name:'Fossilienwerkstatt'});
     extras.npcs=[{x:8,y:8,name:'Reiseführerin',kind:'guide'},{x:5,y:9,name:'Sanitäterin',kind:'heal'},{x:14,y:6,name:'Trainer '+REGIONS[z],kind:'trainer',j:s*10}];
     extras.loot=[{x:16,y:9,id:s+':treasure',item:'potion'}];
    }else if(k===1||k===2){
     const left=k===1?7:10,right=left+2;
     BLOCK(g,left,1,right,10,terrain);
     for(const y of [3,6,9])ROW(g,y,left,right,terrain==='~'?'=':'p');
     if(k===2){COL(g,3,2,9,'p');ROW(g,2,2,5,'p');ROW(g,8,12,17,'p');}
     extras.npcs=[{x:5,y:3,name:'Wegtrainer '+(s+1),kind:'trainer',j:s*10+1},{x:15,y:9,name:'Pfadwächter '+(s+1),kind:'trainer',j:s*10+2}];
     extras.loot=[{x:15,y:3,id:s+':chest',item:k===1?'greatball':'revive'}];
    }else if(k===3){
     BLOCK(g,1,1,18,10,'s');COL(g,7,1,4,'#');COL(g,12,8,10,'#');
     ROW(g,6,0,19,'p');COL(g,4,3,6,'s');COL(g,10,6,8,'s');COL(g,15,3,6,'s');
     ROW(g,3,3,16,'s');ROW(g,8,8,16,'s');
     for(const [x,y] of [[2,2],[3,2],[13,9],[14,9],[1+z%5,10],[13+z%3,1]])g[y][x]=terrain;
     // Each temple has a different nave, wall shape and safe paths.
     const west=3+z%3,middle=9+z%2,east=14+z%3;
     ROW(g,3,west,6,'s');ROW(g,8,9,16,'s');
     g[1][3+z%6]='#';g[10][8+z%7]='#';
     if(z%3===0){g[2][9]='~';g[9][3]='#'}
     else if(z%3===1){g[2][14]='~';g[9][6]='#'}
     else{g[2][3]='~';g[9][14]='#'}
     extras.runes=[{x:west,y:3,id:'rune:'+s+':west'},{x:middle,y:8,id:'rune:'+s+':middle'},{x:east,y:3,id:'rune:'+s+':east'}];
     extras.runeOrder=(z%2===0?[0,1,2]:[2,1,0]).map(i=>extras.runes[i].id);
     COL(g,17,1,10,'#');g[6][17]='G';extras.gate={x:17,y:6};
     extras.npcs=[{x:8,y:5,name:'Runenforscher',kind:'guide'},{x:13,y:7,name:'Tempelwächter',kind:'trainer',j:s*10+3}];
     extras.loot=[{x:15,y:8,id:s+':relic',item:'candy'}];
    }else{
     BLOCK(g,12,2,16,3,'a');g[4][14]='p';
     extras.buildings=[{kind:'gym',x:12,y:2,w:5,h:2,door:[14,3],step:[14,4],name:TITLES[s]}];
     extras.npcs=[{x:8,y:8,name:'Arenatrainer '+REGIONS[z],kind:'trainer',j:s*10+4},{x:5,y:5,name:'Sanitäterin',kind:'heal'}];
     extras.loot=[{x:15,y:9,id:s+':reward',item:'superpotion'}];
    }
   }
   // World encounters are mapped onto visible NPCs; no invisible legacy coordinates.
   const zone=Math.floor(s/5),first=s%5===0;
   if(first){
    if([0,2,4,6,8,9].includes(zone))extras.npcs.push({x:8,y:6,kind:'rival',name:'Alex, dein Rivale'});
    if([3,5,7,8,9].includes(zone))extras.npcs.push({x:13,y:8,kind:'shadow',name:'Schatten-Späher'});
    if([7,8,9].includes(zone))extras.npcs.push({x:11,y:9,kind:'temple',name:'Legendenforscher'});
    extras.npcs.push({x:9,y:s===5?9:8,kind:'side',name:'Auftraggeber'});
    extras.npcs.push({x:10,y:5,kind:'runeA',name:'Erster Ortsrunenstein'});
    extras.npcs.push({x:15,y:8,kind:'runeB',name:'Zweiter Ortsrunenstein'});
    extras.npcs.push({x:3,y:s===5?7:8,kind:'cache',name:'Verschlossene Truhe'});
   }
   if(s>=10&&s%5===3&&[2,3,4,5,6,8,9].includes(zone))extras.npcs.push({x:5,y:5,kind:'ruin',name:'Runenwächter'});
   if(s%5===2&&[2,3,4,5,6,8,9].includes(zone))extras.npcs.push({x:8,y:5,kind:'cave',name:'Geheimhöhle'});
   // All authored interactives take precedence over random decorations.
   for(const n of extras.npcs)g[n.y][n.x]=s%5===3?'s':'p';
   for(const l of extras.loot)g[l.y][l.x]=(s%5===3)?'s':'p';
   for(const r of extras.runes)g[r.y][r.x]='R';
   g[6][0]=s===0?'t':'E';g[6][19]='E';
   for(let x=1;x<19;x++){g[6][x]=g[6][x]==='G'?'G':g[6][x]==='R'?'R':g[6][x]==='#'?'s':g[6][x]==='~'?'=':'p'}
   maps.push(finish(g,extras));
  }
 }
 buildMaps();
 const passable=t=>!['t','#','b','a','~','G'].includes(t);
 const profileActive=()=>Number.isInteger(window.PokemonProfiles?.activeSlot)&&window.PokemonProfiles.activeSlot>=1;
 function ensure(){
  if(!state||!state.starterChosen||!profileActive())return null;
  if(!state.aurWorld50||!Number.isInteger(state.aurWorld50.stage)){
   // The existing save is kept; only a new, namespaced optional field is added.
   const legacyX=state.x,legacyY=state.y;
   state.aurWorld50={stage:0,runestones:[],completed:[],legacyPosition:[legacyX,legacyY],introduced:false};
   state.x=maps[0].extras.entry[0];state.y=maps[0].extras.entry[1];state.facing='up';
  }
  const w=state.aurWorld50;w.stage=clampStage(w.stage);
  // Keep every profile's existing collection, badges and rune state.
  if(state.zone>=0&&state.zone<10&&Math.floor(w.stage/5)!==state.zone){w.stage=state.zone*5;state.x=1;state.y=6;}
  if(!Array.isArray(w.runestones))w.runestones=[];
  if(!Array.isArray(w.completed))w.completed=[];
  if(!Number.isInteger(state.x)||!Number.isInteger(state.y)||!(passable(maps[w.stage].g[state.y]?.[state.x]||'t')||(maps[w.stage].g[state.y]?.[state.x]==='G'&&maps[w.stage].extras.runes.every(r=>w.runestones.includes(r.id))))){
   const pos=maps[w.stage].extras.entry;state.x=pos[0];state.y=pos[1];
  }
  return w;
 }
 const active=()=>Number.isInteger(state?.zone)&&state.zone>=0&&state.zone<10&&!state?.dungeon&&!state?.v51Indoor&&state?.starterChosen&&profileActive();
 const data=()=>maps[clampStage(state.aurWorld50?.stage)];
 const tile=(x,y)=>data().g[y]?.[x]??'#';
 const npc=(x,y)=>data().extras.npcs.find(n=>n.x===x&&n.y===y);
 const loot=(x,y)=>data().extras.loot.find(n=>n.x===x&&n.y===y&&!state.found.includes('aur50:'+n.id));
 const rune=(x,y)=>data().extras.runes.find(n=>n.x===x&&n.y===y);
 const buildingAt=(x,y)=>data().extras.buildings.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h);
 const safe=(x,y)=>x>=0&&x<W&&y>=0&&y<H;
 const oldRender=renderMap,oldWalk=walk,oldInteract=interact,oldTrainerParty=trainerParty,oldRandomWild=randomWild,oldGymParty=gymParty,oldEnterZone=enterZone,oldDefeat=battleDefeat;
 const canvas=document.createElement('canvas');canvas.id='aur50-map-canvas';canvas.width=W*T*1.5;canvas.height=H*T*1.5;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Spielbare AuriMon-Welt mit zehn Regionen und fünfzig Abschnitten');
 const c=canvas.getContext('2d',{alpha:false});c.scale(1.5,1.5);
 // Existing AuriMon character SVGs, not fabricated character placeholders.
 const people={};
 const npcSprites={guide:'researcher_girl_0_down.svg',trainer:'scout_boy_0_down.svg',heal:'medic_girl_0_down.svg'};
 function imageFor(name){if(!name||typeof Image==='undefined')return null;
  if(!people[name]){const img=new Image();people[name]=img;img.onload=()=>{if(active()&&canvas.isConnected)draw()};img.onerror=()=>{people[name]=null};img.src='ari_sprites/'+name;}
  return people[name]?.complete && people[name]?.naturalWidth>0?people[name]:null;
 }
 function paintPerson(name,x,y,w,h){const im=imageFor(name);if(!im)return false;c.drawImage(im,x,y,w,h);return true;}
 const fill=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
 const ellipse=(x,y,rx,ry,col,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();c.restore()};
 function rounded(x,y,w,h,r,col,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=col;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
 function polygon(pts,color){c.fillStyle=color;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill()}
 function flower(x,y,petals='#fff1d0',size=3.2){
  c.strokeStyle='#356d4a';c.lineWidth=1.25;c.beginPath();c.moveTo(x,y+5);c.lineTo(x-1,y);c.stroke();
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*size*.85,y+Math.sin(a)*size*.85,size*.55,size*.6,petals)}
  ellipse(x,y,1.9,1.9,'#f7b751');
 }
 function grassTuft(x,y,size=1){
  c.strokeStyle='#4f9859';c.lineWidth=1.3*size;c.lineCap='round';c.beginPath();c.moveTo(x-4*size,y+3*size);c.quadraticCurveTo(x-5*size,y-4*size,x-7*size,y-6*size);
  c.moveTo(x,y+3*size);c.lineTo(x,y-8*size);c.moveTo(x+4*size,y+3*size);c.quadraticCurveTo(x+5*size,y-3*size,x+7*size,y-5*size);c.stroke();
 }
 function sign(x,y,label,accent){
  ellipse(x+22,y+45,24,5,'#1f573f',.24);
  rounded(x+18,y+10,7,33,2,'#895f3d','#bd915a');
  rounded(x-7,y+3,55,25,5,'#805b40','#e4bb74');
  rounded(x-3,y+6,47,19,4,'#e3c592','#fff2cc');
  c.save();c.fillStyle=accent||'#50605e';c.font='bold 10px system-ui';c.textAlign='center';c.fillText(label,x+21,y+19);c.restore();
 }
 function lamp(x,y,tick){
  ellipse(x+24,y+43,13,4,'#275940',.25);
  rounded(x+22,y+12,5,30,2,'#68503d','#2b403d');
  rounded(x+15,y+6,19,16,5,'#5b4b49','#e6cf89');
  rounded(x+18,y+9,13,11,3,'#ffe5a1');
  polygon([[x+13,y+7],[x+24,y],[x+36,y+7]],'#2c5963');
  const glow=c.createRadialGradient(x+24,y+14,1,x+24,y+14,26);
  glow.addColorStop(0,'rgba(255,231,125,.25)');glow.addColorStop(1,'rgba(255,236,149,0)');ellipse(x+24,y+16,27,27,glow);
 }
 function flowerbed(x,y,wx,wy){
  ellipse(x+24,y+38,25,9,'#315b42',.2);
  for(let i=0;i<5;i++){const px=x+9+(i%3)*15+(rnd(wx,wy,i+191)-.5)*4, py=y+23+Math.floor(i/3)*13;
   ellipse(px,py+4,12,7,['#4e955a','#68b76a','#387d55'][i%3]);flower(px,py,i%2?'#ffc8df':'#fff1ce',3.2)}
 }
 function fence(x,y){
  for(let dx=3;dx<=40;dx+=17){rounded(x+dx,y+15,7,27,2,'#ad7147','#694733');polygon([[x+dx-1,y+15],[x+dx+3.5,y+9],[x+dx+8,y+15]],'#dca269')}
  rounded(x+3,y+21,43,5,2,'#c68b54','#815534');rounded(x+3,y+31,43,5,2,'#b47b50','#815534');
 }
 function flags(x,y,color){
  rounded(x+7,y+4,4,38,2,'#b78a58');polygon([[x+11,y+5],[x+36,y+9],[x+11,y+22]],color);
 }
 function grass(x,y,wx,wy,s,tick){
  const n=rnd(wx,wy,s*11), g=c.createLinearGradient(x,y,x+T,y+T);
  if((s%5===3)){g.addColorStop(0,s===8?'#748493':'#837f79');g.addColorStop(1,s===8?'#9caab6':'#a6a398')}
  else{const pal=REGION_PALETTES[Math.floor(s/5)]||REGION_PALETTES[0];g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1])}
  fill(x,y,T,T,g);
  if(s%5===3){for(let k=0;k<3;k++){const px=x+7+k*15,py=y+8+((wx+k*7+wy)%3)*11;fill(px,py,10,2,'#c6bba1')}return}
  // Tiny gradients of grass and flowering meadow create continuous organic field.
  for(let k=0;k<5;k++){const xx=x+6+rnd(wx,wy,k+23)*36,yy=y+5+rnd(wx,wy,k+71)*37;
   c.strokeStyle=k%2?'#b8df8a':'#559e66';c.lineWidth=1.2;c.beginPath();c.moveTo(xx,yy+4);c.lineTo(xx+2,yy-3);c.stroke();
   if(k%3===0&&rnd(wx,wy,100+k+s)>.52){const pet=['#fff5dc','#e9c3e0','#f4d676','#c5e4fa'][Math.floor(rnd(wx,wy,199+k)*4)];
    ellipse(xx,yy-4,3.2,3.2,pet);ellipse(xx,yy-4,1.4,1.4,'#eab95d');}
  }
  if(rnd(wx,wy,s*129+4)>.73){grassTuft(x+16+rnd(wx,wy,12)*22,y+21+rnd(wx,wy,15)*21,.6)}
 } 
 function path(x,y,t,s,wx,wy){
  // Path edge shading and cobblestones remain derived from walkable cells.
  const mud=s%5===3?'#b3a698':Math.floor(s/5)===6?'#b6a7c4':Math.floor(s/5)===8?'#af8d75':Math.floor(s/5)===7?'#bad1d6':'#ddc6a0';
  fill(x,y,48,48,mud);
  fill(x+1,y+1,46,3,s%5===3?'#beb8ae':'#e7d2ad');
  for(let k=0;k<12;k++){
   const ox=4+rnd(wx,wy,k+120)*39,oy=3+rnd(wx,wy,k+200)*42;
   ellipse(x+ox,y+oy,2+rnd(wx,wy,k+223)*3,1.3,k%2?'#c5ad89':'#f3dfb7',.6);
  }
  // Organic edges: the same grid determines where trails meet meadow and river.
  const gg=maps[s]?.g;
  const near=(dx,dy)=>{const tt=gg?.[wy+dy]?.[wx+dx];return ['p','E','=','G'].includes(tt)};
  const edgeSeed=(n)=>rnd(wx,wy,n+s*13);
  const green=s%5===3?'#86877e':REGION_PALETTES[Math.floor(s/5)][1];
  if(!near(-1,0))for(let i=0;i<9;i++)ellipse(x+2+edgeSeed(i+36)*5,y+4+i*5,4+edgeSeed(i+126)*2,4,green,.5);
  if(!near(1,0))for(let i=0;i<9;i++)ellipse(x+46-edgeSeed(i+56)*5,y+4+i*5,4+edgeSeed(i+150)*2,4,green,.47);
  if(!near(0,-1))for(let i=0;i<9;i++)ellipse(x+4+i*5,y+2+edgeSeed(i+75)*5,4,4+edgeSeed(i+160)*2,green,.46);
  if(!near(0,1))for(let i=0;i<9;i++)ellipse(x+4+i*5,y+46-edgeSeed(i+93)*5,4,4+edgeSeed(i+169)*2,green,.48);
  // Large embedded irregular stepping stones, not a repeated rigid checkerboard.
  if(s!==3 && s!==8 && (wx*3+wy*11+s)%3!==0){
   ellipse(x+12+edgeSeed(333)*24,y+10+edgeSeed(335)*29,8+edgeSeed(337)*5,3+edgeSeed(339)*3,'#eee1c8',.4);
   ellipse(x+12+edgeSeed(343)*24,y+10+edgeSeed(345)*29,6+edgeSeed(347)*4,2+edgeSeed(349)*3,'#a68f76',.24);
  }
  if(t==='='){
   fill(x,y+4,48,40,'#b98554');
   for(let k=0;k<4;k++){fill(x+1,y+6+k*10,46,7,k%2?'#d7ae76':'#c0925e');fill(x+1,y+13+k*10,46,2,'#795938')}
   fill(x+1,y+3,4,43,'#725639');fill(x+43,y+3,4,43,'#725639');
  }
 }
 function lake(x,y,wx,wy,tick){const g=c.createLinearGradient(x,y,x+48,y+48);const volcanic=Math.floor((state.aurWorld50?.stage||0)/5)===8;g.addColorStop(0,volcanic?'#ffac53':'#69c6d8');g.addColorStop(1,volcanic?'#c02b22':'#2d93bc');fill(x,y,48,48,g);
  for(let k=0;k<3;k++){const ox=(rnd(wx,wy,k+91)*36+(tick*.013))%53-7,oy=11+k*14; c.strokeStyle='rgba(230,251,250,.45)';c.lineWidth=2;c.beginPath();c.moveTo(x+ox,y+oy);c.quadraticCurveTo(x+ox+7,y+oy-4,x+ox+16,y+oy);c.stroke()}
 }
 function pine(x,y,wx,wy,tick){
  ellipse(x+27,y+42,21,6,'#225941',.22);
  fill(x+21,y+24,6,16,'#76543b');
  const a=rnd(wx,wy,4),cs=['#205f4d','#2d8056','#4a9c67','#7eb97a'];
  for(let i=0;i<4;i++){const y2=y+25-i*7;polygon([[x+24,y+3-i*4],[x+4+i*3,y2],[x+44-i*3,y2]],cs[i]);}
  for(let i=0;i<3;i++)ellipse(x+15+i*10,y+12+i*3,4,2,'#a9dba0',.35+a*.15);
 }
 function bigTree(x,y,wx,wy,tick){
  ellipse(x+25,y+43,21,7,'#305f3f',.22);
  rounded(x+20,y+24,8,15,2,'#89613f');
  const shade=['#286b4b','#378958','#56a567','#84c77b'];
  for(const [dx,dy,rx,ry,i] of [[-11,3,15,13,0],[11,2,15,13,0],[0,0,20,16,1],[-10,-8,16,13,2],[10,-8,16,13,2],[0,-13,16,14,3]]){
   const gr=c.createRadialGradient(x+24+dx-5,y+16+dy-5,0,x+24+dx,y+16+dy,rx);gr.addColorStop(0,shade[Math.min(3,i+1)]);gr.addColorStop(1,shade[i]);ellipse(x+24+dx,y+16+dy,rx,ry,gr);
  }
  for(let k=0;k<4;k++)ellipse(x+14+rnd(wx,wy,k+8)*23,y+6+rnd(wx,wy,k+22)*18,2.4,1.5,'#d2e8a3',.52);
 }
 function shrub(x,y,wx,wy){const a=rnd(wx,wy,9);for(let k=0;k<3;k++)ellipse(x+16+k*9,y+31-(k%2)*5,10,9,['#438e56','#66b765','#a5ce70'][k]);if(a>.38)for(let k=0;k<4;k++)ellipse(x+15+k*8,y+24+(k%2)*6,2.6,2.6,['#ffd6dc','#fff0bc'][k%2]);}
 function rock(x,y,wx,wy){ellipse(x+27,y+39,19,7,'#4b6159',.3);polygon([[x+9,y+31],[x+15,y+13],[x+32,y+11],[x+43,y+27],[x+37,y+39],[x+12,y+39]],'#849b92');polygon([[x+15,y+13],[x+32,y+11],[x+26,y+27],[x+9,y+31]],'#d1d5ba');polygon([[x+32,y+11],[x+43,y+27],[x+37,y+39],[x+26,y+27]],'#576f74');}
 function wall(x,y,wx,wy){fill(x,y,48,48,'#50515a');fill(x,y,48,10,'#777780');for(let k=0;k<4;k++)for(let j=0;j<3;j++){const xx=x+j*16+(k%2)*7,yy=y+k*11+2;rounded(xx,yy,13,9,2,k%2?'#807c7b':'#777276','#4c4b52')}}
 function building(b,tick){const x=b.x*T,y=b.y*T,w=b.w*T,h=b.h*T;const gym=b.kind==='gym';
  ellipse(x+w/2+4,y+h+8,w*.5+8,12,'#25462c',.24);
  const body=c.createLinearGradient(x,y+32,x,y+h);body.addColorStop(0,'#f4e8d1');body.addColorStop(1,'#cfbca6');
  polygon([[x+10,y+39],[x+w-13,y+39],[x+w-11,y+h-2],[x+10,y+h-2]],body);
  polygon([[x+w-13,y+39],[x+w-4,y+30],[x+w-3,y+h-12],[x+w-11,y+h-2]],'#a9957e');
  // Layered roofs with real eaves, chimney, tiles and highlights.
  const colors={center:['#d45a74','#eaa0aa'],market:['#4c92b5','#94d8dd'],house:['#b276c7','#dcb1e3'],gym:['#8d63b2','#c9a0dc']};const [roof,light]=colors[b.kind];
  polygon([[x-4,y+44],[x+30,y+3],[x+w-33,y+3],[x+w+5,y+44],[x+w-3,y+52],[x+3,y+52]],'#635060');
  const g=c.createLinearGradient(x,y,x,y+49);g.addColorStop(0,light);g.addColorStop(.66,roof);g.addColorStop(1,'#704b70');
  polygon([[x-2,y+42],[x+32,y+4],[x+w-34,y+4],[x+w+2,y+42],[x+w-4,y+47],[x+4,y+47]],g);
  for(let i=0;i<3;i++)for(let j=0;j<9;j++){let xx=x+13+j*((w-27)/9)+(i%2)*6, yy=y+25+i*6; c.strokeStyle='rgba(57,40,66,.19)';c.lineWidth=1.1;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+9,yy);c.stroke()}
  // Door aligns exactly with building's southern interactive tile.
  const doorx=b.door[0]*T+T/2;rounded(doorx-12,y+55,24,h-55,5,'#7e5347','#f4c48d');rounded(doorx-8,y+60,16,h-61,4,'#a5725c');ellipse(doorx+5,y+h-18,1.6,1.6,'#f7d17a');
  for(const px of [x+22,x+w-39]){rounded(px,y+56,19,19,3,'#fdf7d9','#826b58');rounded(px+3,y+59,13,13,1,'#8bcad6');fill(px+9,y+59,2,13,'#ebf4de')}
  if(b.kind==='center'){fill(x+w/2-4,y+19,8,20,'#fff4ec');fill(x+w/2-10,y+25,20,8,'#fff4ec')}
  if(b.kind==='market'){ellipse(x+w/2,y+27,11,6,'#dcf1da');fill(x+w/2-9,y+26,18,3,'#4c9074')}
  if(gym){polygon([[doorx,y+11],[doorx+13,y+22],[doorx+8,y+36],[doorx-8,y+36],[doorx-13,y+22]],'#ffebaa');}
  // Warm windows with shutters, flower boxes, doorway lamps and small stone steps.
  for(const px of [x+22,x+w-39]){
   rounded(px+3,y+61,13,11,1,'#ffd88e');
   fill(px+8,y+59,2,15,'#eaf1e4');
   rounded(px-3,y+76,26,5,2,'#866d4a');
   for(let k=0;k<4;k++){ellipse(px+k*6,y+74,4.5,4.2,['#ce5174','#f4c65f','#ffeaeb'][k%3])}
  }
  for(const lx of [doorx-22,doorx+19]){
   rounded(lx-2,y+60,5,12,2,'#6b4a35');ellipse(lx,y+62,5,8,'#ffdb87');
   ellipse(lx,y+66,9,10,'#ffe8a2',.14);
  }
  for(let z=0;z<3;z++)rounded(doorx-16-z*2,y+h-6+z*3,32+z*4,3,1,['#eddec9','#b2a593','#e5cfaf'][z]);
  // Decorative roof finial and rounded tile highlights.
  ellipse(x+w/2,y+6,12,4,'#f5dba2',.65);
  c.strokeStyle='rgba(255,255,255,.36)';c.lineWidth=2;c.beginPath();c.moveTo(x+22,y+15);c.lineTo(x+w-25,y+15);c.stroke();
  // entrance marker at the actual approach tile
  ellipse((b.step[0]+.5)*T,(b.step[1]+.84)*T,15,3,'#fbecb5',.4);
 }
 function character(x,y,kind,step,tick){
  const name=npcSprites[kind]||npcSprites.trainer;
  if(paintPerson(name,x*T+10,y*T-10,29,60))return;
  const cx=x*T+24,cy=y*T+35;
  ellipse(cx,cy+10,13,4,'#244e3d',.27);
  const clr=kind==='trainer'?'#f2ba5e':kind==='heal'?'#f6e4e7':kind==='guide'?'#b998d9':'#4d91cf';
  rounded(cx-9,cy-15,18,21,5,clr,'#435d65');fill(cx-7,cy+5,5,9,'#364c61');fill(cx+2,cy+5,5,9,'#364c61');
  ellipse(cx,cy-22,9,10,'#ffddc3');ellipse(cx-3,cy-24,2,1.2,'#2c4550');ellipse(cx+3,cy-24,2,1.2,'#2c4550');
  ellipse(cx,cy-30,10,5,kind==='trainer'?'#574b6d':'#66527a');
  if(kind==='trainer')ellipse(cx+11,cy-37,4,5,'#f6d56f');
 }
 function sprite(x,y,tick){
  const sex=state.profileGender==='girl'?'girl':'boy';const dir=['down','left','right','up'].includes(state.facing)?state.facing:'down';
  if(paintPerson('hero_'+sex+'_'+dir+'.svg',x*T+7,y*T-22,34,73))return;
  const cx=x*T+24,cy=y*T+37;ellipse(cx,cy+8,16,6,'#244f3c',.29);const girl=state.profileGender==='girl';
  rounded(cx-11,cy-18,22,24,7,girl?'#d87ca8':'#3788c6','#3a5f74');
  fill(cx-9,cy+5,8,11,'#354a67');fill(cx+1,cy+5,8,11,'#354a67');
  ellipse(cx,cy-26,10,11,'#ffdbb8');for(const ox of [-4,4])ellipse(cx+ox,cy-26,1.5,1.7,'#233a50');
  ellipse(cx,cy-35,11,5,girl?'#b98250':'#375b8b');if(!girl){fill(cx-11,cy-37,22,4,'#4772b0');fill(cx+5,cy-35,12,3,'#4772b0')}
  polygon([[cx,cy-50],[cx-6,cy-42],[cx+6,cy-42]],'#fff1a6');
 }
 function makeScene(tick=0){if(!active())return;const world=ensure(),s=world.stage,d=maps[s];
  // Whole scene built from grid; no full-size illustration or pixel-positioned collisions.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const kind=d.g[y][x],px=x*T,py=y*T;
   if(kind==='~'||kind==='L'){lake(px,py,x,y,tick);if(kind==='L'){ellipse(px+24,py+26,18,12,'#3c9776');ellipse(px+24,py+23,14,10,'#90d2a3');ellipse(px+28,py+22,5,4,'#66b882');}continue}
   grass(px,py,x,y,s,tick);
   if(['p','=','E'].includes(kind))path(px,py,kind,s,x,y);
   if(kind==='s'||kind==='R'||kind==='G') {fill(px,py,T,T,'#aaa99e');for(let k=0;k<4;k++){fill(px+2+k*11,py+8+(k%2)*12,9,2,'#d2c7b2')}}
   if(kind==='#')wall(px,py,x,y);
   if(kind==='t')(s%5===3||Math.floor(s/5)===2||Math.floor(s/5)===8)?rock(px,py,x,y):rnd(x,y,s+7)>.37?bigTree(px,py,x,y,tick):pine(px,py,x,y,tick);
   if(kind==='w')shrub(px,py,x,y);
   if(kind==='E'){rounded(px+8,py+10,32,34,6,'#a88363','#eee4bf');rounded(px+15,py+14,18,28,4,'#355e64');ellipse(px+24,py+7,11,3,'#fff0bd',.6)}
  }
  if(s===2){ // creek banks follow the same water cells
   for(let y=1;y<H-1;y++)for(const x of [8,10]){if(d.g[y][x]==='~')ellipse(x*T+24,y*T+24,20,4,'#d4ead2',.26)}
  }
  // Layered details live on authored cells; no visual objects that mask collision geometry.
  if(s===0){
   // Town-square warm cobblestone center, physically just the walkable plaza.
   for(const [a,b] of [[8,7],[9,7],[10,7],[8,6],[9,6],[10,6]]){
    if(d.g[b][a]==='p'){
     const xx=a*T,yy=b*T;
     for(let k=0;k<5;k++)ellipse(xx+8+(k*17)%36,yy+13+(k*11)%29,7,3,'#e7d8b8',.48);
    }
   }
   sign(5*T,4*T,'ROUTE 01','#5f6843');
   lamp(11*T,4*T,tick);lamp(13*T,9*T,tick);
  }
  if(s===1){
   for(const [x,y] of [[3,4],[11,4],[8,8],[17,7]])flowerbed(x*T,y*T,x,y);
   sign(1*T,4*T,'BLUMEN','#56785b');
  }
  if(s===2){
   sign(3*T,3*T,'BACHWEG','#4b7695');
   for(const [x,y] of [[7,5],[11,5],[7,8],[11,8]]){
    ellipse(x*T+24,y*T+22,18,8,'#4e9a78',.23);
   }
  }
  if(s===3){
   // Ancient wall is collidable across its entire height; magical gate remains the only passage.
   for(const [x,y] of [[3,5],[6,8],[13,4]]){
    const xx=x*T+24,yy=y*T+23;ellipse(xx,yy+10,11,4,'#333b43',.3);
    ellipse(xx,yy,8,15,'#a49c83');ellipse(xx,yy-4,5,5,'#81d8b5',.75);
   }
  }
  if(s===4){
   sign(8*T,3*T,'ARENA','#8353a0');lamp(11*T,4*T,tick);
   flags(13*T,1*T,'#a981d1');flags(17*T,1*T,'#ffe19b');
  }
  if(s===5){sign(8*T,3*T,'MONDSEE','#317d9c');lamp(9*T,5*T,tick);flowerbed(3*T,8*T,3,8)}
  if(s===6){sign(1*T,4*T,'SCHILF','#448a79');flowerbed(10*T,9*T,10,9)}
  if(s===7){sign(7*T,4*T,'STEG','#498ca1');lamp(13*T,5*T,tick)}
  if(s===8){for(const [x,y] of [[3,5],[13,5],[7,8]]){ellipse(x*T+24,y*T+22,13,13,'#83e9dd',.25);ellipse(x*T+24,y*T+20,7,10,'#65cbc9')}}
  if(s===9){sign(7*T,4*T,'MONDARENA','#367aae');lamp(11*T,4*T,tick);flags(12*T,1*T,'#6cb9da');flags(16*T,1*T,'#a2c7f1')}
  if(s>=10){const region=Math.floor(s/5),chapter=s%5;sign(2*T,4*T,REGIONS[region].toUpperCase().slice(0,9),'#315e70');
   if(chapter===0){lamp(10*T,4*T,tick);flowerbed(15*T,8*T,15,8)}
   if(chapter===1||chapter===2){for(const [x,y] of [[3,2],[14,4],[6,8]])if(d.g[y][x]==='g'||d.g[y][x]==='w')flowerbed(x*T,y*T,x,y)}
   if(chapter===3){for(const [x,y] of [[6,4],[14,8]]){ellipse(x*T+24,y*T+21,12,12,region%2?'#ffb981':'#84e9ec',.3)}}
   if(chapter===4){flags(12*T,1*T,region%2?'#ebadd7':'#83d0e9');lamp(10*T,5*T,tick);flags(16*T,1*T,'#efdc91')}
  }
  for(const b of d.extras.buildings)building(b,tick);
  for(const r of d.extras.runes){const activated=world.runestones.includes(r.id);const x=(r.x+.5)*T,y=(r.y+.58)*T;ellipse(x,y+11,20,9,'#4a5e5a',.22);rounded(x-14,y-21,28,37,7,activated?'#5b7f82':'#6e667b','#e6d4b1');
   ellipse(x,y-9,7,9,activated?'#7af6db':'#b3a0ff');if(activated)ellipse(x,y-9,17,17,'#8effdf',.23)}
  if(d.extras.gate){const G=d.extras.gate,open=d.extras.runes.every(r=>world.runestones.includes(r.id));const x=G.x*T,y=G.y*T;
   if(!open){rounded(x+6,y+2,36,44,5,'#65526b','#d2b8b7');for(let k=0;k<4;k++)fill(x+11+k*8,y+8,3,31,'#c5a2d8');}
   else{ellipse(x+24,y+25,18,18,'#9bffe4',.34);ellipse(x+24,y+25,9,12,'#d3fff1',.55)}
  }
  for(const q of d.extras.loot){if(state.found.includes('aur50:'+q.id))continue;const x=q.x*T+24,y=q.y*T+22;rounded(x-12,y-2,24,16,5,'#a66847','#ffe1a0');fill(x-12,y+3,24,3,'#e6c168');fill(x-3,y,6,14,'#fff0a9');ellipse(x,y-14+Math.sin(tick*.005)*2,3,4,'#fffbd9')}
  const hidden=window.AriMons?.hiddenSpot?.(state.zone);
  if(hidden){const x=hidden.x*T+T/2,y=hidden.y*T+T/2;
   ellipse(x,y+6,15,7,'#523e6f',.21);ellipse(x,y-10+Math.sin(tick*.003)*2,13,13,'#ffeaa1',.27);
   ellipse(x,y-10,5,7,'#fff5c1',.95);rounded(x-2,y-23,4,9,1,'#f6b85c');}
  for(const n of d.extras.npcs)character(n.x,n.y,n.kind,0,tick);
  sprite(state.x,state.y,tick);
  // Soft translucent scene frame gives the visual world a cohesive polish.
  const grad=c.createLinearGradient(0,0,0,H*T);grad.addColorStop(0,'rgba(255,251,203,.12)');grad.addColorStop(1,s===3?'rgba(26,28,44,.19)':'rgba(14,69,44,.06)');fill(0,0,W*T,H*T,grad);
 }
 function draw(){if(!active())return;ensure();makeScene(performance.now())}
 const oldAt=atPosition;
 atPosition=function(z,x,y){if(z>=0&&z<10&&active()){const t=tile(x,y);if(npc(x,y))return 'trainer';if(loot(x,y))return 'loot';if(t==='w'||t==='g')return 'wild';if(t==='~')return 'water';if(t==='t')return 'tree';if(t==='#'||t==='b'||t==='a'||t==='G')return 'wall';if(t==='E')return 'portal';return 'path'}return oldAt(z,x,y)};
 const oldTrainers=trainers,oldDrops=drops;
 trainers=function(z){if(z>=0&&z<10&&active()){const s=ensure().stage;return maps[s].extras.npcs.filter(n=>n.kind==='trainer').map(n=>({id:`${z}:${n.j}`,x:n.x,y:n.y,j:n.j,name:n.name,defeated:state.trainerWins.includes(`${z}:${n.j}`)}));}return oldTrainers(z)};
 drops=function(z){if(z>=0&&z<10&&active())return maps[ensure().stage].extras.loot.filter(q=>!state.found.includes('aur50:'+q.id)).map(q=>({...q,picked:false}));return oldDrops(z)};
 trainerParty=function(z,j){const mons=oldTrainerParty(z,j);if(z>=0&&z<10&&active()){const s=ensure().stage;for(let i=0;i<mons.length;i++){mons[i].level=Math.min(99,5+s*2+i);mons[i].hp=hpMax(mons[i].id,mons[i].level)}}return mons};
 gymParty=function(z){const mons=oldGymParty(z);if(z>=0&&z<10&&active()&&ensure().stage%5===4){const bossLevels=[11,20,30,40,50,60,70,80,90,96];
   if(z===9&&mons.length<6){const ids=ZONE_POOLS[z];while(mons.length<6)mons.push(newMon(ids[(mons.length*3)%ids.length],98));}
   mons.forEach((m,i)=>{m.level=Math.min(100,bossLevels[z]+i);m.hp=hpMax(m.id,m.level)})}return mons};
 randomWild=function(z){const m=oldRandomWild(z);if(z>=0&&z<10&&active()){m.level=clamp(3+ensure().stage*2+rand(0,3),3,97);m.hp=hpMax(m.id,m.level)}return m};
 function updateHud(){const w=ensure();if(!w)return;const s=w.stage,z=state.zone;
  const region=REGIONS[Math.floor(s/5)].toUpperCase();
  const runeCount=maps[s].extras.runes.filter(r=>w.runestones.includes(r.id)).length;
  $('zone-step').textContent=`${region} · EBENE ${s+1} / 50`;
  $('zone-name').textContent=TITLES[s];$('zone-desc').textContent=DESCS[s];
  $('goal-title').textContent=s%5===3?`Aktiviere drei Runen (${runeCount}/3)`:s%5===4?(state.badges.includes(Math.floor(s/5))?'Orden errungen!':'Besiege '+AREAS[Math.floor(s/5)].leader):`Erreiche Ebene ${Math.min(50,s+2)}`;
  $('goal-desc').textContent=s%5===4?'Die Prüfhalle liegt im Nordosten.':s%5===3?'Drei Zeichen öffnen das Tor im Osten.':'Erkunde die Karte und folge dem Weg nach Osten.';
  const sub=$('camera-position');if(sub)sub.textContent=`20 × 12 Felder · Abschnitt ${s+1}/50`;
  const title=document.querySelector('.maptop b');if(title)title.textContent=`${region} · ${TITLES[s].toUpperCase()}`;
 }
 renderMap=function(){if(!active()){document.getElementById('game-map')?.classList.remove('aur50-active');return oldRender()}
  ensure();const map=$('game-map');if(!map.contains(canvas)){map.replaceChildren(canvas);}
  map.className='map aur50-active';map.style.setProperty('--map-cols','20');map.style.setProperty('--map-rows','12');
  updateHud();draw();};
 function pick(q){state.found.push('aur50:'+q.id);gainItem(q.item,1);state.coins+=25;toast('✨ Schatz gefunden: '+ITEM_INFO[q.item][0]+'!');save();render()}
 function advance(dest,back){const w=ensure();if(dest<0){toast('🌿 Hier beginnt dein Abenteuer.');return}
  if(dest>=50){if(!state.badges.includes(9)){toast('👑 Besiege zuerst Champion Nova!');return}
   w.completed=Array.from(new Set([...w.completed,49]));save();modal('👑 Alle 50 Ebenen gemeistert!','Du hast alle zehn Regionen bereist und alle Prüfungen gemeistert. Alle Orte bleiben zugänglich.',[['Weiter erforschen','close','gold']]);return}
  const nextZone=Math.floor(dest/5),currentZone=Math.floor(w.stage/5);
  if(nextZone>currentZone&&!state.badges.includes(currentZone)){toast('🏅 Besiege zuerst '+AREAS[currentZone].leader+' und gewinne den Orden!');return}
  if(!back&&dest>0&&!w.completed.includes(dest-1))w.completed.push(dest-1);
  w.stage=dest;
  if(nextZone!==state.zone)oldEnterZone(nextZone);
  const pos=back?[18,6]:dest===0?maps[0].extras.entry:[1,6];
  state.x=pos[0];state.y=pos[1];state.facing=back?'left':'right';
  state.dungeon=null;state.v51Indoor=null;if(!state.visited.includes(nextZone))state.visited.push(nextZone);
  save();render();toast(`🗺️ Ebene ${dest+1}: ${TITLES[dest]}`);
 }
 function handleAt(x,y,walking){const w=ensure(),d=data(),n=npc(x,y),q=loot(x,y),r=rune(x,y),b=buildingAt(x,y);
  if(q){if(walking){state.x=x;state.y=y;}pick(q);return true}
  if(n){if(walking){toast('💬 Drücke A, um '+n.name+' anzusprechen.');return true}
   if(['runeA','runeB','cache'].includes(n.kind)){window.PokemonGame.world51?.activate?.(n.kind);return true}
   if(n.kind==='cave'){window.PokemonGame.v4?.goCave?.();return true}
   if(n.kind==='rival'){doAction('v52-rival-menu');return true}
   if(n.kind==='side'){doAction('v53-side');return true}
   if(n.kind==='ruin'){doAction('v53-ruin');return true}
   if(n.kind==='temple'){doAction('v53-temple');return true}
   if(n.kind==='shadow'){
    if(state.rocketWins?.includes(state.zone)){doAction('v53-story');return true}
    modal('🕶️ Schatten-Team','Ein Kommandant bedroht diese Region. Besiege ihn, um die Schattenchronik fortzusetzen.',[['Kommandant herausfordern','rocket:'+state.zone,'gold'],['Später','close']]);return true
   }
   if(n.kind==='trainer'){if(walking){toast('💬 Drücke A, um '+n.name+' anzusprechen.');return true}return interactTrainer(trainers(state.zone).find(t=>t.x===x&&t.y===y)),true}
   if(n.kind==='heal')healCenter();else modal('📜 Hinweis in '+REGIONS[Math.floor(w.stage/5)],d.extras.runes.length?'„Die Zeichen gehören in diese Reihenfolge: '+((d.extras.runeOrder||d.extras.runes.map(q=>q.id)).map(id=>id.endsWith('east')?'Ost':id.endsWith('middle')?'Mitte':'West')).join(' → ')+'.“':'„Folge dem Weg nach Osten. Hier warten Trainer, Geheimnisse und neue Pokémon.“',[['Danke!','close','gold']]);return true}
  if(r){if(!w.runestones.includes(r.id)){
     const order=d.extras.runes;const done=order.filter(a=>w.runestones.includes(a.id)).length;
     if(w.stage!==3&&(d.extras.runeOrder||order.map(a=>a.id))[done]!==r.id){toast('🔮 Falsche Reihenfolge! Sprich mit dem Runenforscher.');return true}
     w.runestones.push(r.id);save();toast(`💎 Rune aktiviert! ${done+1}/3`);render()}
    else toast('💎 Diese Rune leuchtet bereits.');return true}
  if(b){if(b.kind==='gym'){if(w.stage%5!==4)return true;enterGym();return true}
   if(b.kind==='center')healCenter();else if(b.kind==='market')showShop();else if(b.kind==='atelier'){window.PokemonGame.world51?.open?.('atelier');return true}else modal('🏡 '+b.name,'Ein gemütliches Haus in '+REGIONS[Math.floor(w.stage/5)]+'.',[['Weiter','close']]);return true}
  return false;
 }
 function step(dx,dy){if(!active()||modalOpen||battle||currentPage!=='world')return;const w=ensure();state.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';const nx=state.x+dx,ny=state.y+dy;
  if(!safe(nx,ny)){toast('⛔ Dort geht es nicht weiter.');return}
  const t=tile(nx,ny);
  if(t==='E') {if(nx===0){advance(w.stage-1,true);return}if(nx===19){const all=data().extras.runes;if((w.stage%5===3)&&!all.every(r=>w.runestones.includes(r.id))){toast(`🔒 Aktiviere die drei Runen (${all.filter(r=>w.runestones.includes(r.id)).length}/3)!`);return}advance(w.stage+1,false);return}}
  if(t==='G'&&!data().extras.runes.every(r=>w.runestones.includes(r.id))){toast('🔒 Das Tor braucht alle drei Runen!');return}
  if(!passable(t)&&t!=='G'){const b=buildingAt(nx,ny);if(b&&b.step[0]===state.x&&b.step[1]===state.y&&dy===-1&&b.door[0]===nx){handleAt(nx,ny,false);return}toast(t==='~'?'🌊 Hier brauchst du eine Brücke.':'🌳 Dieser Weg ist versperrt.');return}
  if(npc(nx,ny)){toast('💬 Drücke A, um zu sprechen.');return}
  state.x=nx;state.y=ny;state.steps++;
  if(handleAt(nx,ny,true))return;
  if(state.repelSteps>0)state.repelSteps--;
  if((t==='w'&&Math.random()<.16)||(w.stage%5===3&&Math.random()<.035))if(state.repelSteps===0){startWild();render();return}
  render();
 }
 walk=function(dx,dy){if(!active())return oldWalk(dx,dy);const count=state.bicycle?2:1;
  for(let i=0;i<count;i++){const x=state.x,y=state.y;step(dx,dy);if(modalOpen||battle||state.x===x&&state.y===y)break}
 };
 interact=function(){if(!active())return oldInteract();if(modalOpen||battle)return;
  const dirs={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};const d=dirs[state.facing]||dirs.up;
  const px=state.x+d[0],py=state.y+d[1];if(safe(px,py)&&handleAt(px,py,false))return;
  if(handleAt(state.x,state.y,false))return;
  if(window.AriMons?.tryDiscover?.())return;
  modal('🧭 '+REGIONS[Math.floor(ensure().stage/5)],`Du erkundest <b>Ebene ${ensure().stage+1}: ${TITLES[ensure().stage]}</b>. Folge den begehbaren Wegen. Tippe A vor Häusern, Trainern und Runen.`,[['Weiter','close','gold']]);
 };
 battleDefeat=function(){oldDefeat();if(state.zone>=0&&state.zone<10&&state.aurWorld50){const p=maps[clampStage(state.aurWorld50.stage)].extras.entry;state.x=p[0];state.y=p[1];save();render()}};
 // The original controls reference global walk/interact dynamically.
 window.PokemonGame.walk=(dx,dy)=>walk(dx,dy);
 window.PokemonGame.world50={pilot:true,revision:'Zehn-Regionen-50-Ebenen',names:TITLES.slice(),getStage:()=>state?.aurWorld50?.stage??0,
  getMap:(i)=>maps[clampStage(i)].g.map(row=>row.slice()),getFeatures:(i)=>({npcs:maps[clampStage(i)].extras.npcs.map(n=>({...n})),runes:maps[clampStage(i)].extras.runes.map(n=>({...n})),buildings:maps[clampStage(i)].extras.buildings.map(n=>({...n}))}),getRegion:(i)=>REGIONS[Math.floor(clampStage(i)/5)],getCount:()=>maps.length,getPlayer:()=>[state.x,state.y],getSpawn:()=>maps[clampStage(state?.aurWorld50?.stage)].extras.entry.slice(),
  // Route checker is read-only and works without a save or profile.
  validate:()=>maps.map((m,s)=>{
   const seen=new Set(),queue=[m.extras.entry];const pass=(x,y)=>safe(x,y)&&((m.g[y][x]==='G')||passable(m.g[y][x]));
   while(queue.length){const [x,y]=queue.shift(),k=mapKey(x,y);if(seen.has(k)||!pass(x,y))continue;seen.add(k);for(const [dx,dy] of DIRS)queue.push([x+dx,y+dy])}
   const targets=[m.extras.exit,...m.extras.npcs.map(n=>[n.x,n.y]),...m.extras.loot.map(n=>[n.x,n.y]),...m.extras.runes.map(n=>[n.x,n.y]),...m.extras.buildings.map(b=>b.step)];
   return {stage:s+1,reachable:targets.every(([x,y])=>seen.has(mapKey(x,y))),targetCount:targets.length,reachableCount:targets.filter(([x,y])=>seen.has(mapKey(x,y))).length,visited:seen.size};
  })};
 const originalRender=render;
 render=function(){originalRender();if(active())updateHud();};
 const priorEnterZone=enterZone;
 enterZone=function(z){const r=priorEnterZone(z);if(z>=0&&z<10&&active()){ensure();render();}return r};
 // The emergency button must send the player to the real spawn, never onto a building.
 const oldAction=doAction;
 doAction=function(act,el){if(act==='stuck-center'&&active()){
  const p=maps[ensure().stage].extras.entry;state.x=p[0];state.y=p[1];state.facing='right';save();render();toast('💚 Du bist sicher am Abschnittseingang.');return;}
  return oldAction(act,el)};
 // Intercept the original button's capture handler for this pilot only.
 document.addEventListener('click',e=>{const b=e.target.closest('button[data-action="stuck-center"]');if(!b||!active())return;e.preventDefault();e.stopImmediatePropagation();doAction('stuck-center',b)},true);
 document.addEventListener('click',e=>{if(!active())return;const b=e.target.closest('#aur50-map-canvas');if(!b)return;const r=canvas.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/r.width*W),y=Math.floor((e.clientY-r.top)/r.height*H);if(Math.abs(state.x-x)+Math.abs(state.y-y)===1)walk(x-state.x,y-state.y);else if(x===state.x&&y===state.y)interact()},true);
 // Only redraw when visible and a pilot profile has been selected; avoids 60fps work on other maps.
 let prev=0;function raf(ms){requestAnimationFrame(raf);if(ms-prev>85&&active()&&currentPage==='world'&&canvas.isConnected){prev=ms;draw()}}requestAnimationFrame(raf);
 window.addEventListener('resize',()=>{if(active())renderMap()},{passive:true});
})();
