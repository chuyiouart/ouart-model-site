import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/models.js'), 'utf8'), sandbox);
const models = sandbox.window.OUART_MODELS;
const model = models.find((item) => item.id === 'gabimaru-myanimate');

test('Gabimaru formal publication record is complete, bilingual and public', () => {
  assert.ok(model);
  assert.ok(models.filter((item) => item.published === true).some((item) => item.id === model.id));
  assert.equal(model.published, true);
  assert.equal(model.nameZh, '画眉丸·绯焰忍法场景');
  assert.equal(model.nameEn, 'Gabimaru — myAnimate');
  assert.equal(model.displayName, '画眉丸·绯焰忍法场景｜Gabimaru — myAnimate');
  assert.equal(model.fileCount, 61);
  assert.equal(model.faceCount, 22924894);
  assert.equal(model.downloadUrl, 'https://pan.baidu.com/s/1_o7iuIGk-SERB9-Mg7M1vw');
  assert.equal(model.shareCode, 'ox68');
  assert.equal(model.sections.length, 5);
  assert.equal(model.gallery.length, 7);
  assert.equal(model.sourcePolicy, undefined);
  assert.equal(model.usage, '树脂打印｜透明件涂装｜叙事场景展示');
  assert.match(model.authorLicense.note, /核对原始发布者/);
  assert.ok(model.gallery.every((item) => item.label && !item.label.includes('AI生成')));
  for (const item of [model.image, ...model.gallery.map((entry) => entry.src)]) {
    assert.ok(fs.existsSync(path.join(root, item.replace(/^\.\//, ''))), `missing asset ${item}`);
  }
});

test('Gabimaru has four real evidence views and three distinct scene directions', () => {
  assert.deepEqual(
    Array.from(model.gallery.slice(0, 4), (item) => item.label),
    ['真实资料｜面部与手臂火焰', '真实资料｜生态地台细节', '真实资料｜侧前三分之四全景', '真实资料｜侧面火焰与地台结构']
  );
  assert.deepEqual(
    Array.from(model.gallery.slice(4), (item) => item.label),
    ['月下古寺·绯火回环', '雨林峡谷·焰影映流', '夜间美术馆·忍火展演']
  );
});
