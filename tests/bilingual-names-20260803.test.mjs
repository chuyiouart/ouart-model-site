import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/models.js'),'utf8'),sandbox);
const models=sandbox.window.OUART_MODELS;
const expected=new Map([
 ['model-1104723657520705-e00553',['玛琪玛与电次','Makima & Denji — Chainsaw Man']],
 ['harry-potter-stl-844373',['哈利·波特','Harry Potter']],
 ['turbo-granny-presupported-e5b51b',['高速婆婆','Turbo Granny (Presupported)']],
 ['nerikson-queen-of-spades-bust-t-me-9981c3',['黑桃皇后胸像','Queen of Spades Bust — Nerikson']],
 ['ryu-dd29ac',['隆','Ryu']],
 ['starter-poktmon-and-evolutions-and-pikachu-set-70be58',['宝可梦初始伙伴进化组与皮卡丘套装','Starter Pokémon Evolutions and Pikachu Set (10 Pieces)']],
]);

test('hard bilingual display contract is effective from 2026-08-03',()=>{
 for(const model of models.filter(row=>row.date>='2026-08-03')){
  assert.ok(model.nameZh.trim());assert.ok(model.nameEn.trim());
  assert.equal(model.displayName,`${model.nameZh}｜${model.nameEn}`);
  assert.equal(model.name,model.displayName);
  assert.notEqual(model.nameZh,model.nameEn);
  assert.doesNotMatch(model.displayName,/unknown|t\.me|https?:\/\/|提取码|chuyimeishu01/i);
 }
});

test('2026-08-03 exact six use evidence-backed canonical names and relevant alt text',()=>{
 const current=models.filter(row=>row.date==='2026-08-03');
 assert.equal(current.length,6);assert.deepEqual(new Set(current.map(row=>row.id)),new Set(expected.keys()));
 for(const model of current){
  const [zh,en]=expected.get(model.id);const display=`${zh}｜${en}`;
  assert.equal(model.nameZh,zh);assert.equal(model.nameEn,en);assert.equal(model.name,display);assert.equal(model.displayName,display);
  assert.ok(model.alt.includes(display));assert.ok(model.gallery.every(item=>item.alt.includes(display)));
 }
});
