import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const posts = join(root, "content", "posts");

const appMeta = [
  '<meta name="theme-color" content="#000000" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="OUART MODEL" />',
  '<link rel="icon" href="../../assets/logo-mark.svg" type="image/svg+xml" />',
  '<link rel="icon" href="../../assets/favicon-32.png" type="image/png" sizes="32x32" />',
  '<link rel="shortcut icon" href="../../favicon.ico" />',
  '<link rel="apple-touch-icon" href="../../assets/apple-touch-icon.png" sizes="180x180" />',
  '<link rel="mask-icon" href="../../assets/logo-mask.svg" color="#000000" />',
  '<link rel="manifest" href="../../site.webmanifest" />'
].join("");

const oldBrand = '<a class="brand" href="../../index.html"><strong>OUART MODEL</strong><span>初艺模型分享</span></a>';
const newBrand = '<a class="brand" href="../../index.html" aria-label="OUART MODEL 首页"><img class="brand-mark" src="../../assets/logo-mark.svg" alt="" width="42" height="42" /><span class="brand-copy"><strong>OUART MODEL</strong><span>初艺模型分享</span></span></a>';

let changed = 0;

for (const name of readdirSync(posts).filter((file) => file.endsWith(".html"))) {
  const file = join(posts, name);
  const before = readFileSync(file, "utf8");
  let after = before;

  if (!after.includes('rel="apple-touch-icon"')) {
    after = after.replace('<meta name="theme-color" content="#ffffff" />', appMeta);
  }

  after = after.replace(oldBrand, newBrand);

  if (after !== before) {
    writeFileSync(file, after, "utf8");
    changed += 1;
  }
}

console.log(JSON.stringify({ changed }, null, 2));
