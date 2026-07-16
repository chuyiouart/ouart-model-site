import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/models.js'), 'utf8'), sandbox);
const models = sandbox.window.OUART_MODELS;
const publicModels = models.filter((model) => model?.published === true);

const forbiddenPublicCopy = /Telegram|用户选定|来源分发策略|文件名线索|署名线索|非作者官方授权|AI生成|cover裁切|图库都应|图库都必须|不以延展图/;

test('published model data does not expose internal operations language', () => {
  for (const model of publicModels) {
    assert.equal(model.sourcePolicy, undefined, `${model.id} must keep sourcePolicy outside public data`);
    assert.doesNotMatch(JSON.stringify(model), forbiddenPublicCopy, `${model.id} exposes internal copy`);
  }
});

test('selected-source models use visitor-facing purpose and neutral rights copy', () => {
  const expectedUsage = new Map([
    ['6scale-woman-warrior-ca3d-pre-supported', '树脂打印｜分件涂装｜收藏级场景展示'],
    ['maka-soul-eater', '树脂打印｜角色涂装｜战斗场景展示'],
    ['gabimaru-myanimate', '树脂打印｜透明件涂装｜叙事场景展示'],
    ['jiraiya-x-naruto-kaidan', '树脂打印｜双人角色涂装｜师徒场景展示']
  ]);
  for (const [id, usage] of expectedUsage) {
    const model = models.find((item) => item.id === id);
    assert.ok(model, `missing ${id}`);
    assert.equal(model.usage, usage);
    assert.equal(model.authorLicense.license, '许可信息请以原始发布者说明为准');
    assert.match(model.authorLicense.note, /核对原始发布者提供的许可/);
  }
});
