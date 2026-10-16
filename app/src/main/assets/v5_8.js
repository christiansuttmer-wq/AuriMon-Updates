/* v0.1.0: Full small region on screen + menu inspired by classic handheld RPGs. */
'use strict';
(() => {
  const w=document.getElementById('retro-menu');
  const playbar=document.querySelector('#page-world .playbar');
  const shortcuts=document.querySelector('#page-world .v4-shortcuts');
  // Gameplay buttons still exist in the DOM; they are hidden but action handlers stay intact.
  playbar.innerHTML=`<div class="dpad" role="group" aria-label="Steuerkreuz">
    <i></i><button data-dir="up" aria-label="Hoch">▲</button><i></i>
    <button data-dir="left" aria-label="Links">◀</button><i></i><button data-dir="right" aria-label="Rechts">▶</button>
    <i></i><button data-dir="down" aria-label="Runter">▼</button><i></i>
   </div><div class="v58-control-right">
    <button data-action="interact" aria-label="A: Ansprechen und bestätigen">A</button>
    <button data-action="retro-back" aria-label="B: Zurück">B</button>
    <button data-action="retro-menu" aria-label="Menü öffnen">MENÜ</button>
   </div>`;
  document.querySelector('.maptop b').textContent='KARTE · GANZES GEBIET';
  document.querySelector('.maptop span').textContent='14 × 11 · A / B / MENÜ';
  const tabs=document.querySelectorAll('.tabs button');
  let opened=false, section='main',selection=0;
  const originalSwitch=switchPage;
  function syncPage(){
    document.body.classList.toggle('v58-playing',currentPage==='world');
    for(const page of ['team','dex','bag','travel']){
      const el=document.querySelector('#page-'+page);
      if(el&&!el.querySelector('.v58-back')){
        const btn=document.createElement('button');btn.className='v58-back';btn.type='button';btn.dataset.action='retro-world';btn.textContent='◀ ZURÜCK ZUM SPIEL';el.prepend(btn);
      }
    }
  }
  switchPage=function(page){close();originalSwitch(page);syncPage();};
  const main=[
    ['AURIMON','page:team'],['BEUTEL','page:bag'],['AURIDEX','page:dex'],
    ['KARTE','page:travel'],['ABENTEUER','menu:adventure'],['SPEICHERN','action:save'],
    ['OPTIONEN','menu:options'],['SCHLIESSEN','close']
  ];
  // One focused submenu per category. No more button wall under the map.
  const MENUS={
    adventure:[['REISEN','menu:journey'],['KÄMPFE','menu:battles'],['ENTDECKEN','menu:discovery'],['LAGER','menu:camp'],['ERFOLGE','menu:achievements'],['◀ ZURÜCK','back']],
    journey:[['REISEKARTE','page:travel'],['FLIEGEN','action:fly-menu'],['FAHRRAD','action:bike-toggle'],['SAFARI','action:safari-enter'],['◀ ZURÜCK','back']],
    battles:[['MEISTERLIGA','action:league-menu'],['TURNIERE','action:v52-tournaments'],['TRAINING','action:v52-training'],['RIVALE','action:v52-rival-menu'],['MEISTERPFAD','action:v55-path'],['◀ ZURÜCK','back']],
    discovery:[['AUFTRÄGE','action:quests'],['HÖHLE','action:cave-enter'],['RUINEN & TEMPEL','action:v53-overview'],['GEHEIMNISSE','action:v51-guide'],['ANGELN','action:v55-fish'],['SCHATZKARTE','action:v55-treasure'],['◀ ZURÜCK','back']],
    camp:[['AURIMON-LAGER','action:v54-camp'],['EIER','action:v54-eggs'],['FOTOALBUM','action:v54-album'],['KLEIDUNG','action:v55-outfit'],['◀ ZURÜCK','back']],
    achievements:[['TROPHÄEN','action:v55-trophies'],['151-AURIMON-FINALE','action:v55-finale'],['RUHMESHALLE','action:v55-hall'],['◀ ZURÜCK','back']],
    options:[['TRAINERPASS','action:trainerpass'],['TRAINER ÄNDERN','action:profile-edit'],['SPIELER WECHSELN','action:profile-switch'],['SICHERUNGEN','action:save-menu'],['NEUES SPIEL +','action:v55-plus'],['NG+-BACKUP','action:v55-restore'],['HILFE','action:open-guide'],['◀ ZURÜCK','back']]
  };
  const sectionTitle={main:'MENÜ',adventure:'ABENTEUER',journey:'REISEN',battles:'KÄMPFE',discovery:'ENTDECKEN',camp:'LAGER',achievements:'ERFOLGE',options:'OPTIONEN'};
  let sectionHistory=[];
  function list(){return section==='main'?main:(MENUS[section]||main)}
  function draw(){
    const items=list();selection=Math.max(0,Math.min(selection,items.length-1));
    w.innerHTML=`<div class="retro-menu-title">◈ ${sectionTitle[section]||'MENÜ'}</div>`+
      items.map(([label,key],i)=>`<button type="button" class="${i===selection?'v58-selected':''}" data-retro-choice="${i}" data-retro-key="${key}">${String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</button>`).join('')+
      '<div class="retro-hint">A = AUSWAHL · B = ZURÜCK</div>';
  }
  function open(){if(!state.starterChosen||modalOpen||battle||currentPage!=='world')return;opened=true;section='main';sectionHistory=[];selection=0;w.hidden=false;draw();}
  function close(){opened=false;w.hidden=true;}
  function back(){if(opened){if(section!=='main'){section=sectionHistory.pop()||'main';selection=0;draw()}else close();return}
    if(modalOpen){closeModal();render();return}
    if(currentPage!=='world'){switchPage('world');return}}
  function activate(key){
    if(key==='close'){close();return}
    if(key==='back'){back();return}
    if(key?.startsWith('menu:')){sectionHistory.push(section);section=key.slice(5);selection=0;draw();return}
    if(key?.startsWith('page:')){close();switchPage(key.slice(5));return}
    if(key==='action:save'){save();close();toast('💾 Spielstand gespeichert!');return}
    if(key?.startsWith('action:')){close();doAction(key.slice(7));return}
  }
  // Capture stops the original global listener from interpreting menu clicks.
  document.addEventListener('click',e=>{
    const choice=e.target.closest('[data-retro-choice]');
    if(choice){e.stopImmediatePropagation();e.preventDefault();selection=Number(choice.dataset.retroChoice);activate(choice.dataset.retroKey);return}
    const btn=e.target.closest('button');if(!btn)return;
    // The physical-looking A/arrow controls navigate the menu too.
    if(opened && (btn.dataset.dir || btn.dataset.action==='interact')){
      e.stopImmediatePropagation();e.preventDefault();
      if(btn.dataset.dir){
        const delta=(btn.dataset.dir==='up'||btn.dataset.dir==='left')?-1:1;
        selection=(selection+list().length+delta)%list().length;draw();
      } else activate(list()[selection]?.[1]);
      return;
    }
    if(!btn.dataset.action)return;
    if(btn.dataset.action==='retro-menu'){e.stopImmediatePropagation();e.preventDefault();opened?close():open();return}
    if(btn.dataset.action==='retro-back'){e.stopImmediatePropagation();e.preventDefault();back();return}
    if(btn.dataset.action==='retro-world'){e.stopImmediatePropagation();e.preventDefault();switchPage('world');return}
  },true);
  // Close menu with B/Escape, navigate like a handheld with directional keys.
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea')||!opened)return;
    if(['ArrowDown','s','ArrowUp','w','ArrowLeft','a','ArrowRight','d','Enter',' ','Escape','Backspace'].includes(e.key)){
      e.stopImmediatePropagation();e.preventDefault();
      if(e.key==='ArrowDown'||e.key==='s'||e.key==='ArrowRight'||e.key==='d'){selection=(selection+1)%list().length;draw()}
      else if(e.key==='ArrowUp'||e.key==='w'||e.key==='ArrowLeft'||e.key==='a'){selection=(selection+list().length-1)%list().length;draw()}
      else if(e.key==='Enter'||e.key===' '){activate(list()[selection]?.[1])}
      else back();
    }
  },true);
  // Do not move while in the menu. The existing app controls still use global walk(...).
  const oldWalk=walk;
  walk=function(dx,dy){if(opened){const delta=(dy<0||dx<0)?-1:1;selection=(selection+list().length+delta)%list().length;draw();return;}return oldWalk(dx,dy)};
  if(window.PokemonGame)window.PokemonGame.walk=(dx,dy)=>walk(dx,dy);
  // When an earlier world change resets the page class directly, refresh without scrolling.
  const pages=document.getElementById('page-world');
  new MutationObserver(syncPage).observe(pages,{attributes:true,attributeFilter:['class']});
  syncPage();
  window.PokemonGame.retro={version:'0.1.0',menuOpen:()=>opened,show:open,close,items:list,mapTiles:[14,11]};
})();
