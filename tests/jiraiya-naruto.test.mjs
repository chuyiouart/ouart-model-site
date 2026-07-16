import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/models.js'), 'utf8'), sandbox);
const model = sandbox.window.OUART_MODELS.find((item) => item.id === 'jiraiya-x-naruto-kaidan');

test('Jiraiya and Young Naruto publication record is complete and public', () => {
  assert.ok(model);
  assert.equal(model.published, true);
  assert.equal(model.fileCount, 38);
  assert.equal(model.faceCount, 50583624);
  assert.equal(model.downloadUrl, 'https://pan.baidu.com/s/1VXP7aJ56UXU266GVLvAacQ');
  assert.equal(model.shareCode, 'n3uh');
  assert.equal(model.sections.length, 5);
  assert.equal(model.gallery.length, 6);
  assert.equal(model.sourcePolicy, undefined);
  assert.equal(model.usage, '树脂打印｜双人角色涂装｜师徒场景展示');
  assert.match(model.authorLicense.note, /核对原始发布者/);
  assert.ok(model.gallery.every((item) => item.label && !item.label.includes('AI生成')));
  for (const item of [model.image, ...model.gallery.map((entry) => entry.src)]) {
    assert.ok(fs.existsSync(path.join(root, item.replace(/^\.\//, ''))), `missing asset ${item}`);
  }
});

test('Jiraiya gallery remains protected and contain-based', () => {
  const site = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(site, /data-no-visual-search=\"true\" draggable=\"false\" disablepictureinpicture/);
  assert.match(css, /\.gallery-grid img \{ width: 100%; height: auto; object-fit: contain; \}/);
  assert.match(css, /@media \(max-width: 390px\)[\s\S]*\.gallery-grid \{ grid-template-columns: 1fr; \}/);
});