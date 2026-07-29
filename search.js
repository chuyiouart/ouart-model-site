(function (global) {
  "use strict";

  const SEARCH_FIELDS = [
    "id", "displayName", "nameZh", "nameEn", "name", "date", "displayDate",
    "category", "author", "format", "usage", "description", "tags", "keywords"
  ];
  const DATE_PATTERN = /(\d{4})\s*(?:年|[./-])\s*(\d{1,2})\s*(?:月|[./-])\s*(\d{1,2})\s*日?/u;

  function fold(value) {
    return String(value ?? "").normalize("NFKC").toLocaleLowerCase();
  }

  function normalize(value) {
    return fold(value)
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function compact(value) {
    return fold(value).replace(/[^\p{L}\p{N}]+/gu, "");
  }

  function validDateKey(yearText, monthText, dayText) {
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function extractDate(value) {
    const text = fold(value);
    const match = text.match(DATE_PATTERN);
    if (!match) return { key: "", remainder: text };
    const key = validDateKey(match[1], match[2], match[3]);
    if (!key) return { key: "", remainder: text };
    return {
      key,
      remainder: `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    };
  }

  function modelDateKeys(model) {
    return [model?.date, model?.displayDate]
      .map((value) => extractDate(value).key)
      .filter(Boolean);
  }

  function searchableText(model) {
    return SEARCH_FIELDS.flatMap((field) => {
      const value = model?.[field];
      return Array.isArray(value) ? value : [value];
    }).filter((value) => value != null).join(" ");
  }

  function queryTokens(value) {
    return normalize(value).split(" ").filter(Boolean).map(compact);
  }

  function matchesModel(model, query) {
    if (!fold(query).trim()) return true;
    const parsed = extractDate(query);
    if (parsed.key && !modelDateKeys(model).includes(parsed.key)) return false;
    const tokens = queryTokens(parsed.remainder);
    const corpus = compact(searchableText(model));
    return tokens.every((token) => corpus.includes(token));
  }

  function filterModels(models, query) {
    const source = Array.isArray(models) ? models : [];
    return source.filter((model) => matchesModel(model, query));
  }

  global.OUART_SEARCH = Object.freeze({ normalize, matchesModel, filterModels });
})(window);
