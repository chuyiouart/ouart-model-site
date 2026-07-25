import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
function load(file,key){const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);return sandbox.window[key]}
const models=load('data/models.js','OUART_MODELS');
const batches=load('data/batches.js','OUART_BATCHES');
const ids=['chun-li-campus-ca3d','astro-bot-hero-pose','christmas-miniature-scene','sonic-speed-pose','panzer-iii-g','marder-iii-ausf-h'];
const by=new Map(models.map(x=>[x.id,x]));

test('2026-07-25 batch identity and stable URL remain exact',()=>{
 const batch=batches.find(x=>x.id==='ouart-daily-six-20260725');assert.deepEqual(Array.from(batch.modelIds),ids);assert.equal(batch.downloadUrl,'https://pan.baidu.com/s/1L78IAF0xDOc7RUaKH8IC9A');assert.equal(batch.shareCode,'325c');
});
test('Astro and Bella use real source mains; AI can only be last extension',()=>{
 const astro=by.get('astro-bot-hero-pose');const bella=by.get('christmas-miniature-scene');
 assert.match(astro.image,/source-original-1\.jpg$/);assert.equal(astro.imageSourceTier,'original_creator_web');assert.match(bella.image,/source-original-1\.jpg$/);assert.equal(bella.imageSourceTier,'telegram_exact_album');
 assert.equal(astro.gallery.at(-1).sourceTier,'ai_generated_extension');assert.ok(astro.gallery.slice(0,-1).every(x=>x.sourceTier!=='ai_generated_extension'));assert.ok(bella.gallery.every(x=>x.sourceTier!=='ai_generated_extension'));
});
test('active galleries are bounded, distinct and public-safe',()=>{
 const forbidden=['chat_id','message_id','grouped_id','checkpoint','source_stock_control','owner_token'];
 for(const id of ids){const model=by.get(id);assert.ok(model.gallery.length>=1&&model.gallery.length<=8);const hashes=[];for(const item of model.gallery){const file=path.join(root,item.src.replace(/^\.\//,''));assert.ok(fs.statSync(file).size>0);hashes.push(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'))}assert.equal(new Set(hashes).size,hashes.length);const json=JSON.stringify(model);for(const key of forbidden)assert.ok(!json.includes(`"${key}"`));}
});
test('six mains and corrected collage are real files with exact 1800x1200 PNG',()=>{
 const mainHashes=ids.map(id=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,by.get(id).image.replace(/^\.\//,'')))).digest('hex'));assert.equal(new Set(mainHashes).size,6);
 const batch=batches.find(x=>x.id==='ouart-daily-six-20260725');const png=fs.readFileSync(path.join(root,batch.collage.replace(/^\.\//,'')));assert.equal(png.readUInt32BE(16),1800);assert.equal(png.readUInt32BE(20),1200);
});
test('gallery provides keyboard-focusable accessible dialog lightbox',()=>{
 const js=fs.readFileSync(path.join(root,'site.js'),'utf8');assert.match(js,/document\.createElement\("dialog"\)/);assert.match(js,/trigger\.type = "button"/);assert.match(js,/lightbox\.showModal\(\)/);assert.match(js,/aria-label/);
});
