/* Originale Pokémon-Bilder über PokeAPI/Sprites; Netzverbindung nötig. Keine eigenen AuriMon-Grafiken. */
'use strict';
const POKE_SPRITE_BASE='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
window.ARIMON_SPRITES=Array.from({length:152},(_,id)=>id?POKE_SPRITE_BASE+'other/official-artwork/'+id+'.png':'');
window.ARIMON_BATTLE_FRONT=Array.from({length:152},(_,id)=>id?POKE_SPRITE_BASE+id+'.png':'');
window.ARIMON_BATTLE_BACK=Array.from({length:152},(_,id)=>id?POKE_SPRITE_BASE+'back/'+id+'.png':'');
