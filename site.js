(function () {
  "use strict";

  const models = window.OUART_MODELS || [];
  const publicModels = models.filter((model) => model && model.published === true);
  const batches = Array.isArray(window.OUART_BATCHES) ? window.OUART_BATCHES : [];
  const publicBatches = batches.filter((batch) => batch && batch.published === true);
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");


  // Keep the cross-site escape hatch available on every model page, including
  // legacy content/posts pages that reuse this shared script. This is created
  // here instead of in one template so future daily pages inherit it too.
  function ensureMainHomeReturn() {
    if (!document.body || document.querySelector("[data-ouart-main-home-return]")) return;
    const link = document.createElement("a");
    link.className = "ouart-main-home-return ouart-main-home-return--floating";
    link.href = "https://chuyiouart.com/";
    link.setAttribute("data-ouart-main-home-return", "");
    link.setAttribute("aria-label", "返回 OUART 主站首页");
    link.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M3.75 10.7 12 3.9l8.25 6.8v8.35a1.2 1.2 0 0 1-1.2 1.2h-4.8v-5.5h-4.5v5.5h-4.8a1.2 1.2 0 0 1-1.2-1.2V10.7Z"/></svg><span>返回 OUART 主站</span>';
    document.body.appendChild(link);
  }

  ensureMainHomeReturn();

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
    });
    nav.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    });
  }

  const list = document.getElementById("model-list");
  const search = document.getElementById("model-search");
  const empty = document.getElementById("empty-state");
  const resultCount = document.getElementById("result-count");
  const loadMore = document.getElementById("load-more");
  const searchResults = document.getElementById("search-results");
  const searchStatus = document.getElementById("search-status");
  const searchApi = window.OUART_SEARCH;
  let visibleCount = 8;
  let activeSearchIndex = -1;

  function arrowIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 6l6 6-6 6" /></svg>';
  }

  function modelUrl(model) {
    const candidate = model.page || `./model.html?id=${encodeURIComponent(model.id)}`;
    try {
      const url = new URL(candidate, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "#latest";
    } catch {
      return "#latest";
    }
  }

  // Bilingual fields are optional: migrated records continue to use `name`.
  function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function modelName(model) {
    const explicit = cleanText(model?.displayName);
    if (explicit) return explicit;
    const zh = cleanText(model?.nameZh);
    const en = cleanText(model?.nameEn);
    if (zh && en && zh.toLocaleLowerCase() !== en.toLocaleLowerCase()) return `${zh} ${en}`;
    return zh || en || cleanText(model?.name) || "未命名模型";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }

  function protectModelImage(image) {
    if (!image) return;
    image.setAttribute("data-no-visual-search", "true");
    image.draggable = false;
    image.setAttribute("disablepictureinpicture", "");
  }

  // Build the source URL from two literals so the legacy mirror plugin's
  // destination rewrite cannot accidentally turn a fallback into another 404.
  const SOURCE_SITE_BASE = "https://chuyiouart.github.io" + "/ouart-model-site/";

  function sourceAsset(relative) {
    const value = String(relative || "").trim();
    if (!value) return "";
    try {
      return new URL(value, SOURCE_SITE_BASE).href;
    } catch {
      return "";
    }
  }

  function modelThumb(model, width) {
    return `./assets/thumbs/models/${encodeURIComponent(model.id)}-${width}.webp`;
  }

  function modelSourceThumb(model, width = 480) {
    return `${SOURCE_SITE_BASE}assets/thumbs/models/${encodeURIComponent(model.id)}-${width}.webp`;
  }

  function galleryThumb(model, index) {
    return `./assets/thumbs/gallery/${encodeURIComponent(model.id)}-${String(index + 1).padStart(2, "0")}.webp`;
  }

  function batchThumb(batch, width) {
    return `./assets/thumbs/batches/${encodeURIComponent(batch.id)}-${width}.webp`;
  }

  function responsiveModelAttributes(model, context = "list", priority = false) {
    const sizes = context === "detail"
      ? "(max-width: 900px) 100vw, 58vw"
      : context === "batch"
        ? "(max-width: 900px) 100vw, 55vw"
        : "180px";
    return [
      `src="${escapeHtml(modelThumb(model, 480))}"`,
      `srcset="${escapeHtml(modelThumb(model, 480))} 480w, ${escapeHtml(modelThumb(model, 960))} 960w"`,
      `sizes="${sizes}"`,
      `data-fallback="${escapeHtml(modelSourceThumb(model, 480) || sourceAsset(model.image))}"`,
      `loading="${priority ? "eager" : "lazy"}"`,
      'decoding="async"',
      priority ? 'fetchpriority="high"' : ""
    ].filter(Boolean).join(" ");
  }

  function setResponsiveModelImage(image, model, context = "detail", priority = false) {
    image.src = modelThumb(model, 480);
    image.srcset = `${modelThumb(model, 480)} 480w, ${modelThumb(model, 960)} 960w`;
    image.sizes = context === "detail" ? "(max-width: 900px) 100vw, 58vw" : "180px";
    image.dataset.fallback = modelSourceThumb(model, 480) || sourceAsset(model.image);
    image.loading = priority ? "eager" : "lazy";
    image.decoding = "async";
    if (priority) image.fetchPriority = "high";
    else image.fetchPriority = "low";
  }

  function setResponsiveBatchImage(image, batch, priority = false) {
    image.src = batchThumb(batch, 720);
    image.srcset = `${batchThumb(batch, 720)} 720w, ${batchThumb(batch, 1200)} 1200w`;
    image.sizes = "(max-width: 900px) 100vw, 70vw";
    image.dataset.fallback = sourceAsset(batch.collage) || batch.collage;
    image.loading = priority ? "eager" : "lazy";
    image.decoding = "async";
    if (priority) image.fetchPriority = "high";
    else image.fetchPriority = "low";
  }

  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.fallback) return;
    const fallback = image.dataset.fallback;
    delete image.dataset.fallback;
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    image.src = fallback;
  }, true);

  function preserveNaturalImageWidth(image) {
    if (!image) return;
    const applyNaturalWidth = () => {
      if (image.naturalWidth > 0) {
        image.style.setProperty("--detail-image-natural-width", `${image.naturalWidth}px`);
      }
    };
    if (image.complete) applyNaturalWidth();
    else image.addEventListener("load", applyNaturalWidth, { once: true });
  }

  function beijingDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  let renderedQuoteDateKey = "";

  function renderDailyQuote(date = new Date()) {
    const selectQuote = window.OUART_DAILY_QUOTE_FOR_DATE;
    if (typeof selectQuote !== "function") return;
    const currentDateKey = beijingDateKey(date);
    if (currentDateKey === renderedQuoteDateKey) return;
    const quote = selectQuote(currentDateKey);
    if (!quote) return;
    const text = document.getElementById("daily-quote-text");
    const author = document.getElementById("daily-quote-author");
    const source = document.getElementById("daily-quote-source");
    if (text) text.textContent = `“${quote.textZh}”`;
    if (author) {
      const context = [quote.authorZh, quote.period, quote.country].filter(Boolean);
      author.textContent = context.join("｜");
    }
    if (source && quote.sourceUrl) {
      try {
        const sourceUrl = new URL(quote.sourceUrl, window.location.href);
        if (["http:", "https:"].includes(sourceUrl.protocol)) {
          source.href = sourceUrl.href;
          source.title = quote.sourceTitle || "查看名言出处";
          source.hidden = false;
        }
      } catch {
        source.hidden = true;
      }
    }
    renderedQuoteDateKey = currentDateKey;
  }

  renderDailyQuote();
  window.setInterval(renderDailyQuote, 60_000);

  function batchModels(batch) {
    if (!batch || !Array.isArray(batch.modelIds)) return [];
    return batch.modelIds
      .slice(0, 6)
      .map((id) => publicModels.find((model) => model.id === id))
      .filter((model) => model && model.image);
  }

  // Never render a six-slot canvas with missing cells. The count-specific grid
  // keeps every real image visible and leaves the sizing decision to CSS.
  function renderBatchImageGrid(root, batch, label = "本期模型预览") {
    const models = batchModels(batch);
    if (!root || !models.length || models.length > 6) return false;
    root.className = `batch-image-grid count-${models.length}`;
    root.setAttribute("aria-label", `${label}，共${models.length}件`);
    root.replaceChildren();
    models.forEach((model, index) => {
      const cell = document.createElement("span");
      cell.className = "batch-image-cell";
      cell.setAttribute("aria-label", modelName(model));
      const image = document.createElement("img");
      setResponsiveModelImage(image, model, "card", index === 0);
      image.alt = cleanText(model.alt) || `${modelName(model)} 模型预览`;
      image.loading = index === 0 ? "eager" : "lazy";
      protectModelImage(image);
      cell.appendChild(image);
      root.appendChild(cell);
    });
    return true;
  }

  function renderHero() {
    const latestBatch = publicBatches.find((batch) => batch.id && batchModels(batch).length);
    if (latestBatch) {
      const heroLink = document.getElementById("hero-link");
      const heroLabel = document.getElementById("hero-link-label");
      const heroMedia = document.getElementById("hero-media");
      const heroGrid = document.getElementById("hero-model-grid");
      const href = `./batch.html?id=${encodeURIComponent(latestBatch.id)}`;
      const count = batchModels(latestBatch).length;
      if (heroLink) heroLink.href = href;
      if (heroLabel) heroLabel.textContent = `查看本期${count}件`;
      if (heroMedia && heroGrid && renderBatchImageGrid(heroGrid, latestBatch, "本期模型预览")) {
        heroMedia.href = href;
        heroMedia.setAttribute("aria-label", latestBatch.title || "查看本期更新");
        heroMedia.hidden = false;
      }
      return;
    }
    const latest = publicModels.find((model) => model.id && model.image);
    if (!latest) return;

    const heroLink = document.getElementById("hero-link");
    const heroLabel = document.getElementById("hero-link-label");
    const heroMedia = document.getElementById("hero-media");
    const heroGrid = document.getElementById("hero-model-grid");
    const href = modelUrl(latest);

    if (heroLink) {
      heroLink.href = href;
      heroLink.setAttribute("aria-label", `查看 ${modelName(latest)}`);
    }
    if (heroLabel) heroLabel.textContent = `查看 ${modelName(latest)}`;
    if (heroMedia && heroGrid && renderBatchImageGrid(heroGrid, { modelIds: [latest.id] }, "最新模型预览")) {
      heroMedia.href = href;
      heroMedia.setAttribute("aria-label", `查看 ${modelName(latest)}`);
      heroMedia.hidden = false;
    }
  }

  renderHero();

  function renderDailyBatch() {
    const section = document.getElementById("daily-batch");
    const batch = publicBatches[0];
    if (!section || !batch || !Array.isArray(batch.modelIds) || batch.modelIds.length < 1 || batch.modelIds.length > 6) return;
    const href = `./batch.html?id=${encodeURIComponent(batch.id)}`;
    const link = document.getElementById("daily-batch-link");
    const cards = document.getElementById("daily-batch-cards");
    const models = batchModels(batch);
    if (link) link.href = href;
    if (cards) {
      cards.replaceChildren();
      cards.className = `batch-quick-cards count-${models.length}`;
      models.forEach((model, index) => {
        const card = document.createElement("a");
        card.className = "batch-quick-card";
        card.href = modelUrl(model);
        card.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(modelName(model))}</strong>`;
        cards.appendChild(card);
      });
    }
    const title = document.getElementById("daily-batch-title");
    if (title) title.textContent = `本期更新（${models.length}件）`;
    section.hidden = false;
  }

  // The standalone daily-batch block is intentionally removed. The hero collage
  // and the archive's current-update entry are the only required surfaces.
  renderList("");
  function searchOptions() {
    return searchResults ? Array.from(searchResults.querySelectorAll('[role="option"]')) : [];
  }

  function resetActiveSearchOption() {
    activeSearchIndex = -1;
    search?.removeAttribute("aria-activedescendant");
    searchOptions().forEach((option) => option.setAttribute("aria-selected", "false"));
  }

  function moveActiveSearchOption(direction) {
    const options = searchOptions();
    if (!options.length) return false;
    activeSearchIndex = activeSearchIndex < 0
      ? (direction > 0 ? 0 : options.length - 1)
      : (activeSearchIndex + direction + options.length) % options.length;
    options.forEach((option, index) => option.setAttribute("aria-selected", String(index === activeSearchIndex)));
    const active = options[activeSearchIndex];
    search?.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
    return true;
  }

  function renderSearchResults(query, filtered) {
    if (!searchResults || !searchStatus) return;
    const hasQuery = Boolean(String(query || "").trim());
    if (!hasQuery) {
      searchResults.hidden = true;
      searchResults.replaceChildren();
      resetActiveSearchOption();
      search?.setAttribute("aria-expanded", "false");
      searchStatus.textContent = "输入关键词，结果会立即显示在这里。";
      return;
    }
    searchStatus.textContent = filtered.length === 1
      ? "找到 1 个模型；按回车可直接打开详情。"
      : filtered.length > 1
        ? `找到 ${filtered.length} 个模型；按回车可查看完整结果。`
        : "没有找到匹配的模型，可以换一个名称、作者、分类或日期。";
    if (!filtered.length) {
      searchResults.hidden = true;
      searchResults.replaceChildren();
      resetActiveSearchOption();
      search?.setAttribute("aria-expanded", "false");
      return;
    }
    searchResults.replaceChildren();
    resetActiveSearchOption();
    filtered.slice(0, 6).forEach((model, index) => {
      const result = document.createElement("a");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      result.className = "search-result";
      result.id = `search-result-${index}`;
      result.href = modelUrl(model);
      result.setAttribute("role", "option");
      result.setAttribute("aria-selected", "false");
      result.tabIndex = -1;
      title.textContent = modelName(model);
      meta.textContent = `${model.displayDate || model.date || ""}${model.category ? ` · ${model.category}` : ""}`;
      result.append(title, meta);
      searchResults.appendChild(result);
    });
    if (filtered.length > 6) {
      const more = document.createElement("a");
      more.className = "search-result search-result-more";
      more.id = "search-result-more";
      more.href = "#latest";
      more.setAttribute("role", "option");
      more.setAttribute("aria-selected", "false");
      more.tabIndex = -1;
      more.textContent = `查看全部 ${filtered.length} 个结果`;
      searchResults.appendChild(more);
    }
    searchResults.hidden = false;
    search?.setAttribute("aria-expanded", "true");
  }

  function matchingModels(query) {
    if (searchApi?.filterModels) return searchApi.filterModels(publicModels, query);
    const normalized = String(query || "").trim().toLocaleLowerCase();
    return publicModels.filter((model) => {
      const searchable = [model.displayName, model.nameZh, model.nameEn, model.name, model.date, model.displayDate, model.format, model.category, model.author]
        .map(cleanText).join(" ").toLocaleLowerCase();
      return searchable.includes(normalized);
    });
  }

  function renderList(query) {
    if (!list) return;
    const normalized = String(query || "").trim();
    const filtered = matchingModels(normalized);

    const visible = normalized ? filtered : filtered.slice(0, visibleCount);
    list.innerHTML = visible.map((model, index) => `
      <a class="model-row${index === 0 ? " featured" : ""}" href="${modelUrl(model)}">
        <span class="model-thumb"><img ${responsiveModelAttributes(model)} alt="${escapeHtml(cleanText(model.alt) || `${modelName(model)} 模型预览`)}" data-no-visual-search="true" draggable="false" disablepictureinpicture /></span>
        <span class="model-summary">
          <strong>${escapeHtml(modelName(model))}</strong>
          <span>${escapeHtml(model.displayDate)}${model.fileCount ? `<i></i>${escapeHtml(model.fileCount)} 个 ${escapeHtml(model.format)}` : `<i></i>${escapeHtml(model.format)} 模型分享`}${model.size ? `<i></i>${escapeHtml(model.size)}` : ""}</span>
        </span>
        <span class="row-status">${model.published ? "查看详情" : "归档预览"}</span>
        <span class="row-arrow">${arrowIcon()}</span>
      </a>
    `).join("");
    empty.hidden = filtered.length !== 0;
    if (resultCount) resultCount.textContent = normalized ? `找到 ${filtered.length} 个结果` : `${filtered.length} 个模型`;
    if (loadMore) loadMore.hidden = Boolean(normalized) || visible.length >= filtered.length;
    renderSearchResults(normalized, filtered);
  }

  if (list) {
    renderList("");
    if (search) {
      search.addEventListener("input", () => {
        resetActiveSearchOption();
        renderList(search.value);
      });
      search.addEventListener("keydown", (event) => {
        if (event.isComposing) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          if (moveActiveSearchOption(event.key === "ArrowDown" ? 1 : -1)) event.preventDefault();
          return;
        }
        if (event.key === "Escape") {
          search.value = "";
          resetActiveSearchOption();
          renderList("");
          return;
        }
        if (event.key !== "Enter" || !search.value.trim()) return;
        event.preventDefault();
        const active = searchOptions()[activeSearchIndex];
        if (active) {
          active.click();
          return;
        }
        const matches = matchingModels(search.value);
        if (matches.length === 1) window.location.href = modelUrl(matches[0]);
        else document.getElementById("latest")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    loadMore?.addEventListener("click", () => {
      visibleCount += 8;
      renderList(search?.value || "");
    });
  }

  function renderStructuredSections(model) {
    const sectionRoot = document.getElementById("detail-sections");
    const legacyIntro = document.getElementById("detail-legacy-intro");
    const sections = Array.isArray(model.sections) ? model.sections.filter((item) => item && item.title && Array.isArray(item.paragraphs)) : [];
    if (!sectionRoot || !sections.length) {
      if (legacyIntro) legacyIntro.hidden = false;
      return;
    }
    sectionRoot.replaceChildren();
    sections.forEach((item) => {
      const article = document.createElement("article");
      article.className = "model-section";
      const heading = document.createElement("h2");
      heading.textContent = item.title;
      article.appendChild(heading);
      item.paragraphs.filter(Boolean).forEach((paragraph) => {
        const text = document.createElement("p");
        text.textContent = paragraph;
        article.appendChild(text);
      });
      sectionRoot.appendChild(article);
    });
    sectionRoot.hidden = false;
    if (legacyIntro) legacyIntro.hidden = true;
  }

  function ensureGalleryLightbox() {
    let dialog = document.getElementById("gallery-lightbox");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "gallery-lightbox";
    dialog.className = "gallery-lightbox";
    dialog.setAttribute("aria-label", "模型图片大图预览");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "gallery-lightbox-close";
    close.setAttribute("aria-label", "关闭大图预览");
    close.textContent = "×";
    close.addEventListener("click", () => dialog.close());
    const image = document.createElement("img");
    image.alt = "";
    const caption = document.createElement("p");
    dialog.append(close, image, caption);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function renderGallery(model) {
    const section = document.getElementById("detail-gallery-section");
    const root = document.getElementById("detail-gallery");
    const gallery = Array.isArray(model.gallery) ? model.gallery.filter((item) => item && item.src && item.alt) : [];
    if (!section || !root || !gallery.length) return;
    const lightbox = ensureGalleryLightbox();
    root.replaceChildren();
    gallery.forEach((item, index) => {
      const figure = document.createElement("figure");
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "gallery-open";
      trigger.setAttribute("aria-label", `查看大图：${item.alt}`);
      const image = document.createElement("img");
      image.src = galleryThumb(model, index);
      image.dataset.fallback = item.src;
      image.alt = item.alt;
      image.width = 640;
      image.height = 480;
      image.loading = "lazy";
      image.decoding = "async";
      image.fetchPriority = "low";
      protectModelImage(image);
      trigger.appendChild(image);
      trigger.addEventListener("click", () => {
        const full = lightbox.querySelector("img");
        const caption = lightbox.querySelector("p");
        full.src = item.src;
        full.alt = item.alt;
        caption.textContent = cleanText(item.label) || item.alt;
        lightbox.showModal();
      });
      figure.appendChild(trigger);
      const rawLabel = cleanText(item.label);
      const generatedSuffix = ["A", "I", "生", "成"].join("");
      const label = rawLabel.endsWith(generatedSuffix)
        ? rawLabel.slice(0, -generatedSuffix.length).replace(/[｜|]\s*$/, "").trim()
        : rawLabel;
      if (label) {
        const caption = document.createElement("figcaption");
        caption.textContent = label;
        figure.appendChild(caption);
      }
      root.appendChild(figure);
    });
    section.hidden = false;
  }

  function renderAuthorLicense(model) {
    const section = document.getElementById("detail-author-license");
    const root = document.getElementById("author-license-content");
    const data = model.authorLicense;
    if (!section || !root || !data || !data.author || !data.license) return;
    root.replaceChildren();
    const summary = document.createElement("p");
    summary.textContent = `作者：${data.author}｜许可：${data.license}`;
    root.appendChild(summary);
    const links = [
      ["官方模型 / 原始来源页", data.sourceUrl],
      ["Wikimedia Commons 原始文件页", data.wikimediaUrl],
      ["Thingiverse 作者作品页", data.thingiverseUrl],
      [`${data.license || "许可"} 许可文本`, data.licenseUrl]
    ].filter((item) => item[1]);
    if (links.length) {
      const list = document.createElement("ul");
      links.forEach(([label, href]) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.textContent = label;
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener";
        item.appendChild(link);
        list.appendChild(item);
      });
      root.appendChild(list);
    }
    if (data.note) {
      const note = document.createElement("p");
      note.textContent = data.note;
      root.appendChild(note);
    }
    section.hidden = false;
    const usageNote = document.getElementById("download-usage-note");
    if (usageNote) usageNote.textContent = "使用、改编与再分享请遵循本页“作者与许可”说明。";
  }

  const detailRoot = document.getElementById("model-detail");
  if (detailRoot) {
    const id = new URLSearchParams(window.location.search).get("id");
    // Accept both canonical batch-scoped IDs and legacy short IDs. A short ID
    // must resolve to exactly one published model to avoid ambiguous matches.
    const exactModel = id ? publicModels.find((item) => item.id === id) : null;
    const shortMatches = id
      ? publicModels.filter((item) => item.id && item.id.includes(":") && item.id.split(":").pop() === id)
      : [];
    const model = exactModel || (shortMatches.length === 1 ? shortMatches[0] : null);
    if (!model || model.published !== true) {
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, nofollow";
      document.title = "内容已下架｜OUART MODEL";
      detailRoot.innerHTML = '<section class="unavailable-model" role="status"><p class="eyebrow">OUART MODEL</p><h1>内容已下架</h1><p>该模型记录不再公开展示。</p><a class="primary-button" href="./index.html#archive">返回全部模型</a></section>';
      return;
    }

    const name = modelName(model);
    document.title = `${name}｜OUART MODEL`;
    const image = document.getElementById("detail-image");
    setResponsiveModelImage(image, model, "detail", true);
    image.alt = cleanText(model.alt) || `${name} 模型预览`;
    protectModelImage(image);
    preserveNaturalImageWidth(image);
    document.getElementById("detail-title").textContent = name;
    const date = document.getElementById("detail-date");
    date.textContent = model.displayDate;
    date.dateTime = model.date;
    document.getElementById("detail-description").textContent = model.description;
    document.getElementById("detail-intro").textContent = model.intro || "";
    renderStructuredSections(model);
    renderGallery(model);
    renderAuthorLicense(model);
    document.getElementById("detail-meta").innerHTML = `
      <div><dt>文件格式</dt><dd>${model.format}</dd></div>
      <div><dt>文件数量</dt><dd>${model.fileCount}</dd></div>
      <div><dt>压缩包</dt><dd>${model.size}</dd></div>
      <div><dt>用途</dt><dd>${model.usage}</dd></div>
    `;

    const panel = document.getElementById("download-panel");
    const link = document.getElementById("download-link");
    const code = document.getElementById("share-code");
    const copy = document.getElementById("copy-code");
    const hasDownload = typeof model.downloadUrl === "string" && model.downloadUrl.trim() !== "";
    const hasShareCode = typeof model.shareCode === "string" && model.shareCode.trim() !== "";
    if (model.published && hasDownload) {
      link.href = model.downloadUrl;
      code.textContent = hasShareCode ? model.shareCode : "—";
      copy.hidden = !hasShareCode;
      if (hasShareCode) copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(model.shareCode);
          copy.classList.add("copied");
          copy.setAttribute("aria-label", "已复制提取码");
          window.setTimeout(() => copy.classList.remove("copied"), 1600);
        } catch (_) {
          code.focus?.();
        }
      });
    } else {
      panel.classList.add("pending");
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.textContent = model.published ? "下载信息暂未提供" : "下载信息整理中";
      code.textContent = "—";
      copy.hidden = true;
    }

    if (model.secondaryImage) {
      const secondaryWrap = document.getElementById("detail-secondary-wrap");
      const secondary = document.getElementById("detail-secondary");
      secondary.src = model.secondaryImage;
      secondary.alt = `${name} 细节预览`;
      secondary.loading = "lazy";
      secondary.decoding = "async";
      secondary.fetchPriority = "low";
      protectModelImage(secondary);
      secondaryWrap.hidden = false;
    }
  }

  const batchRoot = document.getElementById("batch-detail");
  if (batchRoot) {
    const id = new URLSearchParams(window.location.search).get("id");
    const batch = id ? publicBatches.find((item) => item.id === id) : publicBatches[0];
    if (!batch || !Array.isArray(batch.modelIds) || batch.modelIds.length < 1 || batch.modelIds.length > 6) {
      document.title = "合集暂不可用｜OUART MODEL";
      batchRoot.innerHTML = '<section class="unavailable-model" role="status"><h1>合集暂不可用</h1><a class="primary-button" href="./index.html">返回首页</a></section>';
    } else {
      document.title = `${batch.title}｜OUART MODEL`;
      document.getElementById("batch-title").textContent = batch.title;
      document.getElementById("batch-description").textContent = batch.description || "";
      const collage = document.getElementById("batch-collage");
      setResponsiveBatchImage(collage, batch, true);
      collage.alt = batch.collageAlt || `${batch.title} ${batch.modelIds.length}件模型拼图`;
      protectModelImage(collage);
      const actions = document.getElementById("batch-actions");
      if (actions && batch.downloadUrl) {
        const download = document.createElement("a");
        download.className = "primary-button";
        download.href = batch.downloadUrl;
        download.target = "_blank";
        download.rel = "noopener noreferrer";
        download.textContent = `打开${batch.modelIds.length}件合集`;
        const code = document.createElement("span");
        code.className = "batch-share-code";
        code.textContent = batch.shareCode ? `提取码 ${batch.shareCode}` : "";
        actions.replaceChildren(download, code);
      }
      const root = document.getElementById("batch-models");
      batch.modelIds.map((modelId) => publicModels.find((model) => model.id === modelId)).filter(Boolean).forEach((model, index) => {
        const section = document.createElement("article");
        section.className = "batch-model-section";
        section.id = `model-${model.id}`;
        section.innerHTML = `
          <a class="batch-model-image" href="${modelUrl(model)}"><img ${responsiveModelAttributes(model, "batch", index === 0)} alt="${escapeHtml(model.alt || `${modelName(model)} 模型预览`)}" data-no-visual-search="true" draggable="false" disablepictureinpicture /></a>
          <div><p class="batch-number">${String(index + 1).padStart(2, "0")} / ${String(batch.modelIds.length).padStart(2, "0")}</p><h2>${escapeHtml(modelName(model))}</h2><p>${escapeHtml(model.description || "")}</p><a class="primary-button" href="${modelUrl(model)}">查看详情</a></div>`;
        root.appendChild(section);
      });
    }
  }

  function insertModelCommunityCta() {
    const detailPage = document.querySelector(".detail-page, .legacy-detail");
    if (!detailPage || document.getElementById("model-community-cta") || document.querySelector(".model-community-cta")) return;

    const section = document.createElement("section");
    section.id = "model-community-cta";
    section.className = "model-community-cta";
    section.setAttribute("aria-label", "加入OUART模型交流群");

    const telegram = document.createElement("a");
    telegram.className = "model-community-telegram";
    telegram.href = "https://t.me/OUARTSTL";
    telegram.target = "_blank";
    telegram.rel = "noopener noreferrer";
    telegram.textContent = "点击加入 OUART STL Telegram 频道";

    const text = document.createElement("p");
    text.textContent = "可加微信“chuyimeishu01”，备注“模型资源”入群！";

    const image = document.createElement("img");
    const isLocal = location.hostname === "127.0.0.1" || location.hostname === "localhost";
    const localQrPath = location.pathname.includes("/content/posts/") ? "../../assets/shared/wechat-model-group-qr.png" : "./assets/shared/wechat-model-group-qr.png";
    image.src = isLocal ? new URL(localQrPath, location.href).href : "/ouart-model-site/assets/shared/wechat-model-group-qr.png";
    image.alt = "扫码添加微信，备注模型资源入群";
    protectModelImage(image);
    image.width = 472;
    image.height = 472;
    image.loading = "eager";

    section.append(telegram, text, image);
    detailPage.appendChild(section);
  }

  window.OUART_insertModelCommunityCta = insertModelCommunityCta;
  insertModelCommunityCta();
})();
