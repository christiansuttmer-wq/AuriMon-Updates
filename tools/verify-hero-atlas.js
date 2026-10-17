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
console.log('[PASS] 2 Spielfiguren x 4 Richtungen: Atlas 224x44, Transparenz und Anzeigeverknuepfung');
