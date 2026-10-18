/* AuriMon hero atlas validation: 2 sexes x 4 directions. Graphics only. */
'use strict';
const fs=require('node:fs'), assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const atlas=fs.readFileSync(path.join(root,'app/src/main/assets/ari_sprites/hero_design_atlas.png'));
assert.equal(atlas.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');
assert.equal(atlas.readUInt32BE(16),224,'atlas must contain 8 frames x 28 px');
assert.equal(atlas.readUInt32BE(20),44,'each frame 44 px high');
assert.ok(atlas.includes(Buffer.from('tRNS')),'transparent background required');
const world=fs.readFileSync(path.join(root,'app/src/main/assets/aurimon_world50_pilot.js'),'utf8');
const characters=fs.readFileSync(path.join(root,'app/src/main/assets/arimon_characters.js'),'utf8');
assert.match(world,/paintHeroAtlas\(x,y,sex,dir\)/);
assert.match(world,/index\*28,0,28,44/);
assert.match(world,/gender==='girl'\?4:0/);
assert.match(characters,/hero_design_atlas\.png/);
assert.match(characters,/frame\*28,0,28,44/);
/* Die PNG-Frames stehen rechts vor links; beide Renderer muessen
 * dieselben korrekten Richtungs-Frames benutzen. Bewegung bleibt normal. */
assert.match(world,/const order=\{down:0,left:2,right:1,up:3\}/,
  'World map must face left using frame 2, right using frame 1');
assert.match(characters,/const dirs=\{down:0,left:2,right:1,up:3\}/,
  'Legacy map must use the same corrected direction mapping');
assert.match(world,/state\.facing=dx>0\?'right':dx<0\?'left':dy>0\?'down':'up'/,
  'Movement and facing must retain normal compass directions');

console.log('[PASS] 2 Spielfiguren x 4 Richtungen: Atlas 224x44, korrigierte Links-Rechts-Zuordnung, Transparenz und Anzeigeverknuepfung');
