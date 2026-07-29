import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadQuotes() {
  const source = fs.readFileSync(new URL('../data/quotes.js', import.meta.url), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.window;
}

test('daily quote collection is sourced, diverse and publication-ready', () => {
  const data = loadQuotes();
  const quotes = data.OUART_QUOTES;
  assert.ok(Array.isArray(quotes));
  assert.ok(quotes.length >= 24);
  assert.equal(new Set(quotes.map((quote) => quote.id)).size, quotes.length);
  assert.equal(new Set(quotes.map((quote) => quote.textZh)).size, quotes.length);
  for (const quote of quotes) {
    assert.ok(quote.id && quote.textZh && quote.authorZh && quote.authorEn);
    assert.ok(quote.period && quote.country && quote.discipline);
    assert.match(quote.sourceUrl, /^https:\/\//);
    assert.ok(quote.sourceTitle);
  }
  assert.ok(new Set(quotes.map((quote) => quote.country)).size >= 8);
  assert.ok(new Set(quotes.map((quote) => quote.period)).size >= 4);
});

test('daily quote selection is deterministic and advances on the next Beijing date', () => {
  const data = loadQuotes();
  const select = data.OUART_DAILY_QUOTE_FOR_DATE;
  assert.equal(typeof select, 'function');
  const first = select('2026-07-29');
  assert.deepEqual(first, select('2026-07-29'));
  assert.notEqual(first.id, select('2026-07-30').id);
  assert.deepEqual(select('2026-07-29T23:30:00+08:00'), first);
  assert.deepEqual(select('2026-07-29T15:59:59Z'), first);
  assert.deepEqual(select('2026-07-29T16:00:00Z'), select('2026-07-30'));
});

test('translations preserve the supplied original meaning', () => {
  const quotes = loadQuotes().OUART_QUOTES;
  const hesse = quotes.find((quote) => quote.id === 'hesse-art-life');
  assert.equal(hesse.textZh, '艺术、工作、艺术与生活彼此紧密相连，而我的整个生命一直是荒诞的。');
});

test('Sol LeWitt quote links to a page that actually contains the cited passage', () => {
  const quotes = loadQuotes().OUART_QUOTES;
  const lewitt = quotes.find((quote) => quote.id === 'lewitt-idea-machine');
  assert.equal(lewitt.sourceUrl, 'https://en.wikiquote.org/wiki/Sol_LeWitt');
  assert.match(lewitt.sourceTitle, /Wikiquote/);
});

test('homepage replaces the static introduction with a daily quote component', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const site = fs.readFileSync(new URL('../site.js', import.meta.url), 'utf8');
  assert.match(html, /id="daily-quote"/);
  assert.match(html, /id="daily-quote-text"/);
  assert.match(html, /id="daily-quote-author"/);
  assert.ok(html.indexOf('data/quotes.js') < html.indexOf('site.js'));
  assert.match(site, /OUART_DAILY_QUOTE_FOR_DATE/);
  assert.match(site, /Asia\/Shanghai/);
  assert.match(site, /setInterval\(renderDailyQuote/);
});
