/* AuriMon 1.3.3 display and map metadata, no game-save resets. */
(() => {
  const update = () => {
    const brand=document.querySelector('.brand span');
    if(brand)brand.textContent='20 ORTE · 151 AURIMON · VERSION 1.3.3';
    if(window.AriMons)window.AriMons.version='1.3.3';
    if(window.PokemonGame)window.PokemonGame.mapSize={width:18,height:11,viewWidth:18,viewHeight:11};
  };
  update();
  window.addEventListener('resize',update);
})();
