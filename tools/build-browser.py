#!/usr/bin/env python3
"""Build a fully offline HTML browser preview and zip of the v1.4.26 asset tree."""
from pathlib import Path
import os,re,json,base64,mimetypes,hashlib,zipfile,shutil
src=Path('app/src/main/assets');dest=Path('browser-dist');dest.mkdir(exist_ok=True)
release=os.getenv('AURIMON_BROWSER_VERSION','1.4.28')
files={p.relative_to(src).as_posix():p for p in src.rglob('*') if p.is_file()}
index=(src/'index.html').read_text('utf-8')
images={}
for rel,p in files.items():
 if p.suffix.lower() in ('.svg','.png','.jpg','.jpeg','.gif','.webp','.ico'):
  mime=mimetypes.guess_type(rel)[0] or 'application/octet-stream'
  images[rel]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
def rewrite_css(css,rel):
 base=Path(rel).parent
 def fix(m):
  name=m.group(1).strip().strip(chr(34)+chr(39))
  if name.startswith(('http:','https:','data:','#')):return m.group(0)
  resolved=(base/name).as_posix().removeprefix('./')
  return 'url('+images[resolved]+')' if resolved in images else m.group(0)
 return re.sub(r'url\(\s*([^)]*?)\s*\)',fix,css,flags=re.I)
csscount=[0];jscount=[0]
def inline_css(m):
 tag=m.group(0);mat=re.search(r"""href=['"]([^'"]+)['"]""",tag)
 if 'stylesheet' not in tag.lower() or not mat:return tag
 name=mat.group(1);p=files.get(name)
 if not p:return tag
 csscount[0]+=1
 return '<style data-source="'+name+'">'+rewrite_css(p.read_text('utf-8'),name)+'</style>'
index=re.sub(r'<link\b[^>]*>',inline_css,index,flags=re.I)
def inline_js(m):
 name=m.group(1);p=files.get(name)
 if not p:return m.group(0)
 jscount[0]+=1
 return '<script data-source="'+name+'">\n'+p.read_text('utf-8').replace('</script','<\\/script')+'\n</script>'
index=re.sub(r"""<script\s+src=['"]([^'"]+)['"]\s*>\s*</script>""",inline_js,index,flags=re.I)
index=re.sub(r"""(\bsrc=['"])([^'"]+)(['"])""",lambda m:m.group(1)+images.get(m.group(2),m.group(2))+m.group(3),index,flags=re.I)
assetjson=json.dumps(images,separators=(',',':')).replace('</','<\\/')
prelude='''<script>
(()=>{const assets=__ASSETS__;const desc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
if(desc&&desc.set){Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,enumerable:desc.enumerable,
get(){return desc.get.call(this)},set(v){const name=String(v).replace(/^\.\//,'');return desc.set.call(this,assets[name]||v)}});}
window.AURIMON_BROWSER_TEST=true;})();
</script>'''.replace('__ASSETS__',assetjson)
index=index.replace('</head>',prelude+'</head>',1)
# In old extension scripts several stale version strings still overwrite the header.
index=re.sub(r'1\.4\.(22|23)',release,index)
# Browser-only visual label repair: many legacy scripts overwrite the header.
index=re.sub(r'(?:10|20) ORTE · 151 AURIMON','10 REGIONEN · 50 EBENEN · 151 AURIMON',index)
index=re.sub(r'(?<=VERSION )1\\.\\d+\\.\\d+',release,index)
index=index.replace("const VERSION='1.3.27'","const VERSION='1.4.28'")
index=index.replace('</body>','<script>document.documentElement.dataset.browserTest="true";</script></body>',1)
html=dest/('AuriMon_v'+release+'_BROWSER_OFFLINE.html');html.write_text(index,'utf-8')
folder=dest/('AuriMon_v'+release+'_Browser_Ordner')
for name,p in files.items():
 target=folder/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
(folder/'START_HIER.txt').write_text('AuriMon '+release+' Browser-Test\nindex.html im Browser starten.\nAlle Daten bleiben lokal im Browser. Keine Verbindung zur Android-App oder ihren Spielstaenden.\n','utf-8')
zpath=dest/('AuriMon_v'+release+'_BROWSER_KOMPLETT.zip')
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED,6) as z:
 for p in folder.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(dest).as_posix())
summary={'version':release,'scripts':jscount[0],'styles':csscount[0],'asset_images':len(images),'html_bytes':html.stat().st_size,'zip_bytes':zpath.stat().st_size,'html_sha256':hashlib.sha256(html.read_bytes()).hexdigest()}
(dest/'browser_build.json').write_text(json.dumps(summary,indent=2),'utf-8')
print(json.dumps(summary,indent=2))
