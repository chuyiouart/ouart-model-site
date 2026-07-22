import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/models.js'), 'utf8'), sandbox);
const models = sandbox.window.OUART_MODELS;
const byId = (id) => models.find((model) => model.id === id);
const absoluteAsset = (source) => path.join(root, source.replace(/^\.\//, ''));
const sha256 = (source) => crypto.createHash('sha256').update(fs.readFileSync(absoluteAsset(source))).digest('hex');
const forbidden = /(verified[_ -]?mesh[_ -]?render|mesh-(?:front|side|back)|wireframe|point[ _-]?cloud|技术渲染|真实模型渲染|真实网格)/i;

test('all published model-page image references exclude technical render media', () => {
  const published = models.filter((model) => model.published === true && !model.legacy);
  assert.ok(published.length >= 7);
  for (const model of published) {
    const rows = [{ src: model.image, alt: model.alt, label: 'main_image' }, ...(model.gallery || [])];
    for (const row of rows) {
      assert.ok(row.src, `${model.id}: missing image source`);
      assert.ok(fs.existsSync(absoluteAsset(row.src)), `${model.id}: missing ${row.src}`);
      assert.doesNotMatch(`${row.src} ${row.alt || ''} ${row.label || ''}`, forbidden, `${model.id}: prohibited public image reference`);
    }
  }
});

test('Sakamoto hero, card, detail and gallery use exact source 179760 with author logo retained', () => {
  const model = byId('sakamoto-days-taro-sakamoto-go3dfigures');
  assert.equal(model.image, './assets/models/sakamoto-days-taro-sakamoto-go3dfigures/source-179760.jpg');
  assert.equal(model.gallery[0].src, model.image);
  assert.match(model.gallery[0].label, /Go3DFigures/);
  assert.equal(sha256(model.image), 'df8b621026ba1d9a936669eab4d4afbc68fe1bba522c7e28f1b8ec8d071da002');
  assert.equal(model.gallery.length, 4);
});

test('Master Chief main and gallery begin with clean real source product image', () => {
  const model = byId('master-chief-halo');
  assert.equal(model.image, './assets/models/master-chief-halo/source-preview.jpg');
  assert.equal(model.gallery[0].src, model.image);
  assert.equal(sha256(model.image), '4ba513e31157d10d66d632b246b39fa9ac6fc2479e36e973a7c4a3b17621fe16');
  assert.equal(model.gallery.length, 4);
});

test('legacy technical render assets may remain on disk but are not referenced publicly', () => {
  const data = fs.readFileSync(path.join(root, 'data/models.js'), 'utf8');
  const retainedUnreferenced = [
    'assets/models/sakamoto-days-taro-sakamoto-go3dfigures/preview-1.png',
    'assets/models/sakamoto-days-taro-sakamoto-go3dfigures/scene-2.png',
    'assets/models/sakamoto-days-taro-sakamoto-go3dfigures/scene-3.png',
    'assets/models/sakamoto-days-taro-sakamoto-go3dfigures/scene-4.png',
    'assets/models/master-chief-halo/preview-1.png',
    'assets/models/master-chief-halo/scene-1.png',
    'assets/models/master-chief-halo/scene-2.png',
    'assets/models/master-chief-halo/scene-3.png',
    'assets/models/6scale-woman-warrior-ca3d-pre-supported/scene-3.png',
    'assets/models/maka-soul-eater/scene-3.png',
  ];
  for (const relative of retainedUnreferenced) {
    assert.ok(fs.existsSync(path.join(root, relative)), `retained audit asset missing: ${relative}`);
    assert.ok(!data.includes(`./${relative}`), `retained technical asset is still publicly referenced: ${relative}`);
  }
});
