/* AuriMon 1.1.0 – UI-/Qualitätsrunde.
 * Reorganisiert die Reiseübersicht, vereinheitlicht Taschenanzeige und Bildfehler,
 * ergänzt eine kleine Speicheranzeige. Alle Profil- und Kampfdaten bleiben unverändert.
 */
'use strict';
(() => {
  const RELEASE = '1.3.0';
  const $id = id => document.getElementById(id);
  const openSections = new Set(['progress']);
  const esc = input => String(input ?? '').replace(/[&<>"']/g,ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function versionBadge(){
    const el = document.querySelector('.brand span');
    if(el) el.textContent = 'DEINE AURIMON-WELT · VERSION ' + RELEASE;
    document.title = 'AuriMon';
    window.AriMons = Object.assign(window.AriMons || {}, {version:RELEASE,ui:'refined'});
  }

  // A small and calm indicator: saves happen on the existing storage key only.
  const header = document.querySelector('#app .resources');
  let status;
  if(header){
    status = document.createElement('span');
    status.id = 'arimons-save-state';
    status.textContent = '● Bereit';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    header.append(status);
  }
  let saveNotice = 0;
  if(typeof save === 'function'){
    const beforeSave = save;
    save = function(...args){
      const result = beforeSave(...args);
      if(status && window.PokemonProfiles?.activeSlot){
        status.textContent='✓ Gespeichert';
        status.classList.add('just-saved');
        clearTimeout(saveNotice);
        saveNotice = setTimeout(()=>{status.textContent='● Bereit';status.classList.remove('just-saved')},1800);
      }
      return result;
    };
  }

  // Show exactly what exists in the bag. The shop uses its separate catalogue.
  function drawInventory(){
    const container = $id('bag-list');
    if(!container) return;
    const entries = Object.entries(ITEM_INFO)
      .filter(([key]) => Math.max(0,Number(bagCount(key)) || 0)>0)
      .map(([key,item]) => {
        const [name,icon,desc] = item;
        const amount = Math.max(0,Number(bagCount(key)) || 0);
        let action = '';
        if(key==='repel') action='<button class="smallbtn" data-action="repel">Benutzen</button>';
        if(key==='epshare') action='<button class="smallbtn '+(state.v052ExpShareEnabled?'gold':'')+'" data-action="v052-share">'+(state.v052ExpShareEnabled?'Aktiviert':'Aktivieren')+'</button>';
        return '<article class="bag-entry" data-item="'+esc(key)+'"><span class="item-emoji" aria-hidden="true">'+icon+'</span><div class="meta"><b>'+esc(name)+'</b><small>'+esc(desc)+'</small></div><span class="qty" aria-label="Bestand '+amount+'">×'+amount+'</span>'+action+'</article>';
      });
    container.innerHTML = entries.length ? entries.join('') : '<div class="card arimons-empty"><strong>🎒 Deine Tasche ist noch leer.</strong><p>Im AuriMarkt findest du Tränke, Bälle und weitere Gegenstände.</p><button class="smallbtn" data-action="open-travel">Zur Reiseübersicht</button></div>';
  }
  if(typeof renderBag==='function') renderBag = drawInventory;

  // The travel page is a dashboard first, with the full list of places available on demand.
  const travelPage=$id('page-travel');
  const fullList=$id('travel-list');
  const logCard=$id('journal')?.closest('.card');
  if(travelPage && fullList && logCard){
    const regionPanel=document.createElement('details');
    regionPanel.className='arimons-regions';
    regionPanel.innerHTML='<summary><strong>🗺️ Die 10 Reiseorte</strong><small>Orte ansehen und erreichbare Regionen auswählen</small></summary>';
    fullList.parentNode.insertBefore(regionPanel,fullList);
    regionPanel.appendChild(fullList);
    travelPage.insertBefore(logCard,regionPanel);
    // Current progress stays visible near the top; region list no longer takes several screens.
    regionPanel.open=false;
  }

  // Preserves buttons/event delegation while moving older features into clear categories.
  function categoryFor(child){
    if(child.matches('.v51-journal, .v53-report, .v55-travel-card, .v55-endgame-header')) return 'discover';
    if(child.matches('.v52-report, .v52-card, .v4-achievement')) return 'challenges';
    if(child.matches('.v54-travel-card, .v55-plus-info')) return 'collect';
    if(child.matches('.ari04-travel-info')) return 'people';
    return 'progress';
  }
  const sections = [
    ['progress','📋 Dein Fortschritt','Siegel, AuriDex und Reise-Erfolge'],
    ['discover','🗝️ Geschichten & Geheimnisse','Runen, Rätsel, besondere Fundorte und Quests'],
    ['challenges','⚔️ Kämpfe & Herausforderungen','Rivale, Trainer, Training und Liga'],
    ['collect','🏕️ Sammlung & Freizeit','AuriMon-Lager, Fotoalbum, Trophäen und mehr'],
    ['people','🏟️ Menschen der Welt','Prüfhallenleiter und Schattenbund']
  ];
  function groupJournal(){
    const journal = $id('journal');
    if(!journal || journal.classList.contains('arimons-journal'))return;
    const fragment = document.createDocumentFragment();
    const wrappers = new Map();
    for(const [key,title,desc] of sections){
      const card = document.createElement('details');
      card.className = 'arimons-journal-group';
      card.dataset.group = key;
      card.open = openSections.has(key);
      card.innerHTML = '<summary><strong>'+title+'</strong><small>'+desc+'</small></summary><div class="arimons-journal-body"></div>';
      card.addEventListener('toggle',()=>{
        if(card.open)openSections.add(key); else openSections.delete(key);
      });
      fragment.append(card);
      wrappers.set(key,card.querySelector('.arimons-journal-body'));
    }
    const children=[...journal.children];
    for(const child of children){
      wrappers.get(categoryFor(child)).append(child);
    }
    journal.classList.add('arimons-journal');
    journal.append(fragment);
    // Empty categories should not leave dead headers.
    for(const el of [...journal.querySelectorAll('.arimons-journal-group')]){
      if(!el.querySelector('.arimons-journal-body').children.length)el.remove();
    }
  }
  if(typeof renderTravel==='function'){
    const priorRenderTravel = renderTravel;
    renderTravel = function(...args){
      const ret = priorRenderTravel(...args);
      groupJournal();
      return ret;
    };
  }

  // A single reliable image/loading fallback, whether opened in Dex, Team or battle.
  function prepareArt(root=document){
    for(const art of root.querySelectorAll('.art')){
      const img = art.querySelector('img');
      if(!img){art.classList.remove('loaded');continue;}
      if(img.complete && img.naturalWidth>0){art.classList.add('loaded');}
      else if(img.complete && img.naturalWidth===0){art.classList.remove('loaded');img.style.display='none';}
    }
  }
  const observer = new MutationObserver(records=>{
    const added=[];
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===1)added.push(node);
      }
    }
    for(const el of added){
      if(el.matches?.('.art'))prepareArt(el.parentElement||document);
      else if(el.querySelector?.('.art'))prepareArt(el);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
  prepareArt();

  // Keep keyboard behavior consistent when the player navigates between pages.
  const tabs = $id('app')?.querySelector('.tabs');
  if(tabs){
    tabs.addEventListener('click',e=>{
      const btn = e.target.closest('button[data-page]');
      if(!btn)return;
      const main = document.querySelector('#app .main');
      if(main)requestAnimationFrame(()=>{main.scrollTop=0;});
    });
  }

  // Avoid unnecessary animation on reduced-motion devices and keep tooltips native.
  document.querySelectorAll('[data-action="stuck-center"]').forEach(b=>b.title='Nur benutzen, wenn du feststeckst. Bringt dich zum nächsten AuriCenter.');
  document.querySelectorAll('[data-action="retro-menu"]').forEach(b=>b.title='Spielmenü öffnen');
  versionBadge();
  window.AriMonsQA = Object.freeze({release:RELEASE,renderBagOwnedOnly:true,travelGroups:true,imageFallback:true});
})();
