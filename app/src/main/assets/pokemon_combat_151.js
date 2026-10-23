/* Rechenmodell Pokémon Gen-ähnlich: Basiswerte aller 151, physisch/speziell, STAB, Typen, Wetter. */
'use strict';
/* Gen 4–9 attack classification: move-specific, not the pre-Gen4 type split. */
const AURIMON_PHYSICAL_MOVES=new Set(['Tackle','Kratzer','Ruckzuckhieb','Bodycheck','Biss','Hyperzahn','Feuerzahn','Rankenhieb','Rasierblatt','Giftstachel','Steinwurf','Erdbeben','Flügelschlag','Schlecker','Käferbiss','Karateschlag','Fußkick','Metallklaue']);
const AURIMON_SPECIAL_MOVES=new Set(['Glut','Flammenwurf','Feuersturm','Aquaknarre','Blubbstrahl','Hydropumpe','Surfer','Solarstrahl','Donnerschock','Donnerblitz','Donner','Schlammbombe','Konfusion','Psychokinese','Eisstrahl','Pulverschnee','Spukball','Feenwind','Mondgewalt','Drachenpuls','Drachenwut']);
function aurimonAttackCategory(move){
 if(['physical','special','status'].includes(move?.category))return move.category;
 if(!move?.power)return 'status';
 if(AURIMON_PHYSICAL_MOVES.has(move.name))return 'physical';
 if(AURIMON_SPECIAL_MOVES.has(move.name))return 'special';
 return ['Normal','Kampf','Flug','Gift','Boden','Gestein','Käfer','Geist','Stahl'].includes(move.type)?'physical':'special';
}
function aurimonDamage(attacker,target,move,weather='Klar'){
 const a=window.POKEMON_BASESTATS?.[attacker.id],d=window.POKEMON_BASESTATS?.[target.id];
 const isPhysical=aurimonAttackCategory(move)==='physical';
 const atkbase=(a?.[isPhysical?1:3]||55), defbase=(d?.[isPhysical?2:4]||55);
 const attack=Math.max(1,Math.floor((2*atkbase+15)*attacker.level/100)+5);
 const defense=Math.max(1,Math.floor((2*defbase+15)*target.level/100)+5);
 const stab=POKE[attacker.id]?.types.includes(move.type)?1.5:1;
 const mult=effectiveness(move.type,POKE[target.id].types);
 // Dragon Rage is a fixed-damage move, not a 40-power special attack.
 if(move.name==='Drachenwut')return {amount:mult===0?0:40,mult,crit:false};
 const crit=Math.random()<.0625;
 let w=1;
 if(weather==='Regen')w=move.type==='Wasser'?1.5:move.type==='Feuer'?.5:1;
 if(weather==='Sonnig')w=move.type==='Feuer'?1.5:move.type==='Wasser'?.5:1;
 const burned=isPhysical&&attacker.status==='burn'?.5:1;
 const base=Math.floor(Math.floor((2*attacker.level/5+2)*Math.max(1,move.power)*attack/defense)/50)+2;
 return {amount:mult===0?0:Math.max(1,Math.floor(base*stab*mult*w*burned*(crit?1.5:1)*(.85+Math.random()*.15))),mult,crit};
}
