import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import vm from "node:vm";

const siteRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(siteRoot, "..", "chuyiouart-site");
const sourcePosts = join(sourceRoot, "content", "posts");
const targetPosts = join(siteRoot, "content", "posts");
const targetAssets = join(siteRoot, "assets");

function stripTags(value = "") {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#8211;|&#8212;/gi, "—").replace(/\s+/g, " ").trim();
}

function pick(html, pattern, fallback = "") {
  return html.match(pattern)?.[1]?.trim() || fallback;
}

function escapeHtml(value = "") {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function normalizeDate(value = "") {
  const match = value.match(/(20\d{2})[年\/.\-](\d{1,2})[月\/.\-](\d{1,2})/);
  if (!match) return value.slice(0, 10);
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function firstBaidu(html) {
  const raw = html.match(/https:\/\/pan\.baidu\.com\/s\/[A-Za-z0-9_-]+(?:\?pwd=[A-Za-z0-9]+)?/i)?.[0] || "";
  const queryCode = raw.match(/[?&]pwd=([A-Za-z0-9]+)/i)?.[1] || "";
  const nearbyCode = stripTags(html).match(/提取码\s*[：:]?\s*([A-Za-z0-9]{4})/i)?.[1] || "";
  return { url: raw.replace(/\?pwd=[A-Za-z0-9]+/i, ""), code: queryCode || nearbyCode };
}

function copyReferencedAssets(html) {
  const sources = [...html.matchAll(/(?:src|poster)=["']\.\.\/\.\.\/assets\/([^"']+)["']/gi)].map((match) => match[1].split("?")[0]);
  for (const relative of new Set(sources)) {
    const from = join(sourceRoot, "assets", relative);
    const to = join(targetAssets, relative);
    if (!existsSync(from)) continue;
    mkdirSync(dirname(to), { recursive: true });
    if (!existsSync(to)) copyFileSync(from, to);
  }
}

function cleanContent(content) {
  return content
    .replace(/<p>本次测试分享来自 OUART 自动化流水线：[\s\S]*?<\/p>/i, "<p>本期模型已经完成文件整理与预览图匹配，便于查看模型内容并获取个人学习资源。</p>")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<img\b(?![^>]*\bloading=)([^>]*)>/gi, '<img loading="lazy"$1>')
    .replace(/https:\/\/pan\.baidu\.com\/s\/[A-Za-z0-9_-]+(?:\?pwd=[A-Za-z0-9]+)?/gi, (url) => `<a href="${url.replace(/\?pwd=[A-Za-z0-9]+/i, "")}" target="_blank" rel="noopener">${url.replace(/\?pwd=[A-Za-z0-9]+/i, "")}</a>`);
}

function legacyPage({ title, date, content, download }) {
  const panel = download.url ? `<section class="legacy-download" aria-label="文件下载"><div><small>百度网盘</small><a href="${download.url}" target="_blank" rel="noopener">${download.url}</a></div>${download.code ? `<div class="legacy-code"><span>提取码</span><code>${escapeHtml(download.code)}</code></div>` : ""}</section>` : "";
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="theme-color" content="#000000" /><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /><meta name="apple-mobile-web-app-title" content="OUART MODEL" /><title>${escapeHtml(title)}｜OUART MODEL</title><link rel="icon" href="../../assets/logo-mark.svg" type="image/svg+xml" /><link rel="icon" href="../../assets/favicon-32.png" type="image/png" sizes="32x32" /><link rel="shortcut icon" href="../../favicon.ico" /><link rel="apple-touch-icon" href="../../assets/apple-touch-icon.png" sizes="180x180" /><link rel="mask-icon" href="../../assets/logo-mask.svg" color="#000000" /><link rel="manifest" href="../../site.webmanifest" /><link rel="stylesheet" href="../../styles.css" /></head>
<body>
<header class="site-header"><a class="brand" href="../../index.html" aria-label="OUART MODEL 首页"><img class="brand-mark" src="../../assets/logo-mark.svg" alt="" width="42" height="42" /><span class="brand-copy"><strong>OUART MODEL</strong><span>初艺模型分享</span></span></a><button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span><span class="sr-only">打开导航</span></button><nav id="site-nav" class="site-nav" aria-label="主导航"><a href="../../index.html#latest">最新模型</a><a class="active" href="../../index.html#archive">全部模型</a><a href="../../index.html#guide">使用说明</a></nav></header>
<main class="legacy-detail"><a class="back-link" href="../../index.html#latest"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M10 6l-6 6 6 6" /></svg>返回全部模型</a><article class="legacy-article"><header><h1>${escapeHtml(title)}</h1><time datetime="${date}">${date.replaceAll("-", ".")}</time></header>${panel}<div class="legacy-content">${content}</div></article></main>
<footer class="site-footer"><p>OUART MODEL</p><p>初艺模型分享</p></footer><script src="../../site.js"></script>
</body></html>`;
}

mkdirSync(targetPosts, { recursive: true });

const currentCode = readFileSync(join(siteRoot, "data", "models.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(currentCode, sandbox);
const curated = (sandbox.window.OUART_MODELS || []).filter((item) => !item.legacy);
const migrated = [];

for (const filename of readdirSync(sourcePosts).filter((name) => name.endsWith(".html"))) {
  const source = join(sourcePosts, filename);
  const html = readFileSync(source, "utf8");
  if (!html.includes('<p class="eyebrow">模型分享</p>') && !html.includes("STL MODEL ARCHIVE")) continue;
  const numericId = basename(filename, ".html");
  if (numericId === "8200") continue;

  const title = stripTags(pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i, pick(html, /<title>([\s\S]*?)<\/title>/i, `模型分享 ${numericId}`)).replace(/\s*[|｜]\s*初艺 OUART\s*$/i, ""));
  const rawDate = pick(html, /<p class="content-meta">([\s\S]*?)<\/p>/i, pick(html, /<time[^>]*datetime=["']([^"']+)/i, ""));
  const date = normalizeDate(stripTags(rawDate) || title);
  const content = pick(html, /<div class="wp-content">([\s\S]*?)<\/div>\s*<\/article>/i, pick(html, /<article class="article-content">([\s\S]*?)<\/article>/i, "<p>历史模型内容。</p>"));
  const imageSource = content.match(/<img[^>]+src=["']\.\.\/\.\.\/assets\/([^"']+)["']/i)?.[1]?.split("?")[0] || "";
  const cleanedContent = cleanContent(content);
  const excerpt = stripTags(cleanedContent).slice(0, 110);
  const download = firstBaidu(content);

  copyReferencedAssets(content);
  writeFileSync(join(targetPosts, filename), legacyPage({ title, date, content: cleanedContent, download }), "utf8");
  migrated.push({
    id: `legacy-${numericId}`,
    name: title,
    date,
    displayDate: date.replaceAll("-", "."),
    format: "STL",
    fileCount: null,
    size: "",
    usage: "个人学习",
    image: imageSource ? `./assets/${imageSource}` : "./assets/models/axe/preview-1.jpg",
    alt: `${title} 模型预览`,
    description: excerpt,
    intro: excerpt,
    downloadUrl: download.url,
    shareCode: download.code,
    published: true,
    legacy: true,
    page: `./content/posts/${filename}`
  });
}

migrated.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
writeFileSync(join(siteRoot, "data", "models.js"), `window.OUART_MODELS = ${JSON.stringify([...curated, ...migrated], null, 2)};\n`, "utf8");
console.log(JSON.stringify({ curated: curated.length, migrated: migrated.length, total: curated.length + migrated.length }, null, 2));
