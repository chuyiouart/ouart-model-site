import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("homepage exposes a prominent and safe Telegram group link", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

  assert.match(html, /class="hero-actions"/);
  assert.match(html, /class="telegram-button"/);
  assert.match(html, /href="https:\/\/t\.me\/OUARTSTL"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, />加入 TG 模型群</);
  assert.match(css, /\.telegram-button\s*\{/);
  assert.match(css, /\.hero-actions\s*\{/);
});
