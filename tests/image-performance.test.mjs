import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");

function readWindowArray(relativePath, name) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), context);
  return context.window[name];
}

test("every public model and batch has lightweight WebP derivatives", () => {
  const models = readWindowArray("data/models.js", "OUART_MODELS").filter((item) => item.published === true);
  const batches = readWindowArray("data/batches.js", "OUART_BATCHES").filter((item) => item.published === true);

  for (const model of models) {
    for (const width of [480, 960]) {
      const file = path.join(root, "assets", "thumbs", "models", `${model.id}-${width}.webp`);
      assert.ok(fs.existsSync(file), `missing ${file}`);
      assert.ok(fs.statSync(file).size < 225 * 1024, `${file} is unexpectedly large`);
    }
    (model.gallery || []).forEach((_, index) => {
      const file = path.join(
        root,
        "assets",
        "thumbs",
        "gallery",
        `${model.id}-${String(index + 1).padStart(2, "0")}.webp`
      );
      assert.ok(fs.existsSync(file), `missing ${file}`);
      assert.ok(fs.statSync(file).size < 120 * 1024, `${file} is unexpectedly large`);
    });
  }

  for (const batch of batches) {
    for (const width of [720, 1200]) {
      const file = path.join(root, "assets", "thumbs", "batches", `${batch.id}-${width}.webp`);
      assert.ok(fs.existsSync(file), `missing ${file}`);
      assert.ok(fs.statSync(file).size < 150 * 1024, `${file} is unexpectedly large`);
    }
  }
});

test("rendering code uses responsive derivatives with original-image fallback", () => {
  const source = fs.readFileSync(path.join(root, "site.js"), "utf8");
  assert.match(source, /assets\/thumbs\/models/);
  assert.match(source, /assets\/thumbs\/gallery/);
  assert.match(source, /assets\/thumbs\/batches/);
  assert.match(source, /data-fallback/);
  assert.match(source, /srcset/);
  assert.match(source, /decoding="async"/);
});
