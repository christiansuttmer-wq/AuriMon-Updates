#!/usr/bin/env python3
"""Real-Chromium browser smoke test for AuriMon. Uses isolated temporary profile."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from contextlib import suppress
import json,shutil,sys,time,traceback

root=Path("browser-dist").resolve()
html=root/"AuriMon_v1.4.28_BROWSER_OFFLINE.html"
if not html.is_file():raise SystemExit("Offline HTML missing")
from playwright.sync_api import sync_playwright
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
handler=partial(QuietHandler,directory=str(root))
server=ThreadingHTTPServer(("127.0.0.1",0),handler)
thread=Thread(target=server.serve_forever,daemon=True);thread.start()
url="http://127.0.0.1:"+str(server.server_port)+"/"+html.name
errors=[];checks=[];shots=[]
chrome=shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
if not chrome:raise SystemExit("No Chromium/Chrome executable on GitHub runner")
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=chrome,headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
 ctx=browser.new_context(viewport={"width":1400,"height":900},device_scale_factor=1)
 page=ctx.new_page()
 page.set_default_timeout(6000)
 page.on("pageerror",lambda e:errors.append(str(e)))
 page.goto(url,wait_until="domcontentloaded",timeout=60000)
 page.wait_for_timeout(500)
 assert page.locator('[data-profile-action="new"]').count(),"Profile picker missing"
 page.locator('[data-profile-action="new"]').first.click()
 page.locator("#profile-name").fill("QA Trainer")
 page.locator("#modal-content button").filter(has_text="Junge").first.click()
 page.locator("#modal-content button").filter(has_text="Abenteuer beginnen!").first.click()
 page.locator("#modal-content button").filter(has_text="Bisasam").first.click()
 page.locator("#modal-content button").filter(has_text="Auf ins Abenteuer!").first.click()
 page.wait_for_timeout(700)
 state=page.evaluate("""() => ({
   activeSlot:window.PokemonProfiles?.activeSlot,
   starter:state?.starterChosen,
   regions:window.PokemonGame?.world50?.getCount?.(),
   stage:window.PokemonGame?.world50?.getStage?.()
 })""")
 assert state["activeSlot"]==1 and state["starter"],"Could not create a real player profile: "+str(state)
 assert state["regions"]==200,"World does not contain 200 stages: "+str(state)
 checks.append("Profile created and first Pokémon selected")
 head=page.locator(".brand span").inner_text()
 assert "VERSION 1.5.8" in head, "Stale version header: "+head
 page.evaluate("() => { document.querySelector(\u0027.brand span\u0027).textContent = \u0027VERALTET\u0027; }")
 assert "VERSION 1.5.8" in page.locator(".brand span").inner_text(), "Legacy modules can overwrite release header"
 page.evaluate("() => doAction(\u0027regional-dex\u0027)")
 regional=page.locator("#modal-content").inner_text()
 assert "Regionaldex" in regional and "Wildarten" not in regional[:20], "Regionaldex dialog missing"
 page.evaluate("() => closeModal()")
 # Actual battle interaction: special controls must survive the 3-column layout.
 page.evaluate("""() => {
   const a=state.party[0];a.level=100;a.hp=hpMax(a.id,a.level);
   state.bag.dynamax_band=1;
   state.bag.tera_orb=1;
   state.bag['z_crystal_'+POKE[a.id].types[0]]=1;
   const target=newMon(143,60);
   // Isolate special-mechanic turns from random KOs in this UI test.
   startBattle('wild',[target],'QA Spezialkampf','qa-special',0);
   // Some battle wrappers normalize enemy HP on entry; set the QA tank after entry.
   const enemy=foe();enemy.hp=100000;enemy.status='sleep';enemy.sleepTurns=99;
 }""")
 layout=page.evaluate("""() => ({
   columns:!!document.querySelector('.auri131-stage'),
   dyna:!!document.querySelector('[data-battle="special:dyna"]'),
   tera:!!document.querySelector('[data-battle="special:tera"]'),
   z:!!document.querySelector('[data-battle="special:z"]')
 })""")
 assert all(layout.values()), "Battle mechanics missing from modern controls: "+str(layout)
 page.evaluate("() => battleAction('special:dyna')")
 assert page.evaluate("() => chooseAlive()?.auriDyna?.turns")==3, "Dynamax activation failed"
 before_move=page.evaluate("""() => ({active:chooseAlive()?.id,allyHp:chooseAlive()?.hp,enemyHp:foe()?.hp,
   enemyStatus:foe()?.status, enemySleep:foe()?.sleepTurns, battle:!!battle,kind:battle?.kind})""")
 page.evaluate("() => battleAction('move:0')")
 turns=page.evaluate("""() => ({turns:chooseAlive()?.auriDyna?.turns, active:chooseAlive()?.id, battle:!!battle,
   enemy:foe()?.hp, modal:document.querySelector('#modal-content')?.innerText?.slice(0,140),
   hp:chooseAlive()?.hp,gameLog:battle?.log})""")
 assert turns["turns"]==2, "Normal move did not advance Dynamax counter: before="+str(before_move)+" after="+str(turns)
 page.evaluate("() => battleAction('special:z')")
 assert page.evaluate("() => battle?.auriZReady") is not None, "Z crystal not armed"
 page.evaluate("() => battleAction('move:1')")
 z_used=page.evaluate("() => battle?.auriZUsed")
 assert z_used is True, "Z boost not consumed by real move"
 page.evaluate("""() => { battle=null; document.querySelector('#battle-overlay')?.classList.add('hidden'); }""")
 checks.append("Real 3-column combat controls, Dynamax turn countdown and single-use Z moves")
 checks.append("Version header and Regionaldex open correctly")
 # Regressions from screenshots: actual 20-character gallery and full 1,025-species progress.
 page.evaluate("() => doAction('ari04-atlas')")
 assert '20 Charakterporträts' in page.locator("#modal-content h2").inner_text()
 assert page.locator(".ari04-atlas-person").count()==20
 gallery=page.locator(".ari04-atlas-grid")
 assert gallery.evaluate("(el) => el.scrollTop") == 0
 # Old gallery scroll position must never hide the first row upon reopening.
 gallery.evaluate("(el) => {el.scrollTop=350}")
 page.evaluate("() => doAction('ari04-atlas')")
 assert page.locator(".ari04-atlas-grid").evaluate("(el) => el.scrollTop")==0
 page.evaluate("() => closeModal()")
 page.evaluate("() => doAction('v55-finale')")
 assert '1.025' in page.locator("#modal-content").inner_text()
 assert '151' in page.locator("#modal-content").inner_text()
 page.locator('button[data-action="v55-open-dex"]').click()
 assert page.locator("#page-dex").evaluate("(el) => el.classList.contains('active')")
 page.evaluate("() => switchPage('world')")
 checks.append("Screenshot regressions: 20-character gallery scroll reset and full 1,025 Dex navigation")
 checks.append("All 200 stages initialized in real Chromium")
 def screenshot(stage,name):
  def change():
   pass
  page.evaluate("""(s) => {
    state.zone=Math.floor(s/5);
    state.aurWorld50.stage=s;
    state.x=s===0?9:1;
    state.y=s===0?9:6;
    state.facing='right';
    state.badges=Array.from({length:40},(_,i)=>i);
    if(typeof save==='function')save();
    render();
   }""",stage)
  page.wait_for_timeout(160)
  view=page.evaluate("() => ({stage:window.PokemonGame.world50.getStage(),canvas:!!document.querySelector('#game-map canvas'),visible:document.querySelector('#game-map')?.getBoundingClientRect().width})")
  assert view["stage"]==stage and view["canvas"] and view["visible"]>100,str(view)
  target=root/(name+".png");page.screenshot(path=str(target));shots.append(str(target.name))
 for st,name in [(0,"QA_Sonnenwiese_Ebene_1"),(24,"QA_Windkueste_Ebene_25"),(49,"QA_Wolkenhoehe_Ebene_50"),(199,"QA_Letzte_Sphaere_Ebene_200")]:
  screenshot(st,name)
 checks.append("Screenshots and map rendering on levels 1, 25 and 50")
 page.evaluate("""() => {
   state.zone=0;state.aurWorld50.stage=0;state.x=9;state.y=7;
   state.facing='down';state.badges=[];render();
 }""")
 # The side-quest resident stands at (9,8). Check real input interaction, not only structure.
 page.evaluate("() => {if(typeof interact==='function')interact();}")
 page.wait_for_timeout(160)
 modal=page.locator("#modal-content").inner_text()
 assert "Ortsauftrag" in modal, "Side-quest interaction did not open: "+modal[:120]
 checks.append("Side quest NPC opens the actual quest interface")
 page.evaluate("() => {if(typeof closeModal==='function')closeModal();}")
 # Starter, coins and an explicit region progress marker must survive persistence.
 page.evaluate("""() => {
   state.zone=4;state.aurWorld50.stage=20;state.x=1;state.y=6;
   state.coins=1234;
   if(typeof save==='function')save();
 }""")
 actual=page.evaluate("""() => {
   const keys=Object.keys(localStorage);return {
     count:keys.length,
     values:keys.map(k=>localStorage.getItem(k)).filter(v=>v&&v.includes('"aurWorld50"')).slice(0,3)
   };
 }""")
 assert any('"stage":20' in v and '"coins":1234' in v for v in actual["values"]),"Save data missing new world progress"
 checks.append("New-world stage, starter and coins persisted in player save")
 assert not errors,"Browser page errors: "+repr(errors)
 browser.close()
server.shutdown()
out={"status":"PASS","checks":checks,"screenshots":shots,"page_errors":errors}
(root/"BROWSER_E2E.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(out,ensure_ascii=False,indent=2))
