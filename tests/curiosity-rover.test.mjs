import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/models.js'), 'utf8'), sandbox);
const models = sandbox.window.OUART_MODELS;
const curiosity = models.find((model) => model.id === 'curiosity-rover-detailed');

test('Curiosity assets and structured attribution remain intact while record is hidden', () => {
  assert.equal(curiosity.published, false);
  assert.equal(curiosity.hidden, true);
  assert.equal(curiosity.unlisted, true);
  assert.equal(curiosity.nameZh, '好奇号火星车（精细可动版）');
  assert.equal(curiosity.nameEn, 'Curiosity Rover (Detailed, Articulated Print)');
  assert.equal(curiosity.gallery.length, 7);
  assert.equal(curiosity.gallery.filter((item) => item.official).length, 4);
  assert.equal(curiosity.gallery.filter((item) => item.generated).length, 3);
  assert.ok(curiosity.gallery.filter((item) => item.generated).every((item) => item.prompt && item.qa.passed));
  for (const item of curiosity.gallery) assert.ok(fs.existsSync(path.join(root, item.src.replace(/^\.\//, ''))));
});

test('Curiosity is absent from public Hero and search without affecting published models', () => {
  const publicModels = models.filter((model) => model.published === true);
  assert.notEqual(publicModels[0].id, 'curiosity-rover-detailed');
  assert.ok(publicModels.some((model) => model.id === 'gabimaru-myanimate'));
  const search = (query) => publicModels.filter((model) =>
    [model.displayName, model.nameZh, model.nameEn, model.name, model.date, model.format]
      .filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())
  );
  assert.equal(search('好奇号').length, 0);
  assert.equal(search('Curiosity').length, 0);
  assert.equal(search('Herakles').length, 0);
  assert.ok(search('Sitting Ghost').some((model) => model.id === 'sitting-ghost'));
  assert.ok(search('自来也').some((model) => model.id === 'jiraiya-x-naruto-kaidan'));
});
