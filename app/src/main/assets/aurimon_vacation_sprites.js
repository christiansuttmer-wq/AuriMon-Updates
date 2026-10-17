/* AuriMon – reine Anzeige-Grafiken, Urlaub-Sprites. Keine Spielstand-Aenderungen. */
(function vacationSpriteFactory(){
'use strict';
const P={
hero_boy:["boy","#28395b","#fff2de","#e75c55","#365f9d","#ed5059","#ffefbc","#a9514b","cap","backpack","stripe"],
hero_girl:["girl","#b0774f","#ffe8d4","#e979a2","#6a93bc","#f39aab","#f8eac0","#8c5ab2","cap","backpack","flower"],
aloha_boy:["boy","#815337","#64d7c9","#3ba1ae","#bea170",null,"#fff4c6","#8f694f","hair","satchel","flower"],
blue_boy:["boy","#365f8b","#fff9ed","#67a9d2","#458abd","#397cd1","#e7f7ff","#8c6a55","cap","backpack","stripe"],
sun_girl:["girl","#775447","#ffecda","#eea69c","#f2ac93","#dcb579","#fa9ab4","#b78d62","straw","satchel","flower"],
explorer:["boy","#6e5145","#a2c89f","#689b72","#ab956e","#6b8b68","#e6c78e","#89684d","straw","camera","flower"],
pink_girl:["girl","#db7099","#ffcede","#ea748e","#eb8c9b",null,"#ffe5a0","#dcb28a","hair","satchel","flower"],
sun_boy:["boy","#2e4565","#ffecac","#efb84f","#486e9b",null,"#fff8d9","#876c56","hair","backpack","flower"],
medic:["girl","#745170","#fff7f4","#dfedf1","#7ab2c4","#fff5f5","#e86c8c","#bfa4a5","cap","satchel","medic"],
rival:["boy","#313d5f","#f8ccbb","#4a6fa9","#405279","#414e83","#fba479","#7a4e5f","cap","backpack","stripe"],
shadow:["boy","#282b41","#45445b","#33334b","#34374d","#26283a","#9f82af","#292b40","cap","backpack","stripe"]
};
const E=(x,y,rx,ry,fill,o=1)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${o}"/>`;
const R=(x,y,w,h,rad,fill,stroke="#35445b",sw=1.5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const D=(d,fill,stroke="#35445b",sw=1.5)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
function render(role,dir){
 const p=P[role]; if(!p)return null;
 const [gender,hair,shirt,jacket,bottom,hat,accent,bag,hatStyle,equipment,pattern]=p;
 const girl=gender==="girl",up=dir==="up",side=dir==="left"||dir==="right",dress=["sun_girl","pink_girl"].includes(role),eyeColour="#243c55";
 const complexion="url(#skin)",top="url(#top)";
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96" width="96" height="144" aria-label="AuriMon ${role} ${dir}">
 <defs><linearGradient id="skin" x2=".9" y2="1"><stop stop-color="#ffe7c9"/><stop offset="1" stop-color="#eab18b"/></linearGradient>
 <linearGradient id="top" x2=".9" y2="1"><stop stop-color="${shirt}"/><stop offset="1" stop-color="${jacket}"/></linearGradient>
 <linearGradient id="cap" x2=".7" y2="1"><stop stop-color="${hat||hair}"/><stop offset="1" stop-color="${hat||hair}"/></linearGradient></defs>
 <g stroke-linejoin="round" stroke-linecap="round">${E(32,90,18,4.3,"#214836",.22)}`;
 // bag placed BEHIND arms and torso
 if(equipment!=="camera")s+=R(41,47,12,30,5,bag)+R(45,52,7,10,2,accent,"#62586a",.8);
 if(up && equipment==="backpack")s+=R(19,45,28,29,5,bag)+R(23,58,20,9,2,accent,"#65566a",.9);
 // shoes & shorts/dress hem
 s+=R(22,72,9,15,2.2,complexion,"#bd8d76",.9)+R(35,72,9,15,2.2,complexion,"#bd8d76",.9);
 if(!dress)s+=R(19,69,12,10,2,bottom)+R(33,69,12,10,2,bottom);
 s+=R(17,85,15,5,2.3,"#574e62","#263e52",1.3)+R(33,85,16,5,2.3,"#574e62","#263e52",1.3);
 // hair behind face (loose long hair, pink bun)
 if(girl){
  s+=D("M17 32 Q13 14 30 13 Q50 12 49 32 L50 56 Q45 63 41 49 H22 Q16 61 15 54Z",hair,"#514356",1.8);
  if(role==="pink_girl")s+=E(43,17,11,10,hair)+E(46,13,4.5,3.2,"#ffd2e4",.5);
 }else s+=D("M16 29 Q15 11 31 13 Q49 13 48 31 L44 38Z",hair,"#354055",1.8);
 // torso
 if(dress)s+=D("M23 50 Q33 44 41 50 L53 77 Q32 85 11 77Z",top,"#715666",2);
 else s+=R(17,48,30,27,7,top,"#43516b",2);
 // arms (with sleeves)
 s+=D("M19 49 Q12 48 10 57 L12 66 L19 67 L24 58Z",jacket)+D("M45 49 Q52 48 55 57 L53 66 L46 67 L41 58Z",jacket);
 s+=R(9,63,7,13,3,complexion,"#b88770",.8)+R(48,63,7,13,3,complexion,"#b88770",.8);
 s+=D("M26 49 Q32 56 39 49","none","#fff2d6",1.8);
 if(!dress)s+=R(24,70,17,3.4,1.6,accent,"#646073",.6);
 if(pattern==="flower"){
   for(const [x,y] of [[25,59],[39,60],[31,70],[42,72]]){
    s+=E(x-2,y,2.1,1.9,"#fff6cf")+E(x+2,y,2.1,1.9,"#fff6cf")+E(x,y-2,2,2,"#fff9e4")+E(x,y+2,2,2,"#fff9e4")+E(x,y,1.1,1.1,"#e88b7d");
   }
 }else if(pattern==="medic")s+=R(27,57,11,12,2,"#fff9f6","#ddd5da",.7)+R(31,59,3,8,1,accent,"none",0)+R(29,62,7,3,1,accent,"none",0);
 else s+=D("M28 54 V69 M35 54 V69","none",accent,2);
 if(equipment==="backpack"||equipment==="satchel")s+=D("M21 51 Q32 60 46 74","none",bag,2);
 if(equipment==="camera")s+=D("M22 52 Q32 63 43 53","none","#f6e2c3",2)+R(26,64,14,10,2,"#3d5359","#ad9e8a",1.1)+E(33,69,4.2,4.2,"#7bb7c7")+E(33,69,2.4,2.4,"#304c63");
 // face front/profile/back
 if(up){
   s+=D("M17 28 Q17 13 32 16 Q48 14 49 28 L46 54 Q32 62 18 54Z",hair,"#4b435a",1.7);
   if(girl)s+=D("M18 39 Q12 49 19 58 M46 39 Q52 49 45 58","none",hair,5);
 }else{
   s+=R(side?18:16,23,side?31:32,30,14,complexion,"#946e6a",1.4);
   s+=E(20,41,4,2.8,"#e9879c",.35)+E(44,41,4,2.8,"#e9879c",.35);
   if(!side){
     s+=E(26,37,2.4,3.3,eyeColour)+E(38,37,2.4,3.3,eyeColour);
     s+=E(26.7,36,0.85,1.1,"#fff")+E(38.7,36,0.85,1.1,"#fff");
     s+=D("M28 44 Q32 48 36 44","none","#ab7276",1.2);
   }else{
     let e=dir==="left"?25:39;
     s+=E(e,37,2.4,3.4,eyeColour)+E(e+.7,36,1,1,"#fff");
     s+=D("M27 44 Q32 47 36 44","none","#ad747c",1.2);
   }
   if(hatStyle==="hair"){
     s+=D("M16 30 Q14 17 29 16 Q37 14 44 18 L49 30 L43 31 L37 25 L30 30 L24 25 L19 33Z",hair,"#3d4056",1.4);
     if(girl)s+=D("M18 29 L18 52 M46 29 L46 52","none",hair,3.5);
   }else s+=D("M17 29 Q17 19 28 19 Q40 17 47 28 L41 31 L36 26 L28 31Z",hair,"#3d4056",1);
 }
 if(hat){
  if(hatStyle==="straw"){
   s+=E(32,23,27,5.4,hat)+D("M17 24 Q17 8 32 8 Q46 8 47 24Z","url(#cap)","#7e655d",1.6)+R(20,19,24,4,1,accent,"#ad8273",.6);
  }else{
   s+=D("M16 24 Q14 10 31 8 Q49 9 49 24Z","url(#cap)","#384259",1.7);
   const brim=dir==="left"?"M18 23 Q7 24 8 29 Q19 29 31 26Z":dir==="right"?"M47 23 Q57 24 57 29 Q44 29 34 26Z":"M15 22 Q32 20 50 22 L55 28 Q32 29 10 28Z";
   s+=D(brim,hat,"#384259",1.3)+E(32,17,5,3,accent);
  }
 }
 if(["aloha_boy","pink_girl","sun_boy"].includes(role) && !up){
  s+=D("M22 21 Q32 16 43 21","none","#344657",1.6);
  s+=E(26,20,4.5,2.9,"#375d75",.9)+E(38,20,4.5,2.9,"#375d75",.9);
 }
 if(role==="explorer" && !up){
  s+=R(20,34,11,6,3,"#3a5360","#d5b48b",1)+R(33,34,11,6,3,"#3a5360","#d5b48b",1)+D("M31 37 H33","none","#3a5360",1);
 }
 if(role==="shadow" && !up){
  s+=R(17,34,30,9,3,"#303449","#a58bc4",1)+D("M23 39 H29 M36 39 H42","none","#f0d2f5",1);
 }
 return s+"</g></svg>";
}
window.AuriMonVacationSprites=function(name){
 const m=/^vac_(hero_boy|hero_girl|aloha_boy|blue_boy|sun_girl|explorer|pink_girl|sun_boy|medic|rival|shadow)_(down|up|left|right)\.svg$/.exec(name);
 if(!m)return null;
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(render(m[1],m[2]));
};
})();
