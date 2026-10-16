/* AuriMon 1.0.0 – full-body character graphics. Keeps original movement & saves. */
'use strict';
(() => {
 const world=window.PokemonWorld56;
 if(!world || !world.character || !world.drawPerson) return;
 const oldCharacter=world.character.bind(world);
 const oldPerson=world.drawPerson.bind(world);
 const cache=new Map();
 const roles=['scout','researcher','hiker','merchant','medic','guide'];
 const dirs=['down','up','left','right'];
 function imgByKey(key){
   let item=cache.get(key);
   if(!item){
     item={ok:false,error:false,im:new Image()};
     cache.set(key,item);
     item.im.onload=()=>{item.ok=true};
     item.im.onerror=()=>{item.error=true};
     item.im.src=(window.ARIMON_INLINE_SPRITES?.[key]) || ('ari_sprites/'+key+'.svg');
   }
   return item;
 }
 function draw(c,cx,cy,key,bob){
   const item=imgByKey(key);
   if(!item.ok || !item.im.naturalWidth) return false;
   c.save();
   c.drawImage(item.im,Math.round(cx-21),Math.round(cy-49+(bob||0)),42,66);
   c.restore();
   return true;
 }
 function seedOf(n,z){
   const s=[z,n?.id,n?.name,n?.x,n?.y].map(x=>String(x??'')).join('|');
   let v=2166136261;
   for(let i=0;i<s.length;i++)v=Math.imul(v^s.charCodeAt(i),16777619);
   return v>>>0;
 }
 function hero(c,cx,cy,gender,dir,walkTime,enemy){
   if(enemy) return oldCharacter(c,cx,cy,gender,dir,walkTime,enemy);
   const g=gender==='girl'?'girl':'boy';
   const d=dirs.includes(dir)?dir:'down';
   const bob=Math.sin((walkTime||0)*0.012)*.5;
   if(!draw(c,cx,cy,'hero_'+g+'_'+d,bob))return oldCharacter(c,cx,cy,gender,dir,walkTime,enemy);
   // Small distinct marker remains above player without covering face.
   c.save();
   c.fillStyle='#77edff';c.strokeStyle='#156b93';c.lineWidth=1;
   c.beginPath();c.moveTo(cx,cy-52);c.lineTo(cx-4,cy-47);c.lineTo(cx,cy-42);c.lineTo(cx+4,cy-47);c.closePath();c.fill();c.stroke();
   c.restore();return true;
 }
 function npc(c,x,y,n,z,ms){
   if(!n)return oldPerson(c,x,y,n,z,ms);
   const id=seedOf(n,z),gender=(id%4===0||id%9===0)?'girl':'boy';
   const role=roles[(id>>>3)%roles.length],v=(id>>>12)%3;
   const dir=world.npcFacing?.(n,z)||'down';
   const key=role+'_'+gender+'_'+v+'_'+(dirs.includes(dir)?dir:'down');
   if(!draw(c,x,y,key,0))return oldPerson(c,x,y,n,z,ms);
   return true;
 }
 // Both movement and static NPCs are rendered by the existing canvas engine.
 world.character=hero;
 world.drawPerson=npc;
 window.AriMons=Object.assign(window.AriMons||{},{version:'1.0.0',graphics:'character-sprites',spriteVariants:152});
})();
