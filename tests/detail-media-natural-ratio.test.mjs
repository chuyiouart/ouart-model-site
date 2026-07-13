import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const site = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'model.html'), 'utf8');

function firstRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `missing CSS rule ${selector}`);
  return match[1];
}

test('detail primary media uses intrinsic ratio without a fixed frame or letterbox', () => {
  const media = firstRule('.detail-media');
  assert.doesNotMatch(media, /aspect-ratio\s*:/);
  assert.doesNotMatch(media, /(?:^|;)\s*(?:min-|max-)?height\s*:/);
  assert.match(media, /background\s*:\s*transparent/);
  assert.match(media, /align-self\s*:\s*start/);

  const image = firstRule('.detail-media img');
  assert.match(image, /display\s*:\s*block/);
  assert.match(image, /width\s*:\s*min\(100%,\s*var\(--detail-image-natural-width,\s*100%\)\)/);
  assert.match(image, /height\s*:\s*auto/);
  assert.match(image, /max-width\s*:\s*100%/);
  assert.match(image, /object-fit\s*:\s*contain/);
  assert.match(image, /aspect-ratio\s*:\s*auto/);
  assert.doesNotMatch(image, /object-fit\s*:\s*cover/);
});

test('detail primary media preserves intrinsic pixel width and image protections', () => {
  assert.match(site, /image\.naturalWidth/);
  assert.match(site, /--detail-image-natural-width/);
  assert.match(html, /id="detail-image"[^>]*data-no-visual-search="true"[^>]*draggable="false"[^>]*disablepictureinpicture/);
});

test('mobile and gallery rules keep complete images without overflow-oriented cropping', () => {
  assert.match(css, /@media \(max-width: 390px\)[\s\S]*\.gallery-grid \{ grid-template-columns: 1fr; \}/);
  assert.match(firstRule('.gallery-grid img'), /height\s*:\s*auto/);
  assert.match(firstRule('.gallery-grid img'), /object-fit\s*:\s*contain/);
  assert.doesNotMatch(firstRule('.gallery-grid img'), /object-fit\s*:\s*cover/);
});
