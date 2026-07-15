import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('data/models.js', 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);
const models = context.window.OUART_MODELS;

const hiddenIds = [
  'curiosity-rover-detailed',
  'herakles-archer',
  'angel-wing-deck-box',
  'axe-3d-print-model',
  'legacy-8199'
];
assert.equal(models.filter((model) => model.hidden === true).map((model) => model.id).join(','), hiddenIds.join(','));
for (const id of hiddenIds) {
  const model = models.find((item) => item.id === id);
  assert.ok(model, `missing hidden record ${id}`);
  assert.equal(model.published, false, `${id} must not be published`);
  assert.equal(model.hidden, true, `${id} must be hidden`);
  assert.equal(model.unlisted, true, `${id} must be unlisted`);
}

const legacyAxe = models.filter((model) =>
  model.name?.includes('2026年07月09日STL图纸文件分享') &&
  `${model.name} ${model.description} ${model.intro}`.includes('Axe 3D Print Model')
);
assert.equal(legacyAxe.map((model) => model.id).join(','), 'legacy-8199');
assert.ok(models.filter((model) => model.published === true).length >= 148);
assert.ok(models.find((model) => model.id === 'gabimaru-myanimate' && model.published === true && model.image));
assert.equal(models.find((model) => model.id === 'legacy-8198').published, true, 'unrelated history must stay public');
assert.equal(models.find((model) => model.id === 'legacy-8192').published, true, 'unrelated history must stay public');

const site = fs.readFileSync('site.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const modelHtml = fs.readFileSync('model.html', 'utf8');
const legacyHtml = fs.readFileSync('content/posts/8199.html', 'utf8');
assert.ok(site.includes('model.published !== true'));
assert.ok(site.includes('noindex, nofollow'));
assert.ok(site.includes('内容已下架'));
assert.ok(!site.includes('|| models[0]'), 'unknown direct links must never fall back to a public record');
assert.match(legacyHtml, /name="robots" content="noindex, nofollow"/);
assert.ok(legacyHtml.includes('内容已下架'));
assert.ok(!legacyHtml.includes('pan.baidu.com'));
assert.match(css, /@media \(max-width: 390px\)\s*\{[\s\S]*?\.gallery-grid \{ grid-template-columns: 1fr; \}/);
assert.doesNotMatch(site, /console\.(?:log|info|warn|error|debug)\s*\(/);
assert.doesNotMatch(modelHtml, /console\.(?:log|info|warn|error|debug)\s*\(/);
console.log('hidden-records focused static tests: PASS');
