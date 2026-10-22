/* AuriMon completion pass: catchable species in all regions, regional field guide.
 * New logic only; the save schema and previously caught creatures are unchanged.
 */
'use strict';
(() => {
  const originalWild = randomWild;
  const sources = ZONE_POOLS.map(ids => [...new Set(ids)].filter(id => !!POKE[id]));
  const isRare = id => !!(POKE[id]?.legendary || POKE[id]?.mythical);
  randomWild = function(zone) {
    if (!Number.isInteger(zone) || zone < 0 || zone >= sources.length || !sources[zone].length)
      return originalWild(zone);
    const regional = sources[zone];
    // Rares still appear, but are much rarer than normal species.
    let eligible = regional.filter(id => !isRare(id) || Math.random() < .07);
    if (!eligible.length) eligible = regional;
    const uncaught = eligible.filter(id => !Array.isArray(state.caught) || !state.caught.includes(id));
    const unseen = uncaught.filter(id => !Array.isArray(state.seen) || !state.seen.includes(id));
    const selection = unseen.length && Math.random() < .58 ? unseen :
      uncaught.length && Math.random() < .65 ? uncaught : eligible;
    const id = choice(selection);
    const levels = AREA_STRENGTH[zone] || AREA_STRENGTH[FINAL_ZONE];
    const creature = newMon(id, rand(levels.wild[0], levels.wild[1]));
    // Keep regional variants that had already been introduced by the form system.
    if (zone >= 10 && Math.random() < .25) {
      const forms = window.AuriFormSystem?.formsFor(id)
        ?.filter(f => ['alola','galar','hisui','paldea'].includes(f.kind) && !f.battleOnly) || [];
      if (forms.length) creature.formKey = choice(forms).key;
    }
    return creature;
  };
  function regionalDex(zone, page) {
    zone = Number(zone);
    if (!Number.isInteger(zone) || zone < 0 || zone >= REGION_COUNT) zone = state.zone;
    const ids = sources[zone], pages = Math.max(1, Math.ceil(ids.length / 8));
    page = Math.min(pages - 1, Math.max(0, Number(page) || 0));
    const seen = new Set(state.seen || []), caught = new Set(state.caught || []);
    const rows = ids.slice(page * 8, page * 8 + 8).map(id => {
      const p = POKE[id], known = seen.has(id) || caught.has(id);
      const icon = caught.has(id) ? '✅' : known ? '👁️' : '❔';
      return '<div class="bag-entry"><b>' + icon + ' #' + String(id).padStart(4,'0') +
        ' ' + (known ? p.name : 'Unentdeckt') + '</b><small>' +
        (known ? p.types.join(' / ') : 'Erkunde diese Region') +
        (known && isRare(id) ? ' · Sehr selten' : '') + '</small></div>';
    }).join('');
    const link = (label,z,p) => '<button class="smallbtn" data-action="regional-dex:' + z + ':' + p + '">' + label + '</button>';
    openModal('<h2>📖 Regionaldex · ' + AREAS[zone].name + '</h2>' +
      '<p>' + ids.length + ' mögliche Wildarten · ' +
      ids.filter(id => caught.has(id)).length + ' gefangen. Auch seltene Pokémon können hier erscheinen.</p>' +
      rows + '<div class="dialog-actions">' +
      (page > 0 ? link('◀ Zurück',zone,page-1) : '') +
      '<span>Seite ' + (page+1) + ' / ' + pages + '</span>' +
      (page+1 < pages ? link('Weiter ▶',zone,page+1) : '') +
      '</div><div class="dialog-actions">' +
      (zone>0?link('◀ Gebiet',zone-1,0):'') +
      (zone+1<REGION_COUNT?link('Nächstes Gebiet ▶',zone+1,0):'') +
      '<button class="btn ghost" data-action="close">Schließen</button></div>');
  }
  const previousAction = doAction;
  doAction = function(action, element) {
    if (typeof action === 'string' && (action === 'regional-dex' || action.startsWith('regional-dex:'))) {
      const [, zone, page] = action.split(':');
      return regionalDex(zone === undefined ? state.zone : zone, page === undefined ? 0 : page);
    }
    return previousAction(action, element);
  };
  // Legacy story modules used to overwrite the current game version and region counts.
  if (typeof document !== 'undefined') {
    const brand = document.querySelector('.brand span[data-game-version]');
    if (brand) {
      const expected = 'DEINE AURIMON-WELT · VERSION ' + brand.dataset.gameVersion;
      const restore = () => { if (brand.textContent !== expected) brand.textContent = expected; };
      restore();
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(restore);
        observer.observe(brand, {childList:true,characterData:true,subtree:true});
      }
    }
  }
  window.AuriFinalPass = {regionCount: sources.length, getRegionalSpecies: zone => (sources[zone] || []).slice()};
})();
