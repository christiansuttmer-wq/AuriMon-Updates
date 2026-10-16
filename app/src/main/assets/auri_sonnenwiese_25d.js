/* AuriMon Sonnenwiese 2.5D – graphics-only pilot, version 1.3.27.
 * IMPORTANT: no writes to state/localStorage, no edits to tile data or collision logic.
 * Only zone 0 outside buildings/dungeons uses this painter; other 19 zones unchanged.
 */
'use strict';
(() => {
  const TAU = Math.PI * 2, SIZE = 48;
  const W = 18, H = 11;
  const HOUSES = [
    {id:'center',x:1,y:1,label:'AURI CENTER',roof:'#cd6471',light:'#f1a4a7'},
    {id:'market',x:1,y:6,label:'AURI MARKT',roof:'#398da1',light:'#8bc9cb'},
    {id:'gym',x:10,y:1,label:'PRÜFHALLE',roof:'#7464aa',light:'#b0a3d8'},
    {id:'house',x:5,y:1,label:'GASTHAUS',roof:'#b87855',light:'#e1ad81'},
    {id:'atelier',x:9,y:6,label:'WERKSTATT',roof:'#8b6787',light:'#c99ebb'},
  ];
  const hash = (x,y,s=0) => {
    let n = Math.imul(x+101,374761393)^Math.imul(y+71,668265263)^Math.imul(s+7,2246822519);
    n = Math.imul(n^(n>>>13),1274126177);
    return ((n^(n>>>16))>>>0)/4294967295;
  };
  const smooth = t => t*t*(3-2*t);
  const noise = (x,y,scale,s) => {
    const u=x/scale,v=y/scale,i=Math.floor(u),j=Math.floor(v),fx=smooth(u-i),fy=smooth(v-j);
    const a=hash(i,j,s),b=hash(i+1,j,s),c=hash(i,j+1,s),d=hash(i+1,j+1,s);
    return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
  };
  const ellipse=(c,x,y,rx,ry,color,a=1)=>{c.save();c.globalAlpha=a;c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();c.restore();};
  const poly=(c,coords,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(coords[0][0],coords[0][1]);for(let i=1;i<coords.length;i++)c.lineTo(coords[i][0],coords[i][1]);c.closePath();c.fill()};
  const pathType = t => t==='path'||t==='portal'||t==='trainer'||t==='loot'||t==='treasure'||t==='cave'||t==='safari'||t==='rocketteam'||t==='legend'||t==='center'||t==='market'||t==='gym'||String(t).startsWith('v56-door');
  const model = (c,view,tileAt) => {
    const cols = view.w,rows=view.h,types=new Array(cols*rows),roads=new Uint8Array(cols*rows);
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const wx=view.x0+i,wy=view.y0+j, t=tileAt(wx,wy),n=j*cols+i;
      types[n]=t;
      roads[n]=pathType(t)?1:0;
    }
    return {types,roads};
  };
  function backdrop(c,view,types,roads){
    const WW=view.w*SIZE,HH=view.h*SIZE,raw=c.createImageData(WW,HH),a=raw.data;
    // Continuous height-free pixel shading: no tile-edge gradients or borders.
    const road=(i,j)=>i>=0&&i<view.w&&j>=0&&j<view.h&&roads[j*view.w+i];
    for(let y=0;y<HH;y++)for(let x=0;x<WW;x++){
      const i=Math.floor(x/SIZE),j=Math.floor(y/SIZE),lx=x%SIZE-SIZE/2,ly=y%SIZE-SIZE/2;
      const worldX=x+view.x0*SIZE,worldY=y+view.y0*SIZE;
      const broad=noise(worldX,worldY,210,1),medium=noise(worldX,worldY,58,2),micro=noise(worldX,worldY,13,3);
      const jitter=(noise(worldX,worldY,24,4)-.5)*4+(micro-.5)*2.5;
      const r=!!road(i,j),L=!!road(i-1,j),R=!!road(i+1,j),U=!!road(i,j-1),D=!!road(i,j+1);
      const core = Math.hypot(lx,ly);
      let roadDist=Math.min(
        r?core:1e3,
        r&&L&&lx<0?Math.abs(ly):1e3,r&&R&&lx>0?Math.abs(ly):1e3,
        r&&U&&ly<0?Math.abs(lx):1e3,r&&D&&ly>0?Math.abs(lx):1e3,
        !r&&L&&lx<0?Math.hypot(lx+SIZE,ly):1e3,
        !r&&R&&lx>0?Math.hypot(lx-SIZE,ly):1e3,
        !r&&U&&ly<0?Math.hypot(lx,ly+SIZE):1e3,
        !r&&D&&ly>0?Math.hypot(lx,ly-SIZE):1e3
      );
      // Fill the inner corner of any solid 2×2 junction; avoids checkerboard lawn holes.
      if (r) {
        const sx=lx<0?-1:1, sy=ly<0?-1:1;
        if (road(i+sx,j)&&road(i,j+sy)&&road(i+sx,j+sy)) roadDist=0;
      }
      // Wider connecting strips never change walkability – they are graphics only.
      const roadRadius=23+jitter,edge=roadDist-roadRadius;
      const blend=Math.max(0,Math.min(1,(2-edge)/5));
      const meadow=Math.round((broad-.5)*17+(medium-.5)*17+(micro-.5)*10);
      const fieldTint=(medium>.61?6:0);
      const gr=[104+meadow-fieldTint,174+meadow,91+meadow-fieldTint];
      const pathTint=Math.round((medium-.5)*10+(micro-.5)*9);
      const sand=[226+pathTint,201+pathTint,153+pathTint];
      const k=(y*WW+x)*4;
      for(let ch=0;ch<3;ch++)a[k+ch]=Math.max(0,Math.min(255,Math.round(gr[ch]*(1-blend)+sand[ch]*blend)));
      a[k+3]=255;
    }
    c.putImageData(raw,0,0);
    // Organic light spots reach across neighbouring tiles.
    for(let y=12;y<HH;y+=79)for(let x=18;x<WW;x+=93){
      const wx=x+view.x0*SIZE,wy=y+view.y0*SIZE;
      const ox=x+(hash(wx,wy,9)-.5)*50,oy=y+(hash(wx,wy,10)-.5)*45;
      if(roads[Math.max(0,Math.min(view.h-1,Math.floor(oy/SIZE)))*view.w+Math.max(0,Math.min(view.w-1,Math.floor(ox/SIZE)))])continue;
      const glow=c.createRadialGradient(ox,oy,3,ox,oy,38);glow.addColorStop(0,'rgba(247,251,186,.085)');glow.addColorStop(1,'rgba(247,251,186,0)');c.fillStyle=glow;c.fillRect(ox-38,oy-38,76,76);
    }
  }
  function flora(c,x,y,wx,wy,wild=false){
    const count=wild?9:4;
    for(let k=0;k<count;k++){
      const gx=x+6+hash(wx,wy,20+k)*35,gy=y+11+hash(wx,wy,38+k)*29;
      c.strokeStyle=k%2?'rgba(35,109,56,.53)':'rgba(211,239,137,.66)';c.lineWidth=1.2;
      c.beginPath();c.moveTo(gx,gy+4);c.quadraticCurveTo(gx-2,gy-3,gx+2,gy-8);c.stroke();
      if(k%4===0 && hash(wx,wy,74+k)>.39){
        const pet=['#f9e9a1','#fff4d8','#f1c2d9','#eeb9a3'][Math.floor(hash(wx,wy,k+96)*4)];
        for(let a=0;a<5;a++){const theta=a*TAU/5;ellipse(c,gx+Math.cos(theta)*2.8,gy-8+Math.sin(theta)*2.8,2.2,2,pet,.94)}
        ellipse(c,gx,gy-8,1.8,1.8,'#e8aa55');
      }
    }
  }
  function tree(c,x,y,wx,wy){
    const variation=hash(wx,wy,5),height=variation>.47?36:31,cy=y+35-height*.67;
    ellipse(c,x+27,y+42,20,6,'#174c38',.28);
    c.save();c.translate(x+24,y+35);
    const bark=c.createLinearGradient(-6,0,8,0);bark.addColorStop(0,'#624934');bark.addColorStop(.5,'#a8784e');bark.addColorStop(1,'#674d35');
    c.fillStyle=bark;c.beginPath();c.moveTo(-5,0);c.lineTo(-4,-18);c.quadraticCurveTo(0,-25,5,-19);c.lineTo(6,1);c.closePath();c.fill();c.restore();
    const green=['#2d7650','#3f8e58','#55a75f','#70b971','#9dd888'];
    const shift=variation>.47?3:0;
    for(const [ax,ay,rx,ry,cl] of [[-11,10,18,15,0],[12,9,18,15,0],[0,0,22,18,1],[-9,-9,16,14,2],[10,-10,16,15,2],[0,-14,17,14,3]]){
      const cx=x+24+ax,cy2=cy+ay-shift;
      const leaf=c.createRadialGradient(cx-5,cy2-6,2,cx,cy2,rx);
      leaf.addColorStop(0,green[Math.min(cl+1,4)]);leaf.addColorStop(1,green[cl]);
      ellipse(c,cx,cy2,rx,ry,leaf);
    }
    for(let k=0;k<4;k++)ellipse(c,x+16+hash(wx,wy,100+k)*18,cy-12+hash(wx,wy,110+k)*12,3,2.3,'#c9eaa2',.38);
  }
  function rock(c,x,y,wx,wy){
    ellipse(c,x+25,y+37,21,7,'#355046',.24);
    poly(c,[[x+6,y+31],[x+13,y+17],[x+32,y+12],[x+43,y+27],[x+37,y+39],[x+11,y+40]],'#7e948a');
    poly(c,[[x+13,y+17],[x+32,y+12],[x+23,y+28],[x+6,y+31]],'#c4d2ba');
    poly(c,[[x+32,y+12],[x+43,y+27],[x+37,y+39],[x+23,y+28]],'#667d79');
    poly(c,[[x+6,y+31],[x+23,y+28],[x+37,y+39],[x+11,y+40]],'#a0b0a4');
  }
  function portal(c,x,y,side){
    ellipse(c,x+24,y+41,21,6,'#244f3d',.28);
    c.strokeStyle='#827c68';c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(x+10,y+40);c.lineTo(x+10,y+18);c.quadraticCurveTo(x+24,y+3,x+38,y+18);c.lineTo(x+38,y+40);c.stroke();
    c.strokeStyle='#e7ddaa';c.lineWidth=2;c.beginPath();c.moveTo(x+13,y+38);c.lineTo(x+13,y+19);c.quadraticCurveTo(x+24,y+9,x+35,y+19);c.lineTo(x+35,y+38);c.stroke();
    c.font='bold 14px sans-serif';c.textAlign='center';c.fillStyle='#fff4c5';c.fillText(side===0?'‹':'›',x+24,y+31);
  }
  function decor(c,view,types,roads,tileAt,pal){
    for(let j=0;j<view.h;j++)for(let i=0;i<view.w;i++){
      const wx=i+view.x0,wy=j+view.y0,x=i*SIZE,y=j*SIZE,t=types[j*view.w+i];
      if(t==='tree'||t==='wall'){tree(c,x,y,wx,wy);continue}
      if(t==='rock'){rock(c,x,y,wx,wy);continue}
      if(t==='portal'){portal(c,x,y,wx===0?0:1);continue}
      if(t==='grass'||t==='wild')flora(c,x,y,wx,wy,t==='wild');
      if(t==='path'&&hash(wx,wy,99)>.84){
        ellipse(c,x+8,y+12,3.4,1.8,'#ac926e',.46);ellipse(c,x+37,y+36,2.4,1.4,'#fff4c8',.55);
      }
      // Keep all special interactive scene markers, quests and treasure visuals.
      if(window.PokemonWorld51?.paintTile)window.PokemonWorld51.paintTile(c,x,y,t,SIZE,pal,wx,wy);
    }
  }
  function building(c,view,b){
    const x=(b.x-view.x0)*SIZE,y=(b.y-view.y0)*SIZE,w=144;
    const wall=b.id==='gym'?'#ddd9c9':b.id==='center'?'#f5e5d5':b.id==='market'?'#efe1c7':b.id==='house'?'#f5dcbd':'#e9d3c5';
    // Low 2.5D camera: wall thickness, raised gable roof, eaves and soft ground shadow.
    ellipse(c,x+w/2+4,y+93,79,12,'#233e2d',.27);
    const foundation=c.createLinearGradient(x,y+43,x,y+95);foundation.addColorStop(0,'#f2d7ae');foundation.addColorStop(1,'#917b66');
    poly(c,[[x+12,y+44],[x+134,y+44],[x+133,y+86],[x+126,y+92],[x+12,y+89]],wall);
    poly(c,[[x+134,y+44],[x+143,y+38],[x+142,y+82],[x+133,y+88]],'#967c68');
    c.strokeStyle='rgba(109,84,61,.22)';c.lineWidth=1;
    for(let yy=55;yy<87;yy+=10){c.beginPath();c.moveTo(x+13, y+yy);c.lineTo(x+132,y+yy);c.stroke()}
    const roofShadow='#554a55';
    poly(c,[[x+3,y+43],[x+35,y+12],[x+107,y+12],[x+141,y+43],[x+134,y+49],[x+10,y+49]],roofShadow);
    const roof=c.createLinearGradient(x,y+4,x,y+43);roof.addColorStop(0,b.light);roof.addColorStop(.65,b.roof);roof.addColorStop(1,'#544754');
    poly(c,[[x+5,y+39],[x+35,y+9],[x+108,y+9],[x+140,y+39],[x+134,y+43],[x+12,y+43]],roof);
    c.strokeStyle='rgba(255,245,220,.43)';c.lineWidth=2;c.beginPath();c.moveTo(x+37,y+12);c.lineTo(x+106,y+12);c.stroke();
    for(let row=0;row<3;row++)for(let k=0;k<10;k++){
      const qx=x+20+k*11+row*3,qy=y+24+row*5;
      if(qx>x+126)continue;c.strokeStyle='rgba(42,40,63,.16)';c.lineWidth=1.1;c.beginPath();c.moveTo(qx,qy);c.lineTo(qx+8,qy);c.stroke();
    }
    // Windows and one strictly centered south-facing doorway.
    for(const ox of [27,102]){
      c.fillStyle='#766451';c.fillRect(x+ox-3,y+54,23,24);
      const glass=c.createLinearGradient(x+ox,y+56,x+ox+18,y+76);glass.addColorStop(0,'#d1f3e3');glass.addColorStop(1,'#579da9');
      c.fillStyle=glass;c.fillRect(x+ox,y+56,17,19);c.strokeStyle='#f4ead0';c.lineWidth=2;c.strokeRect(x+ox,y+56,17,19);
      c.beginPath();c.moveTo(x+ox+8.5,y+56);c.lineTo(x+ox+8.5,y+75);c.stroke();
    }
    poly(c,[[x+59,y+60],[x+85,y+60],[x+85,y+90],[x+59,y+90]],'#6f554b');
    poly(c,[[x+63,y+63],[x+81,y+63],[x+81,y+88],[x+63,y+88]],'#9e7356');
    ellipse(c,x+78,y+77,1.9,1.9,'#fae9a6');
    poly(c,[[x+55,y+89],[x+89,y+89],[x+96,y+95],[x+49,y+95]],'#e7d2a6');
    // Detailed roof insignia without introducing text labels that obscure scenery.
    if(b.id==='center'){
      c.fillStyle='#fffcf1';c.fillRect(x+68,y+20,8,19);c.fillRect(x+63,y+25,18,9);
    }else if(b.id==='gym'){
      poly(c,[[x+72,y+17],[x+81,y+22],[x+78,y+33],[x+72,y+38],[x+66,y+33],[x+63,y+22]],'#f6dfa2');
    }else if(b.id==='market'){
      c.fillStyle='#e9ffde';c.fillRect(x+63,y+24,19,7);c.fillStyle='#4f9775';c.fillRect(x+66,y+26,13,3);
    }else if(b.id==='atelier'){
      c.strokeStyle='#ffe3a8';c.lineWidth=3;c.beginPath();c.moveTo(x+68,y+24);c.lineTo(x+78,y+31);c.moveTo(x+75,y+21);c.lineTo(x+66,y+34);c.stroke();
    }else {ellipse(c,x+72,y+28,9,5,'#ffe6bd');}
  }
  function paint(c,view,tileAt,pal){
    const {types,roads}=model(c,view,tileAt);
    backdrop(c,view,types,roads);
    decor(c,view,types,roads,tileAt,pal);
    // The real footprint and interaction coordinates come from v5_6.js.
    for(const b of HOUSES)building(c,view,b);
  }
  const info={version:'1.3.27',zone:0,style:'Sonnenwiese 2.5D',tileSize:SIZE,
    enabled:()=>typeof state!=='undefined'&&state.zone===0&&!state.dungeon&&!state.v51Indoor,
    render:paint,
    buildings:HOUSES.map(({id,x,y})=>({id,x,y,width:3,height:2,doorX:x+1,doorY:y+1}))};
  window.AuriSun25=Object.freeze(info);
})();
