#!/usr/bin/env python3
"""AuriMon: isolated real-Chromium multi-viewport, shop, profiles and persistence regression."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import json, os, shutil, traceback
from playwright.sync_api import sync_playwright

version=os.environ.get("AURIMON_BROWSER_VERSION","2.0.0")
root=Path("browser-dist").resolve()
html=root/("AuriMon_v"+version+"_BROWSER_OFFLINE.html")
assert html.is_file(),str(html)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(("127.0.0.1",0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url="http://127.0.0.1:"+str(server.server_port)+"/"+html.name
chromium=shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
assert chromium,"Real Chromium not installed"
report={"version":version,"status":"RUNNING","checks":[],"errors":[],"warnings":[],"screenshots":[],"viewports":[]}
def check(condition,message):
    if not condition:
        report["errors"].append(message)
        raise AssertionError(message)
    report["checks"].append(message)
def save_report():
    report["status"]="PASS" if not report["errors"] else "FAIL"
    (root/"DEEP_BROWSER_QA.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    md=["# AuriMon "+version+" – unabhängige Browser-Tiefenprüfung","",
        "**Status:** "+report["status"],"","## Bestätigte Prüfungen"]
    md.extend("- "+c for c in report["checks"])
    md+=["","## Fehler"];md.extend("- "+c for c in report["errors"])
    md+=["","## Hinweise / Prüflimits"]
    md.extend("- "+w for w in report["warnings"])
    md+=["- Automatisierte Kontrollen spielen nicht jede mögliche Entscheidung in jeder Quest vollständig durch.",
          "- Browser und Android-WebView können bei Schrift, Keyboard oder Systemdialogen unterschiedlich reagieren.",
          "- Artworks aus externen offiziellen Pokémon-Quellen sind nicht alle offline gebündelt."]
    (root/"DEEP_BROWSER_QA.md").write_text("\n".join(md),encoding="utf-8")
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=chromium,headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        context=browser.new_context(viewport={"width":1536,"height":709},locale="de-DE",device_scale_factor=1)
        page=context.new_page()
        page.set_default_timeout(12000)
        page.on("pageerror",lambda error:report["errors"].append("JavaScript: "+str(error)))
        page.goto(url,wait_until="domcontentloaded",timeout=60000)
        page.wait_for_timeout(450)
        check(page.locator('[data-profile-action="new"]').count()==1,"New-game button visible")
        check("1.025" in page.locator(".player-picker-heading").inner_text(),"New-game title reports 1.025 species")
        check(page.locator(".aur2-greeting").count()==1,"Version 2.0 welcome to every player")
        check(page.locator(".aur2-title-logo").evaluate("(el)=>el.complete && el.naturalWidth>0"),"New title logo is loaded")
        check("data:image/webp;base64," in page.locator("#player-picker").evaluate("(el)=>getComputedStyle(el).backgroundImage") or "aurimon_title_bg_2.webp" in page.locator("#player-picker").evaluate("(el)=>getComputedStyle(el).backgroundImage"),"Generated background used on game start")
        check(page.locator(".player-picker-footer").inner_text().startswith("0 von 6"),"Version 2.0 resets previous profiles")
        page.locator('[data-profile-action="new"]').click()
        check("40 Regionen und 200 Ebenen" in page.locator("#modal-content").inner_text(),"Trainer setup reports 40 regions, 200 stages")
        page.locator("#profile-name").fill("Browser Tiefen QA")
        page.locator('[data-action="profile-gender:girl"]').click()
        page.locator('[data-action="profile-confirm"]').click()
        page.locator("#modal-content button").filter(has_text="Bisasam").first.click()
        page.locator("#modal-content button").filter(has_text="Auf ins Abenteuer!").first.click()
        page.wait_for_timeout(450)
        data=page.evaluate("""() => ({mon:state.party[0]?.id,gender:state.profileGender,
          count:D.length,world:window.PokemonGame.world50.getCount(),
          forms:window.AuriFormSystem.inspect()})""")
        check(data["mon"]==1 and data["gender"]=="girl","Female trainer with Bisasam created and playable")
        check(data["count"]==1025 and data["world"]==200,"1.025 species and 200 playable stages exposed")
        check(data["forms"]["forms"]>=500,"Special-form catalog loaded with over 500 entries")
        for pagename in ("world","team","dex","bag","travel"):
            page.evaluate("(s)=>switchPage(s)",pagename)
            check(page.locator("#page-"+pagename).evaluate("(e)=>e.classList.contains('active')"),"Navigation: "+pagename)
        page.evaluate("()=>switchPage('world')")
        for name,w,h in [("s23",915,412),("wide",1536,709),("tablet",1280,800),("desktop",1920,1080)]:
            page.set_viewport_size({"width":w,"height":h})
            page.evaluate("() => doAction('forms-market')")
            rows=page.locator("#modal-content .special-market-list > .bag-entry")
            check(rows.count()==25,name+": all 25 market items displayed")
            geom=page.evaluate("""() => {
                const dialog=document.querySelector('#modal-content');
                const list=dialog.querySelector('.special-market-list');
                const rows=Array.from(list.children);
                return { scroll: list.scrollHeight>list.clientHeight,
                  within:rows.every(row=>{
                    const r=row.getBoundingClientRect();
                    return [row.querySelector('b'),row.querySelector('small'),row.querySelector('button')].every(n=>{
                      const c=n.getBoundingClientRect();
                      return c.x>=r.x-3 && c.right<=r.right+3 && c.y>=r.y-3 && c.bottom<=r.bottom+3;
                    });
                  }),
                  contrast: getComputedStyle(rows[0]).backgroundColor,
                  buttonColor:getComputedStyle(rows[0].querySelector('button')).color,
                  name:rows[0].querySelector('b').innerText,
                  dialogWidth:dialog.getBoundingClientRect().width,
                  pageWidth:document.documentElement.scrollWidth };
            }""")
            check(geom["within"],name+": all market text, prices and buttons inside cards")
            check(geom["contrast"]=="rgb(238, 248, 255)",name+": readable light item cards")
            check(geom["dialogWidth"]<=w,name+": dialog fits viewport")
            path=root/("QA_MARKET_"+name+".png")
            page.screenshot(path=str(path))
            report["screenshots"].append(path.name)
            report["viewports"].append({"name":name,"width":w,"height":h,"result":geom})
            page.evaluate("() => closeModal()")
        page.set_viewport_size({"width":1536,"height":709})
        page.evaluate("() => { state.coins=4000;save();doAction('forms-market'); }")
        before=page.evaluate("() => ({coin:state.coins,count:state.bag.mega_ring||0})")
        page.locator('[data-action="forms-buy:mega_ring"]').click()
        after=page.evaluate("() => ({coin:state.coins,count:state.bag.mega_ring||0})")
        check(after["coin"]==before["coin"]-950 and after["count"]==before["count"]+1,
            "Real shop purchase: exactly 950 coins deducted and Mega-Ring added")
        page.evaluate("() => {state.coins=0;doAction('forms-market')}")
        page.locator('[data-action="forms-buy:mega_ring"]').click()
        check(page.evaluate("() => state.coins")==0,"Shop rejects purchase without coins")
        page.evaluate("() => closeModal()")
        page.evaluate("""() => {
            state.zone=4;state.aurWorld50.stage=20;state.coins=2345;
            save();
        }""")
        stored=page.evaluate("""() => Object.keys(localStorage).map(k=>localStorage.getItem(k))
           .filter(v=>v&&v.includes('"aurWorld50"')&&v.includes('"coins":2345')).length""")
        check(stored>0,"Progress including stage 20 and coins persists in local save")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(350)
        check(page.locator('[data-profile-action="load"]').count()==1,
            "Browser reload preserves profile selection instead of resetting to new save")
        page.locator('[data-profile-action="load"]').click()
        target=page.locator('[data-profile-action^="open:"]').first
        check(target.count()==1,"Saved profile is listed and loadable")
        target.click()
        restored=page.evaluate("() => ({stage:state.aurWorld50.stage,coins:state.coins,gender:state.profileGender})")
        check(restored["stage"]==20 and restored["coins"]==2345 and restored["gender"]=="girl",
            "Saved coins, world progress and trainer survive reload")
        check(not report["errors"],"No uncaught JavaScript errors")
        report["warnings"].append("Full quest branch coverage requires additional manual scenario-by-scenario playthroughs.")
        browser.close()
except Exception as exc:
    report["errors"].append(type(exc).__name__+": "+str(exc))
    report["traceback"]=traceback.format_exc()[-5500:]
finally:
    server.shutdown()
    save_report()
print(json.dumps({"status":report["status"],"checks":len(report["checks"]),"errors":report["errors"],"screenshots":report["screenshots"]},ensure_ascii=False,indent=2))
if report["errors"]:
    raise SystemExit(2)
