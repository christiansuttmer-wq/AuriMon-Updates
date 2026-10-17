/* AuriMon - premium trainer and NPC sprites v0.5.6 */
'use strict';
(() => {
  const world = window.PokemonWorld56;
  if(!world) return;

  const SKINS = ['#f2d8c2','#efc9ab','#d79e79','#bc7f5d','#f0dfd1','#cf946b'];
  const HAIRS = ['#293a58','#513223','#d0aa65','#7742a4','#b76674','#305863','#151515','#a86d31','#7082a5'];
  const CLOTH = ['#4aa0e1','#53b38d','#8b74e2','#dc728d','#d9a04d','#4f6fd2','#5ba4b2','#aa6c4d'];
  const TROUSERS = ['#4f5b72','#55694f','#66556e','#6b5648','#365362','#434f63'];
  const METAL = '#24364d';

  const heroPalettes = {
    boy: { skin:'#efc09d', hair:'#33527c', shirt:'#2ea3dd', trim:'#ffe68b', jacket:'#3d6797', pants:'#30465e', shoe:'#1f3045', accent:'#68e2ff' },
    girl:{ skin:'#f1d1b9', hair:'#e9dcc8', shirt:'#f265ab', trim:'#ffe69a', jacket:'#8d5be2', pants:'#4b506c', shoe:'#203149', accent:'#7ef2ff' }
  };

  function rr(c,x,y,w,h,r,fill,stroke,lw=1){ c.beginPath(); c.fillStyle=fill; c.roundRect(x,y,w,h,r); c.fill(); if(stroke){ c.lineWidth=lw; c.strokeStyle=stroke; c.stroke(); } }
  function el(c,x,y,rx,ry,fill,a=1){ c.save(); c.globalAlpha=a; c.fillStyle=fill; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill(); c.restore(); }
  function path(c,pts,fill,stroke,lw=1,close=true){ c.beginPath(); c.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]); if(close) c.closePath(); if(fill){ c.fillStyle=fill; c.fill(); } if(stroke){ c.lineWidth=lw; c.strokeStyle=stroke; c.stroke(); } }
  function line(c,pts,stroke,lw=1){ c.beginPath(); c.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]); c.lineWidth=lw; c.strokeStyle=stroke; c.lineCap='round'; c.stroke(); }

  function getPalette(seed, hero, gender){
    if(hero) return heroPalettes[gender === 'girl' ? 'girl' : 'boy'];
    return {
      skin: SKINS[seed % SKINS.length],
      hair: HAIRS[(seed * 3) % HAIRS.length],
      shirt: CLOTH[(seed * 5) % CLOTH.length],
      trim: ['#f6e19d','#d8f2ff','#ffd9ea','#d9f4db','#efe0ff'][(seed * 7) % 5],
      jacket: ['#537b91','#607d52','#78609b','#9b5f76','#8f704b','#577596'][(seed * 11) % 6],
      pants: TROUSERS[(seed * 13) % TROUSERS.length],
      shoe: '#243446',
      accent: ['#7de9ff','#9ff5ba','#ffd27d','#c8a9ff','#ffa8bf'][(seed * 17) % 5]
    };
  }

  function drawHair(c,p,dir,gender,hero){
    const hc=p.hair;
    if(gender === 'girl'){
      rr(c,-8.5,-33.5,17,7.5,5,hc);
      rr(c,-10.2,-29.2,4.6,11,2.3,hc);
      rr(c,5.6,-29.2,4.6,11,2.3,hc);
      rr(c,-2.2,-36,4.4,3.2,2,p.trim);
      if(dir === 'up'){ rr(c,-7.2,-34.2,14.4,9,4,hc); }
      if(hero){ line(c,[[-6.8,-31.8],[-4.4,-24]],p.trim,1.4); line(c,[[6.8,-31.8],[4.4,-24]],p.trim,1.4); }
    }else{
      rr(c,-8.6,-33.5,17.2,8.4,5,hc);
      path(c,[[-8,-29],[-4,-33],[0,-31],[4,-34],[8,-29],[8,-25],[-8,-25]],hc);
      if(hero){ rr(c,-8.8,-35.4,17.6,2.2,1.2,p.trim); }
      if(dir === 'up'){ rr(c,-8,-33.2,16,8.2,4,hc); }
    }
  }

  function drawFace(c,p,dir){
    rr(c,-7,-30,14,14,5,p.skin,'rgba(32,48,68,.18)',0.65);
    rr(c,-3,-17.5,6,3,1.2,p.skin);
    const eyeCol='#233547';
    if(dir === 'down'){
      rr(c,-4.7,-24.4,2.25,2.7,1,eyeCol); rr(c,2.45,-24.4,2.25,2.7,1,eyeCol);
      rr(c,-2.3,-20.2,4.6,1.5,1,'#bc6c74');
    } else if(dir === 'left'){
      rr(c,-4.9,-24.3,2.5,2.7,1,eyeCol); rr(c,-1.9,-20.2,3.9,1.45,1,'#bc6c74');
    } else if(dir === 'right'){
      rr(c,2.4,-24.3,2.5,2.7,1,eyeCol); rr(c,-2.0,-20.2,3.9,1.45,1,'#bc6c74');
    }
  }

  function drawPlayerExtras(c,p,gender){
    rr(c,-8.7,-15.2,17.4,4,2,p.trim);
    rr(c,-1.6,-15.2,3.2,10.4,1.2,p.trim);
    // backpack strap + backpack
    rr(c,-7.8,-12.5,2.4,12.5,1,'rgba(255,255,255,.26)');
    rr(c,5.4,-4.5,7.4,8.6,2,'#805c3d');
    rr(c,6.3,-5.5,1.6,9.4,1,'#d7ae88');
    if(gender === 'girl') rr(c,-8.6,-3,4.2,7.2,1.8,p.jacket);
  }

  function drawNpcRole(c, role, p){
    switch(role){
      case 0: // scout / trainer
        rr(c,-8.6,-14,17.2,4,2,'#f7e39a');
        rr(c,5.7,-4,6.2,7.4,2,'#56725d');
        break;
      case 1: // scholar
        rr(c,-9,-16,18,19,3,'#edf3f7','rgba(18,31,45,.13)',0.8);
        rr(c,-1.6,-16,3.2,18,1.2,p.shirt);
        rr(c,-5.5,-24.3,4.8,1.8,.8,'#9fcfe6'); rr(c,.7,-24.3,4.8,1.8,.8,'#9fcfe6'); line(c,[[-.8,-23.4],[.8,-23.4]],'#43596f',1);
        break;
      case 2: // hiker
        rr(c,-11,-8.6,3.5,14.2,1.6,'#9d6b4d');
        rr(c,6.6,-3.6,5.7,7.4,1.8,'#785143');
        line(c,[[-0.5,-14.5],[-5.1,0]],'#e6ccaa',1.9);
        break;
      case 3: // merchant
        rr(c,-6.8,-12,13.6,14.8,2.6,'#dcc294'); rr(c,-1.4,-11.5,2.8,14,1,'#f5ead2');
        break;
      case 4: // medic
        rr(c,-9,-16,18,19,3,'#fff','rgba(18,31,45,.14)',0.85); rr(c,-4.2,-9.5,8.4,8.4,1.8,'#ffffff','rgba(18,31,45,.1)',0.5);
        rr(c,-1,-8.8,2,7.2,1,'#ea6f83'); rr(c,-3.6,-6.2,7.2,2,1,'#ea6f83');
        break;
      default: // tamer / guide
        rr(c,-8.6,-14,17.2,4,2,'#fff0a8'); rr(c,-1.35,-14,2.7,10,1,'#fff0a8'); rr(c,5.9,-4,6.2,7.2,1.8,'#677d5f');
        break;
    }
  }

  function drawBody(c,p,dir,hero,gender,role,step){
    el(c,0,17,hero?14:12.5,5.2,hero?'rgba(95,226,255,.23)':'rgba(14,23,35,.17)');
    if(hero){ el(c,0,17,9.6,3.4,'rgba(255,255,255,.18)'); }

    // legs
    const stepL = Math.sin(step) * 0.9;
    const stepR = Math.sin(step + Math.PI) * 0.9;
    rr(c,-6,-0.5+stepL,4.8,14.6,2,p.pants);
    rr(c,1.2,-0.5+stepR,4.8,14.6,2,p.pants);
    rr(c,-8.6,12.8+stepL,7.6,3.9,1.8,p.shoe);
    rr(c,0.8,12.8+stepR,7.6,3.9,1.8,p.shoe);

    // torso
    rr(c,-8.7,-16.3,17.4,20.8,4.9,hero?p.jacket:p.shirt,'rgba(23,36,51,.17)',0.8);
    rr(c,-7.1,-14.3,14.2,8,2.7,p.shirt);
    rr(c,-1.6,-16.3,3.2,20.6,1.3,p.trim);
    rr(c,-5.8,-14.8,11.6,2.5,1.1,'rgba(255,255,255,.12)');

    // arms
    if(dir === 'left'){
      rr(c,-12.3,-11.5,4.2,13.8,2,p.skin); rr(c,7.8,-10.7,3.4,12.7,2,p.skin);
    } else if(dir === 'right'){
      rr(c,-11.2,-10.7,3.4,12.7,2,p.skin); rr(c,8.1,-11.5,4.2,13.8,2,p.skin);
    } else {
      rr(c,-11.4,-10.7,3.5,12.6,2,p.skin); rr(c,7.9,-10.7,3.5,12.6,2,p.skin);
    }

    hero ? drawPlayerExtras(c,p,gender) : drawNpcRole(c,role,p);
  }

  function drawMarker(c){
    c.save();
    c.fillStyle='#7df0ff';
    path(c,[[0,-43],[-5.5,-35.8],[0,-29],[5.5,-35.8]],'#7df0ff');
    line(c,[[0,-42],[0,-36]],'#ffffff',1.3);
    c.strokeStyle='rgba(125,240,255,.65)'; c.lineWidth=1.15; c.beginPath(); c.ellipse(0,-7,14.4,25.8,0,0,Math.PI*2); c.stroke();
    c.restore();
  }

  function drawCharacter(c,cx,cy,gender='boy',dir='down',walkTime=0,enemy=false,seed=0,role=0){
    const hero = !enemy;
    const p = getPalette(Math.abs(seed||0), hero, gender);
    const bob = Math.sin((walkTime || 0) * 0.012) * 0.85;
    const step = (walkTime || 0) * 0.016;
    c.save();
    c.translate(Math.round(cx), Math.round(cy + bob));
    drawBody(c,p,dir,hero,gender,role,step);
    drawFace(c,p,dir);
    drawHair(c,p,dir,gender,hero);
    if(hero) drawMarker(c);
    c.restore();
    return true;
  }

  // Gleiche Original-Pixelsprites auch auf klassischen Karten/Innenraeumen.
  const heroAtlas = (typeof Image === 'function') ? new Image() : null;
  if(heroAtlas){
    heroAtlas.onload=()=>{window.PokemonGame?.hd?.forceRedraw?.();};
    heroAtlas.src='ari_sprites/hero_design_atlas.png';
  }
  world.character = function(c,cx,cy,gender,dir,walkTime,enemy){
    if(!enemy && heroAtlas?.complete && heroAtlas.naturalWidth===224 && heroAtlas.naturalHeight===44){
      const dirs={down:0,left:1,right:2,up:3};
      const frame=(gender==='girl'?4:0)+(dirs[dir]??0);
      c.save(); c.imageSmoothingEnabled=false;
      c.drawImage(heroAtlas,frame*28,0,28,44,Math.round(cx)-20,Math.round(cy)-45,40,64);
      c.restore(); return true;
    }
    return drawCharacter(c,cx,cy,gender,dir,walkTime,enemy,0,0);
  };

  function stableNpcId(n,z){
    const token = String(z)+':'+String(n?.id ?? '')+':'+String(n?.name ?? '')+':'+String(n?.x ?? 0)+':'+String(n?.y ?? 0);
    let v = 2166136261;
    for(let i=0;i<token.length;i++) v = Math.imul(v ^ token.charCodeAt(i), 16777619);
    return v >>> 0;
  }

  world.drawPerson = function(c,x,y,n,z,ms){
    const id = stableNpcId(n,z);
    const gender = (id % 4 === 0 || id % 9 === 0) ? 'girl' : 'boy';
    const role = (id >>> 3) % 6;
    return drawCharacter(c,x,y,gender,this.npcFacing?.(n,z) || 'down',ms || 0,true,id,role);
  };
})();
