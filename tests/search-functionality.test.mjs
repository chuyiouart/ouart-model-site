import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);

function loadSearchApi() {
  const source = fs.readFileSync(new URL('../search.js', import.meta.url), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.window.OUART_SEARCH;
}

const fixtures = [
  {
    id: 'makima-il-paddyy',
    displayName: '玛琪玛雕像｜Makima by Il Paddyy',
    nameZh: '玛琪玛雕像',
    nameEn: 'Makima by Il Paddyy',
    date: '2026-07-29',
    displayDate: '2026.07.29',
    category: '角色雕像',
    author: 'Il Paddyy',
    format: 'STL',
    description: '树脂打印角色雕像'
  },
  {
    id: 'rhino-beetle-lamp',
    displayName: '独角仙甲虫灯｜Rhino Beetle Lamp',
    nameZh: '独角仙甲虫灯',
    nameEn: 'Rhino Beetle Lamp',
    date: '2026-07-29',
    displayDate: '2026.07.29',
    category: '功能/FDM',
    author: '来源作者',
    format: 'STL',
    usage: '灯具组装与照明应用'
  }
];

test('search supports Chinese, English, author, category and flexible dates', () => {
  const api = loadSearchApi();
  assert.ok(api);
  assert.deepEqual(Array.from(api.filterModels(fixtures, '玛琪玛')), [fixtures[0]]);
  assert.deepEqual(Array.from(api.filterModels(fixtures, 'makima paddyy')), [fixtures[0]]);
  assert.deepEqual(Array.from(api.filterModels(fixtures, '角色 Il')), [fixtures[0]]);
  assert.deepEqual(Array.from(api.filterModels(fixtures, '功能 fdm')), [fixtures[1]]);
  assert.equal(api.filterModels(fixtures, '2026/7/29').length, 2);
  assert.equal(api.filterModels(fixtures, '2026年07月29日').length, 2);
});

test('search ignores punctuation and requires every query token', () => {
  const api = loadSearchApi();
  assert.deepEqual(Array.from(api.filterModels(fixtures, 'Rhino-Beetle 灯')), [fixtures[1]]);
  assert.deepEqual(Array.from(api.filterModels(fixtures, 'IlPaddyy')), [fixtures[0]]);
  const daVinci = { displayName: '列奥纳多·达·芬奇｜Leonardo-da-Vinci' };
  assert.deepEqual(Array.from(api.filterModels([daVinci], '达芬奇')), [daVinci]);
  assert.deepEqual(Array.from(api.filterModels([daVinci], 'LeonardodaVinci')), [daVinci]);
  assert.equal(api.filterModels(fixtures, 'Makima 灯具').length, 0);
  assert.equal(api.filterModels(fixtures, '   ').length, 2);
});

test('date search compares calendar components instead of numeric substrings', () => {
  const api = loadSearchApi();
  assert.equal(api.filterModels(fixtures, '2026/7/2').length, 0);
  assert.equal(api.filterModels(fixtures, '2026-07-29').length, 2);
  assert.deepEqual(Array.from(api.filterModels(fixtures, '角色 2026.7.29')), [fixtures[0]]);
});

test('homepage exposes immediate search results and loads search core before site code', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const site = fs.readFileSync(new URL('../site.js', import.meta.url), 'utf8');
  assert.match(html, /id="search-results"/);
  assert.match(html, /id="search-status"[^>]*aria-live="polite"/);
  assert.ok(html.indexOf('search.js') < html.indexOf('site.js'));
  assert.match(site, /window\.OUART_SEARCH/);
  assert.match(site, /search-results/);
  assert.match(site, /keydown/);
  assert.match(site, /event\.isComposing/);
});

test('search combobox supports a complete keyboard-operated listbox contract', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const site = fs.readFileSync(new URL('../site.js', import.meta.url), 'utf8');
  assert.match(html, /role="combobox"/);
  assert.match(html, /role="listbox"/);
  assert.match(site, /setAttribute\("role", "option"\)/);
  assert.match(site, /more\.setAttribute\("role", "option"\)/);
  assert.match(site, /event\.key === "ArrowDown"/);
  assert.match(site, /event\.key === "ArrowUp"/);
  assert.match(site, /aria-activedescendant/);
  assert.match(site, /aria-selected/);
});
