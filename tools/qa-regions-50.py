#!/usr/bin/env python3
"""Deep AuriMon 50-map Chromium QA. Isolated browser profile; does not publish an APK."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
import shutil,json,io,hashlib,collections,math

root=Path("browser-dist").resolve()
html=root/"AuriMon_v1.4.28_BROWSER_OFFLINE.html"
assert html.exists()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
browser_path=shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
assert browser_path,"Chromium missing"
report={"version":"1.4.28 (working tree, browser QA)","tested_levels":0,"regions":[],"errors":[],"warnings":[],"screenshots":[],"real_portals":0,"dungeons_tested":0,"arenas_tested":0,"quests_tested":0,"viewports":[]}
def bad(msg):report["errors"].append(msg)
def check(test,msg):
 if not test:bad(msg)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=browser_path,headless=True,args=["--no-sandbox"])
 ctx=browser.new_context(viewport={"width":1440,"height":900},device_scale_factor=1)
 page=ctx.new_page();page.set_default_timeout(8000)
 page.on("pageerror",lambda e:bad("JavaScript: "+str(e)))
 url="http://127.0.0.1:"+str(server.server_port)+"/"+html.name
 page.goto(url,wait_until="domcontentloaded",timeout=60000)
 page.locator('[data-profile-action="new"]').first.click()
 page.locator("#profile-name").fill("Regionen QA")
 page.locator("#modal-content button").filter(has_text="Junge").first.click()
 page.locator("#modal-content button").filter(has_text="Abenteuer beginnen!").first.click()
 page.locator("#modal-content button").filter(has_text="Bisasam").first.click()
 page.locator("#modal-content button").filter(has_text="Auf ins Abenteuer!").first.click()
 page.wait_for_timeout(400)
 # Set only within the isolated QA profile.
 def visit(i):
  return page.evaluate("""(s)=>{
    state.zone=Math.floor(s/5); state.aurWorld50.stage=s;
    state.x=s===0?9:1;state.y=s===0?9:6;
    state.facing='right';state.badges=Array.from({length:10},(_,i)=>i);
    state.dungeon=null;state.v51Indoor=null;
    // Isolate each test section: random encounters during earlier map traversals
    // must not leave an unrelated battle modal blocking all subsequent checks.
    if(typeof battle!=='undefined')battle=null;
    document.querySelector('#battle-overlay')?.classList.add('hidden');
    if(typeof closeModal==='function')closeModal();
    render();
    return {stage:window.PokemonGame.world50.getStage(),region:window.PokemonGame.world50.getRegion(s),
      name:window.PokemonGame.world50.names[s],
      dom:document.querySelector('#zone-name')?.textContent,
      canvas:document.querySelector('#game-map canvas')?.getBoundingClientRect().toJSON(),
      features:window.PokemonGame.world50.getFeatures(s)}
  }""",i)
 # Every map must render, include unique content, not be an empty solid-color screen.
 region_previews=[]
 for i in range(50):
  r=visit(i)
  check(r["stage"]==i,"Stage "+str(i+1)+": wrong stage or save cross-link")
  check(r["dom"]==r["name"],"Stage "+str(i+1)+": wrong map heading")
  check(r["canvas"] is not None and r["canvas"]["width"]>220 and r["canvas"]["height"]>110,
        "Stage "+str(i+1)+": missing or undersized canvas")
  raw=page.locator("#game-map canvas").screenshot()
  im=Image.open(io.BytesIO(raw)).convert("RGB")
  colors=len(im.resize((130,78)).getcolors(130*78) or [])
  check(colors>250,"Stage "+str(i+1)+": map looks empty/flat, unique RGB "+str(colors))
  report["tested_levels"]+=1
  if i%5==0:
   path=root/("REGION_"+str(i//5+1).zfill(2)+"_"+r["region"]+".png")
   im.save(path);report["screenshots"].append(path.name)
   region_previews.append((r["region"],im.copy()))
   report["regions"].append({"region":r["region"],"stages":str(i+1)+"–"+str(i+5),
    "first_stage":r["name"],"visible_RGB_samples":colors,"visual_px":[im.width,im.height]})
 # Actual portal step on all 49 borders, plus their reverse transitions.
 for i in range(49):
  visit(i)
  before=page.evaluate("""()=>{state.x=18;state.y=6;state.facing='right';state.badges=Array.from({length:10},(_,j)=>j);
    // The separate rune test below validates the puzzle. Here we test traversing an already solved gate.
    if(state.aurWorld50.stage%5===3)for(const r of window.PokemonGame.world50.getFeatures(state.aurWorld50.stage).runes)
      if(!state.aurWorld50.runestones.includes(r.id))state.aurWorld50.runestones.push(r.id);
    return state.aurWorld50.stage;}""")
  after=page.evaluate("""()=>{walk(1,0);return {stage:state.aurWorld50.stage,zone:state.zone,x:state.x,y:state.y}}""")
  check(after["stage"]==i+1 and after["zone"]==(i+1)//5,
        "East border "+str(i+1)+"→"+str(i+2)+" failed: "+str(after))
  report["real_portals"]+=1
  # Backwards is allowed even without achievements.
  prev=page.evaluate("""()=>{state.x=1;state.y=6;state.facing='left';walk(-1,0);return {stage:state.aurWorld50.stage,zone:state.zone}}""")
  check(prev["stage"]==i,"West return "+str(i+2)+"→"+str(i+1)+" failed: "+str(prev))
 # Each dungeon: all rune activation in intended sequence, gate should then become passable.
 for i in range(3,50,5):
  visit(i)
  result=page.evaluate("""(stage)=>{
    const a=window.PokemonGame.world50.getFeatures(stage);
    const order=stage===3||stage===8?[0,1,2]:Math.floor(stage/5)%2===0?[0,1,2]:[2,1,0];
    const before=state.aurWorld50.runestones.length;
    const g=window.PokemonGame.world50.getMap(stage);
    const marked=new Set(a.npcs.map(n=>n.x+','+n.y));
    function hit(r){
      for(const [dx,dy,face] of [[0,-1,'down'],[-1,0,'right'],[0,1,'up'],[1,0,'left']]){
       const x=r.x+dx,y=r.y+dy;
       if(x<1||x>18||y<1||y>10||marked.has(x+','+y)||'t#ba~G'.includes(g[y][x]))continue;
       state.x=x;state.y=y;state.facing=face;interact();return true;
      }
      return false;
    }
    // Wrong sequence must not grant a rune.
    if(stage!==3){hit(a.runes[order[2]]);}
    const denied=state.aurWorld50.runestones.length===before;
    const events=[];
    for(const q of order){const id=a.runes[q].id;events.push({id,interactive:hit(a.runes[q]),success:state.aurWorld50.runestones.includes(id)});}
    state.x=16;state.y=6;state.facing='right';
    walk(1,0);
    return {denied,events,gateOpen:state.x===17&&state.y===6};
  }""",i)
  check(result["denied"],"Dungeon "+str(i+1)+": wrong rune sequence accepted")
  check(result["gateOpen"] and all(x["interactive"] and x["success"] for x in result["events"]),
        "Dungeon "+str(i+1)+": rune gate cannot be opened: "+str(result))
  report["dungeons_tested"]+=1
 # Each arena must be accessible from the entrance, and should display the correct leader.
 for i in range(4,50,5):
  visit(i)
  result=page.evaluate("""(stage)=>{
   const gym=window.PokemonGame.world50.getFeatures(stage).buildings.find(b=>b.kind==='gym');
   const [x,y]=gym.step;state.x=x;state.y=y;state.facing='up';
   state.badges=state.badges.filter(v=>v!==Math.floor(stage/5));
   interact();return {gym:!!gym,dialog:document.querySelector('#modal-content')?.innerText||''};
  }""",i)
  check(result["gym"] and ("Prüfhalle" in result["dialog"] or "Prüfung" in result["dialog"]),
        "Arena "+str(i+1)+": battle entrance does not open: "+str(result)[:200])
  report["arenas_tested"]+=1
 # Each of the 10 regional side-quests must respond to a real interact command.
 for z in range(10):
  i=z*5; visit(i)
  result=page.evaluate("""(stage)=>{
    const a=window.PokemonGame.world50.getFeatures(stage);
    const n=a.npcs.find(q=>q.kind==='side');const grid=window.PokemonGame.world50.getMap(stage);
    const occupied=new Set(a.npcs.map(q=>q.x+','+q.y));
    let ok=false;
    for(const [dx,dy,face] of [[0,-1,'down'],[-1,0,'right'],[0,1,'up'],[1,0,'left']]){
     const x=n.x+dx,y=n.y+dy;
     if(x<0||x>19||y<0||y>11||occupied.has(x+','+y)||'t#ba~G'.includes(grid[y][x]))continue;
     state.x=x;state.y=y;state.facing=face;interact();ok=true;break;
    }
    return {found:!!n,interacted:ok,text:document.querySelector('#modal-content')?.innerText||''};
  }""",i)
  check(result["found"] and result["interacted"] and "Ortsauftrag" in result["text"],
        "Side quest in "+str(z+1)+" not interactive: "+str(result)[:220])
  report["quests_tested"]+=1
 # Landscape is required. Test the real right-side menu and large world canvas.
 for width,height in [(915,412),(844,390),(740,360),(1280,800),(1440,900)]:
  page.set_viewport_size({"width":width,"height":height})
  visit(20)
  view=page.evaluate("""()=>{
    const map=document.querySelector('#game-map').getBoundingClientRect();
    const canvas=document.querySelector('#game-map canvas');
    const nav=document.querySelector('#app .tabs').getBoundingClientRect();
    const main=document.querySelector('#app .main').getBoundingClientRect();
    const tabs=[...document.querySelectorAll('#app .tabs button')].map(el=>el.getBoundingClientRect().toJSON());
    return {canvas:canvas.getBoundingClientRect().width,map:map.width,visible:map.height,
      heightOverWidth:map.height/map.width,canvasId:canvas.id,
      logicalWidth:canvas.width,logicalHeight:canvas.height,
      navLeft:nav.left,navRight:nav.right,navHeight:nav.height,
      mainRight:main.right,body:document.body.scrollWidth,viewport:innerWidth,
      frame:document.querySelector('.aur-map-frame').getBoundingClientRect().toJSON(),
      wrap:document.querySelector('.mapwrap').getBoundingClientRect().toJSON(),
      column:document.querySelector('#page-world .tablet-map-column').getBoundingClientRect().toJSON(),
      frameCSS:{height:getComputedStyle(document.querySelector('.aur-map-frame')).height,
                maxHeight:getComputedStyle(document.querySelector('.aur-map-frame')).maxHeight},
      verticalTabs:tabs.every((b,i)=>i===0||b.top>tabs[i-1].top)};
  }""")
  report["viewports"].append({"width":width,"height":height,**view})
  check(view["navLeft"]>=view["mainRight"]-5 and view["verticalTabs"],
        "Welt/Team/AuriDex/Tasche/Reise are not vertically placed on the right: "+str(view))
  check(view["map"]>180 and view["visible"]>min(210,height*.50),
        "Map too flat/small at "+str(width)+"x"+str(height)+": "+str(view))
  if width<=1100 and height<=650:
   check(view["canvasId"]=="aur50-landscape-map-canvas",
         "Landscape phone must show tracked 16x12 world camera: "+str(view))
   check(1.25<view["heightOverWidth"]**-1<1.43,
         "Landscape camera aspect is distorted: "+str(view))
   check(view["logicalWidth"]*12==view["logicalHeight"]*16,
         "Landscape camera pixels are not 16x12: "+str(view))
  if width==915:
   phone=root/"SPIELFELD_HANDY_QUERFORMAT.png"
   page.screenshot(path=str(phone));report["screenshots"].append(phone.name)
   player=page.locator("#aur50-landscape-map-canvas")
   player.scroll_into_view_if_needed()
   page.evaluate("""()=>{
     state.x=1;state.y=6;state.facing='right';render();
   }""")
   bounds=player.bounding_box()
   check(bool(bounds),"Landscape canvas missing during touch test")
   if bounds:
    x=bounds["x"]+(2.5/16)*bounds["width"]
    y=bounds["y"]+(6.5/12)*bounds["height"]
    hit=page.evaluate("""({x,y})=>{
      const el=document.elementFromPoint(x,y),canvas=document.querySelector('#aur50-landscape-map-canvas');
      const world=document.querySelector('#page-world'),frame=canvas.closest('.aur-map-frame');
      const rect=el=>el?.getBoundingClientRect().toJSON();
      return {target:el?.id||el?.className||'none',
      x,y,viewport:[innerWidth,innerHeight],canvas:rect(canvas),
      map:rect(document.querySelector('#game-map')),frame:rect(frame),
      mapColumn:rect(world.querySelector('.tablet-map-column')),
      world:rect(world),scroll:[scrollX,scrollY],pageScroll:world.scrollTop,
      modal:typeof modalOpen!=='undefined'?modalOpen:null,
      battle:typeof battle!=='undefined'?Boolean(battle):null};
    }""",{"x":x,"y":y})
    page.mouse.click(x,y)
    position=page.evaluate("()=>[state.x,state.y]")
    check(position==[2,6],"Touch on landscape game map did not move to expected neighbor: "+str(position)+", target="+str(hit))
   page.evaluate("()=>{state.x=18;render()}")
   edge=page.evaluate("""()=>{
    const c=document.querySelector('#aur50-landscape-map-canvas');
    return {alpha:c.getContext('2d').getImageData(2,2,1,1).data[3],exists:!!c};
   }""")
   check(edge["exists"] and edge["alpha"]>0,"Landscape camera fails at the right map edge: "+str(edge))
   # Make sure the newly relocated nav works for another page too.
   page.locator('.tabs button[data-page="team"]').click()
   check(page.locator("#page-team").evaluate("(el)=>el.classList.contains('active')"),
         "Right hand Team navigation button does not change the page")
   page.locator('.tabs button[data-page="world"]').click()
  if view["body"]>width+25:
   report["warnings"].append("Horizontal document scrolling at "+str(width)+"px")
 # When held upright, AuriMon MUST demand rotation and block gameplay.
 page.set_viewport_size({"width":390,"height":844})
 page.wait_for_timeout(150)
 upright=page.evaluate("""()=>{
  const el=document.querySelector('#auri-rotate-notice'),cs=el&&getComputedStyle(el);
  return {exists:!!el,display:cs?.display,events:cs?.pointerEvents,
          message:el?.textContent?.trim()||''};
 }""")
 check(upright["exists"] and upright["display"]=="flex" and upright["events"]!="none",
       "Portrait lock is not protecting the game: "+str(upright))
 page.set_viewport_size({"width":1440,"height":900})
 page.wait_for_timeout(100)
 # Save persistence after close/reopen, still in a private test browser context.
 page.set_viewport_size({"width":1440,"height":900})
 visit(35)
 page.evaluate("""()=>{state.coins=1237;save()}""")
 page.reload(wait_until="domcontentloaded")
 page.locator('[data-profile-action="load"]').first.click()
 page.locator('[data-profile-action="open:1"]').first.click()
 page.wait_for_timeout(250)
 persistence=page.evaluate("""()=>({stage:state.aurWorld50?.stage,zone:state.zone,coins:state.coins})""")
 check(persistence=={"stage":35,"zone":7,"coins":1237},"Save/reload damaged regional progress: "+str(persistence))
 # Contact sheet with all 10 authentic game screenshots.
 cols,rows=2,5;thumbw,thumbh=480,288
 montage=Image.new("RGB",(cols*thumbw,rows*(thumbh+30)),(19,32,47))
 pen=ImageDraw.Draw(montage)
 for n,(name,img) in enumerate(region_previews):
  x=(n%cols)*thumbw;y=(n//cols)*(thumbh+30)
  img.thumbnail((thumbw,thumbh),Image.Resampling.LANCZOS)
  montage.paste(img,(x,y+30));pen.text((x+10,y+7),str(n+1)+". "+name,fill=(255,255,255))
 montage.save(root/"REGIONEN_10_KARTENVORSCHAU.png")
 browser.close()
server.shutdown()
report["status"]="PASS" if not report["errors"] else "FAIL"
(root/"REGIONEN_50_PRUEFUNG.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
lines=["# AuriMon – Vollprüfung aller zehn Regionen / 50 Ebenen","",
       "**Prüfstand:** "+report["version"],"**Ergebnis:** "+report["status"],"",
       "Ebenen geprüft: "+str(report["tested_levels"])+"/50",
       "Echte Kartenübergänge: "+str(report["real_portals"])+"/49 (jeweils Hin- und Rückweg)",
       "Dungeon-/Runenrätsel: "+str(report["dungeons_tested"])+"/10",
       "Arenazugänge: "+str(report["arenas_tested"])+"/10",
       "Ortsaufträge: "+str(report["quests_tested"])+"/10","",
       "## Fehler"]
lines.extend(["- "+x for x in report["errors"]] or ["Keine im Testlauf."])
lines.extend(["","## Hinweise"])
lines.extend(["- "+x for x in report["warnings"]] or ["Keine."])
lines.extend(["","## Einschränkungen",
       "- Automatisierte Chromium-Prüfungen können einen vollständigen menschlichen Spieldurchlauf nicht ersetzen.",
       "- Schwierigkeitsbalance, Spielspaß und grafische Qualität bleiben teilweise subjektiv.",
       "- Testwerte für bereits freigeschaltete Orden dienen der isolierten Navigation; echtes Erspielen der Orden wird nicht durchgespielt.",
       "- Keine Änderungen an der installierten Android-APK."])
(root/"REGIONEN_50_PRUEFUNG.md").write_text("\n".join(lines),encoding="utf-8")
print(json.dumps({"status":report["status"],"checks":{k:report[k] for k in ["tested_levels","real_portals","dungeons_tested","arenas_tested","quests_tested"]},"errors":report["errors"],"warnings":report["warnings"]},ensure_ascii=False,indent=2))
if report["errors"]:raise SystemExit(2)
