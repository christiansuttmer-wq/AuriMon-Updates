/* Rechenmodell Pokémon Gen-ähnlich: Basiswerte aller 151, physisch/speziell, STAB, Typen, Wetter. */
'use strict';
function aurimonDamage(attacker,target,move,weather='Klar'){
 const a=window.POKEMON_BASESTATS?.[attacker.id],d=window.POKEMON_BASESTATS?.[target.id];
 const isPhysical=['Normal','Kampf','Flug','Gift','Boden','Gestein','Käfer','Geist','Stahl'].includes(move.type);
 const atkbase=(a?.[isPhysical?1:3]||55), defbase=(d?.[isPhysical?2:4]||55);
 const attack=Math.max(1,Math.floor((2*atkbase+15)*attacker.level/100)+5);
 const defense=Math.max(1,Math.floor((2*defbase+15)*target.level/100)+5);
 const stab=POKE[attacker.id]?.types.includes(move.type)?1.5:1;
 const mult=effectiveness(move.type,POKE[target.id].types);
 const crit=Math.random()<.0625;
 let w=1;
 if(weather==='Regen')w=move.type==='Wasser'?1.5:move.type==='Feuer'?.5:1;
 if(weather==='Sonnig')w=move.type==='Feuer'?1.5:move.type==='Wasser'?.5:1;
 const burned=isPhysical&&attacker.status==='burn'?.5:1;
 const base=Math.floor(Math.floor((2*attacker.level/5+2)*Math.max(1,move.power)*attack/defense)/50)+2;
 return {amount:mult===0?0:Math.max(1,Math.floor(base*stab*mult*w*burned*(crit?1.5:1)*(.85+Math.random()*.15))),mult,crit};
}
