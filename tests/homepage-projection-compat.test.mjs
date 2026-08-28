import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../site.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('homepage projection anchor and shared return control stay in the model shell', () => {
  assert.ok(index.includes('<section class="daily-batch" id="daily-batch" hidden aria-hidden="true"></section>'));
  assert.ok(index.includes('styles.css?v=model-shell-v4'));
  assert.ok(js.includes('ensureMainHomeReturn()'));
  assert.ok(js.includes('data-ouart-main-home-return'));
  assert.ok(css.includes('.ouart-main-home-return') && css.includes('position: fixed'));
});
