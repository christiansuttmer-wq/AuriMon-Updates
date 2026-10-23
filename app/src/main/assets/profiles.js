/* AuriMon 4.3.1 – kompakter Spielstart, sechs getrennte Spielerprofile. */
'use strict';
(() => {
  const TOTAL=6;
  const PREFIX='pokemon_abenteuer_v43_';
  const slotKey=i=>PREFIX+'player_'+i;
  const backupKey=(i,s=api.activeSlot)=>PREFIX+'backup_'+s+'_'+i;
  const MIGRATION_KEY=PREFIX+'migration_done';
  let deleteCandidate=null;
  let pickerMode='home';
  let storageFault=false;
  const api={activeSlot:null,slotKey,backupKey,showStorageError:()=>{storageFault=true; if(picker&&!picker.hidden)draw();else toast('⚠️ Speichern nicht möglich! Speicherplatz prüfen.');}};
  window.PokemonProfiles=api;
  // Die v4-Erweiterung legte einige Felder nur einmal beim Start an.
  // Bei mehreren Profilen MUSS jeder neue/laufende Spielstand alle Erweiterungsfelder bekommen.
  const previousDefaultState=defaultState;
  defaultState=function(){
    const s=previousDefaultState();
    return {...s,shards:[],rocketWins:[],leagueWins:[],caveSolved:[],
      dungeon:null,safariActive:false,safariSteps:0,bicycle:false,
      followerUid:null,achievements:[],questClaims:[],daily:null,
      leagueDone:false,storyFlags:[]};
  };
  const picker=document.createElement('div');
  picker.id='player-picker';picker.className='player-picker-overlay';picker.hidden=true;
  picker.setAttribute('role','region');picker.setAttribute('aria-label','Spielerprofile auswählen');
  document.body.appendChild(picker);

  const read = key=>{try {return localStorage.getItem(key)}catch(e){storageFault=true;return null}};
  const write = (key,val)=>{try{localStorage.setItem(key,val);return true}catch(e){storageFault=true;console.warn('Spielstand-Speicherfehler',e);return false}};
  const escape = str=>String(str||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const validState = data => !!data && typeof data==='object' && Array.isArray(data.party) && Array.isArray(data.caught) && (!data.party.some(p=>!POKE[p.id]));
  const slotData=i=>{try{const data=JSON.parse(read(slotKey(i))||'null');return validState(data)?data:null}catch{return null}};

  function migrateOnce(){
    if(read(MIGRATION_KEY)==='1')return;
    // Niemals vorhandene Spielerprofile überschreiben. Originale nicht löschen.
    const oldKeys=[KEY,PREVKEY,OLDKEY];
    let candidate=null;
    for(const key of oldKeys){
      const raw=read(key);if(!raw)continue;
      try{
        const parsed=JSON.parse(raw);
        if(validState(parsed)){candidate=parsed;break}
        if(key===OLDKEY && Array.isArray(parsed?.owned)){candidate=migrate(parsed);break}
      }catch(e){console.warn('Alten Spielstand nicht lesbar',key,e)}
    }
    if(candidate&&!read(slotKey(1))){
      if(!write(slotKey(1),JSON.stringify(candidate)))return;
    }
    // Die bisherigen drei Backup-Kopien werden Profil 1 zugeordnet.
    for(let i=1;i<=3;i++){
      const old=read('aurelio_v4_slot_'+i);
      if(old&&!read(backupKey(i,1))){if(!write(backupKey(i,1),old))return;}
    }
    write(MIGRATION_KEY,'1');
  }

  function setPageWorld(){
    currentPage='world';
    document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-world'));
    document.querySelectorAll('.tabs button').forEach(e=>e.classList.toggle('selected',e.dataset.page==='world'));
    $('.main')?.scrollTo?.(0,0);
  }
  function hideOtherScreens(){
    modalOpen=false;battle=null;
    $('modal-overlay').classList.add('hidden');$('battle-overlay').classList.add('hidden');
    $('modal-content').innerHTML='';
    setPageWorld();
  }
  function showPicker(){
    if(api.activeSlot){save();}
    api.activeSlot=null;
    hideOtherScreens();
    state=defaultState();v41ScaleSave(state);
    render();
    deleteCandidate=null;
    pickerMode='home';
    picker.hidden=false;
    document.body.style.overflow='hidden';
    modalOpen=true; // Verhindert Spielfiguren-Bewegung hinter der Auswahl.
    draw();
    picker.scrollTop=0;
  }
  function hidePicker(){
    picker.hidden=true;document.body.style.overflow='';
    modalOpen=false;
  }
  // Startseite: nur zwei große Aktionen. Existierende Spielstände erscheinen erst bei „Laden“.
  function draw(){
    const occupied=Array.from({length:TOTAL},(_,idx)=>{
      const slot=idx+1,raw=read(slotKey(slot)),data=slotData(slot);
      return {slot,raw,data};
    });
    const valid=occupied.filter(p=>p.data);
    const usedCount=occupied.filter(p=>p.raw!==null).length;
    const commonWarning=storageFault?'<p class="player-picker-warning" role="alert">⚠️ Speichern ist momentan nicht möglich. Bitte den Gerätespeicher prüfen.</p>':'';
    const head=(title,description='')=>`<header class="player-picker-heading"><div class="eyebrow">⚡ AURIMON · 1.025 AURIMON</div><h1>${title}</h1>${description?`<p>${description}</p>`:''}</header>`;
    const back='<button type="button" class="picker-back" data-profile-action="back">← Zurück</button>';
    let body='';
    if(pickerMode==='home'){
      body=head('Dein Abenteuer beginnt!','Wähle aus, wie du spielen möchtest.');
      body+=commonWarning+`<div class="profile-start-actions">
        <button type="button" class="profile-big-button new-game" data-profile-action="new"><span class="profile-big-symbol">✦</span><span>Neues Spiel</span></button>
        <button type="button" class="profile-big-button continue-game" data-profile-action="load"><span class="profile-big-symbol">💾</span><span>Spielstand laden</span></button>
      </div><p class="player-picker-footer">${usedCount} von ${TOTAL} Speicherplätzen belegt · Jeder Spieler hat seinen eigenen Fortschritt.</p>`;
    }else if(pickerMode==='load'){
      body=head('Spielstand laden');
      body+=commonWarning;
      body+=valid.length?`<div class="player-name-list" role="list">${valid.map(({slot,data})=>`<div role="listitem"><button type="button" class="player-name-button" data-profile-action="open:${slot}"><span class="player-name-text">${escape(String(data.profileName||'').trim()||'Bisheriger Spielstand')}</span><span class="player-name-arrow" aria-hidden="true">▶</span></button></div>`).join('')}</div>`:'<p class="player-picker-empty">Noch kein Spielstand vorhanden. Starte zuerst ein neues Abenteuer!</p>';
      const corrupt=occupied.filter(p=>p.raw!==null&&!p.data);
      if(corrupt.length)body+='<p class="player-picker-warning">Ein beschädigter Spielstand konnte nicht angezeigt werden. Du kannst ihn unter „Verwalten“ prüfen.</p>';
      body+=`<div class="picker-secondary-actions">${back}<button type="button" class="picker-manage" data-profile-action="manage">⚙ Spielstände verwalten</button></div>`;
    }else{
      body=head('Spielstände verwalten','Hier kannst du einzelne Profile löschen. Andere Spielstände bleiben erhalten.');
      body+=commonWarning;
      if(deleteCandidate){
        const item=occupied.find(p=>p.slot===deleteCandidate);
        const n=String(item?.data?.profileName||'Spielstand '+deleteCandidate);
        body+=`<div class="player-picker-confirm" role="alertdialog" aria-modal="true" aria-label="Spielstand löschen"><h2>⚠️ Spielstand wirklich löschen?</h2><p><b>${escape(n)}</b> und alle drei zugehörigen Sicherungen werden endgültig gelöscht.</p><div class="picker-confirm-actions"><button type="button" data-profile-action="cancel-delete">Abbrechen</button><button type="button" class="remove" data-profile-action="confirm-delete:${deleteCandidate}">Endgültig löschen</button></div></div>`;
      }else{
        const entries=occupied.filter(p=>p.raw!==null);
        body+=entries.length?`<div class="player-manage-list">${entries.map(({slot,data})=>`<div class="player-manage-item"><b>${escape(String(data?.profileName||'').trim()||'Spielstand '+slot)}</b><button type="button" data-profile-action="ask-delete:${slot}" aria-label="Spielstand ${slot} löschen">🗑️ Löschen</button></div>`).join('')}</div>`:'<p class="player-picker-empty">Es gibt noch keine Spielstände.</p>';
      }
      body+=`<div class="picker-secondary-actions">${back}</div>`;
    }
    picker.innerHTML=`<div class="player-picker-inner picker-compact picker-mode-${pickerMode}">${body}</div>`;
  }
  function newGame(){
    const free=Array.from({length:TOTAL},(_,idx)=>idx+1).find(i=>read(slotKey(i))===null);
    if(free){chooseSlot(free);return}
    pickerMode='load';draw();
    const notice=document.createElement('p');notice.className='player-picker-warning';
    notice.textContent='Alle sechs Plätze sind belegt. Du kannst einen vorhandenen Spielstand laden oder unter „Spielstände verwalten“ einen Platz freigeben.';
    picker.querySelector('.player-picker-heading').insertAdjacentElement('afterend',notice);
  }
  function chooseSlot(i){
    if(!Number.isInteger(i)||i<1||i>TOTAL)return;
    const raw=read(slotKey(i)),data=slotData(i);
    if(raw&&!data){storageFault=true;draw();window.alert('Dieser Spielstand ist beschädigt. Er wird zum Schutz nicht überschrieben.');return}
    api.activeSlot=i;
    hidePicker();hideOtherScreens();
    if(data){
      try{
        // Verwendet bestehende Validierung, Entwicklungs- und Karten-Migration.
        v4SafeLoad(data);
        if(!v41HasProfile())v41ProfileScreen();
      }catch(e){
        console.error('Spielstand laden fehlgeschlagen',e);
        api.activeSlot=null;picker.hidden=false;modalOpen=true;storageFault=true;draw();
        window.alert('Spielstand konnte nicht geöffnet werden. Die gespeicherten Daten bleiben unverändert.');
        return;
      }
    }else{
      state=defaultState();v41ScaleSave(state);render();
      v41ProfileScreen();
      // Abbrechen, ohne einen leeren Spielstand anzulegen.
      $('modal-content').insertAdjacentHTML('beforeend','<button class="btn ghost" data-action="profile-return">↩ Zur Spielerauswahl</button>');
    }
    write(PREFIX+'last_player',String(i));
  }
  function deleteSlot(i){
    if(i!==deleteCandidate||i===api.activeSlot)return;
    try{
      localStorage.removeItem(slotKey(i));
      for(let j=1;j<=3;j++)localStorage.removeItem(backupKey(j,i));
    }catch(e){storageFault=true;console.warn(e)}
    deleteCandidate=null;draw();
  }
  picker.addEventListener('click',event=>{
    const button=event.target.closest('button[data-profile-action]');if(!button)return;
    event.preventDefault();event.stopPropagation();
    const [action,param]=button.dataset.profileAction.split(':');const slot=Number(param);
    if(action==='new')newGame();
    if(action==='load'){pickerMode='load';deleteCandidate=null;draw();}
    if(action==='manage'){pickerMode='manage';deleteCandidate=null;draw();}
    if(action==='back'){pickerMode=pickerMode==='manage'?'load':'home';deleteCandidate=null;draw();}
    if(action==='open')chooseSlot(slot);
    if(action==='ask-delete'){deleteCandidate=slot;draw();picker.scrollTop=0;}
    if(action==='cancel-delete'){deleteCandidate=null;draw();}
    if(action==='confirm-delete')deleteSlot(slot);
  });

  const oldAction=doAction;
  doAction=function(action,el){
    if(action==='profile-switch')return showPicker();
    if(action==='profile-return'){api.activeSlot=null;return showPicker()}
    return oldAction(action,el);
  };
  const originalReset=confirmReset;
  confirmReset=function(){
    if(!api.activeSlot)return showPicker();
    const name=state.profileName,gender=state.profileGender;
    state=defaultState();v41ScaleSave(state);
    state.profileName=name||'';state.profileGender=gender||'';
    hideOtherScreens();save();render();starterScreen();
  };
  const priorLoad=v4SafeLoad;
  v4SafeLoad=function(data){
    if(!api.activeSlot)throw Error('Zuerst Spielerprofil auswählen.');
    const ownName=state.profileName,ownGender=state.profileGender;
    const imported=JSON.parse(JSON.stringify(data));
    // Fremde Backup-Dateien dürfen nicht den Namen oder die Figur ersetzen.
    if(v41HasProfile()){imported.profileName=ownName;imported.profileGender=ownGender;}
    priorLoad(imported);
  };
  const originalResetGame=resetGame;
  resetGame=function(){
    modal('⚠️ Eigenes Abenteuer zurücksetzen',
      'Nur der Fortschritt dieses Spielerprofils wird zurückgesetzt. Name und Figur bleiben erhalten; andere Spieler sind nicht betroffen.',
      [['Abbrechen','close'],['Mein Abenteuer neu beginnen','confirm-reset','gold']]);
  };
  // Direkte Prüfschnittstelle für lokale Funktionstests.
  api.showPicker=showPicker;api.select=chooseSlot;api.inspect=i=>slotData(i);
  api.current=()=>api.activeSlot;
  migrateOnce();
  showPicker();
})();
