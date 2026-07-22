import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data/models.js'),'utf8'),sandbox);const models=sandbox.window.OUART_MODELS;const model=models.find(x=>x.id==='maka-soul-eater');
test('Maka publication remains complete, bilingual and protected after newer formal publications',()=>{
 assert.ok(model);assert.equal(models.filter(x=>x.published===true)[0].id,'sakamoto-days-taro-sakamoto-go3dfigures');assert.equal(model.nameZh,'玛卡·猎魂魔镰场景');assert.equal(model.nameEn,'Maka — Soul Eater by Nomnom Figures');assert.equal(model.fileCount,11);assert.equal(model.faceCount,22341254);assert.equal(model.shareCode,'tjug');assert.equal(model.sourcePolicy,undefined);assert.equal(model.usage,'树脂打印｜角色涂装｜战斗场景展示');assert.equal(model.sections.length,5);assert.equal(model.gallery.length,5);assert.match(model.authorLicense.note,/核对原始发布者/);assert.ok(model.gallery.every(x=>x.label&&!x.label.includes('AI生成')));for(const p of [model.image,...model.gallery.map(x=>x.src)])assert.ok(fs.existsSync(path.join(root,p.replace(/^\.\//,''))),p);
});
test('Maka gallery contains real evidence and three distinct applications',()=>{
 assert.deepEqual(Array.from(model.gallery.slice(0,2),x=>x.label),['真实资料｜正面三分之四','真实资料｜背面结构']);assert.deepEqual(Array.from(model.gallery.slice(2),x=>x.label),['月下学院·魔镰巡夜','涂装工坊·刃与烟的层次','日出屋顶·猎魂启程']);
});
