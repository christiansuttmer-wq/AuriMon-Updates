/* Tablet-Bedienung v4.2 – weiterhin ausschließlich 151 Arten. */
'use strict';
(() => {
  let active=null, repeatTimeout=null, repeatInterval=null, swallow=null;
  const deltas={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
  const stop=() => {if(repeatTimeout!==null)clearTimeout(repeatTimeout);if(repeatInterval!==null)clearInterval(repeatInterval);repeatTimeout=null;repeatInterval=null;active=null;};
  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest('button[data-dir]');
    if(!button||button.disabled||event.button!==0)return;
    stop();active=button;const direction=button.dataset.dir,move=deltas[direction];if(!move)return;
    swallow={button,at:Date.now()};
    button.setPointerCapture?.(event.pointerId);
    walk(...move);
    repeatTimeout=setTimeout(()=>{if(active!==button)return;repeatInterval=setInterval(()=>{
      if(active!==button||modalOpen||battle||currentPage!=='world'){stop();return;}
      walk(...move);
    },160);},260);
    event.preventDefault();
  });
  document.addEventListener('pointerup',stop);
  document.addEventListener('pointercancel',stop);
  window.addEventListener('blur',stop);
  document.addEventListener('click',event=>{
    const button=event.target.closest('button[data-dir]');
    if(button&&swallow?.button===button&&Date.now()-swallow.at<1600){event.preventDefault();event.stopImmediatePropagation();swallow=null;}
  },true);
  let lastCamera='';
  const fit=()=>{const current=v42Camera().join('x');if(current!==lastCamera){lastCamera=current;if(typeof renderMap==='function'&&state.starterChosen)renderMap();}};
  window.addEventListener('resize',fit,{passive:true});
  window.addEventListener('orientationchange',fit,{passive:true});
  fit();
  window.PokemonGame.tabletVersion='4.3.0';
})();
