(function () {
  "use strict";

  const models = window.OUART_MODELS || [];
  const publicModels = models.filter((model) => model && model.published === true);
  const batches = Array.isArray(window.OUART_BATCHES) ? window.OUART_BATCHES : [];
  const publicBatches = batches.filter((batch) => batch && batch.published === true);
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-nav");

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
  let visibleCount = 8;

  function arrowIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 6l6 6-6 6" /></svg>';
  }

  function modelUrl(model) {
    return model.page || `./model.html?id=${encodeURIComponent(model.id)}`;
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

  function modelThumb(model, width) {
    return `./assets/thumbs/models/${encodeURIComponent(model.id)}-${width}.webp`;
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
      `data-fallback="${escapeHtml(model.image)}"`,
      `loading="${priority ? "eager" : "lazy"}"`,
      'decoding="async"',
      priority ? 'fetchpriority="high"' : ""
    ].filter(Boolean).join(" ");
  }

  function setResponsiveModelImage(image, model, context = "detail", priority = false) {
    image.src = modelThumb(model, 480);
    image.srcset = `${modelThumb(model, 480)} 480w, ${modelThumb(model, 960)} 960w`;
    image.sizes = context === "detail" ? "(max-width: 900px) 100vw, 58vw" : "180px";
    image.dataset.fallback = model.image;
    image.loading = priority ? "eager" : "lazy";
    image.decoding = "async";
    if (priority) image.fetchPriority = "high";
  }

  function setResponsiveBatchImage(image, batch, priority = false) {
    image.src = batchThumb(batch, 720);
    image.srcset = `${batchThumb(batch, 720)} 720w, ${batchThumb(batch, 1200)} 1200w`;
    image.sizes = "(max-width: 900px) 100vw, 70vw";
    image.dataset.fallback = batch.collage;
    image.loading = priority ? "eager" : "lazy";
    image.decoding = "async";
    if (priority) image.fetchPriority = "high";
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

  function renderHero() {
    const latestBatch = publicBatches.find((batch) => batch.id && batch.collage);
    if (latestBatch) {
      const heroLink = document.getElementById("hero-link");
      const heroLabel = document.getElementById("hero-link-label");
      const heroMedia = document.getElementById("hero-media");
      const heroImage = document.getElementById("hero-image");
      const href = `./batch.html?id=${encodeURIComponent(latestBatch.id)}`;
      if (heroLink) heroLink.href = href;
      if (heroLabel) heroLabel.textContent = "查看今日六件";
      if (heroMedia && heroImage) {
        heroMedia.href = href;
        heroMedia.setAttribute("aria-label", latestBatch.title || "查看今日六件");
        setResponsiveBatchImage(heroImage, latestBatch, true);
        heroImage.alt = latestBatch.collageAlt || "OUART MODEL 今日六件模型拼图";
        protectModelImage(heroImage);
        heroMedia.hidden = false;
      }
      return;
    }
    const latest = publicModels.find((model) => model.id && model.image);
    if (!latest) return;

    const heroLink = document.getElementById("hero-link");
    const heroLabel = document.getElementById("hero-link-label");
    const heroMedia = document.getElementById("hero-media");
    const heroImage = document.getElementById("hero-image");
    const href = modelUrl(latest);

    if (heroLink) {
      heroLink.href = href;
      heroLink.setAttribute("aria-label", `查看 ${modelName(latest)}`);
    }
    if (heroLabel) heroLabel.textContent = `查看 ${modelName(latest)}`;
    if (heroMedia && heroImage) {
      heroMedia.href = href;
      heroMedia.setAttribute("aria-label", `查看 ${modelName(latest)}`);
      setResponsiveModelImage(heroImage, latest, "detail", true);
      heroImage.alt = cleanText(latest.alt) || `${modelName(latest)} 模型预览`;
      protectModelImage(heroImage);
      heroMedia.hidden = false;
    }
  }

  renderHero();

  function renderDailyBatch() {
    const section = document.getElementById("daily-batch");
    const batch = publicBatches[0];
    if (!section || !batch || !Array.isArray(batch.modelIds) || batch.modelIds.length !== 6) return;
    const href = `./batch.html?id=${encodeURIComponent(batch.id)}`;
    const link = document.getElementById("daily-batch-link");
    const collageLink = document.getElementById("daily-batch-collage-link");
    const collage = document.getElementById("daily-batch-collage");
    const cards = document.getElementById("daily-batch-cards");
    if (link) link.href = href;
    if (collageLink) collageLink.href = href;
    if (collage) {
      setResponsiveBatchImage(collage, batch);
      collage.alt = batch.collageAlt || "OUART MODEL 今日六件模型拼图";
      protectModelImage(collage);
    }
    if (cards) {
      cards.replaceChildren();
      batch.modelIds.map((id) => publicModels.find((model) => model.id === id)).filter(Boolean).forEach((model, index) => {
        const card = document.createElement("a");
        card.className = "batch-quick-card";
        card.href = modelUrl(model);
        card.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(modelName(model))}</strong>`;
        cards.appendChild(card);
      });
    }
    section.hidden = false;
  }

  renderDailyBatch();

  function renderList(query) {
    if (!list) return;
    const normalized = String(query || "").trim().toLowerCase();
    const filtered = publicModels.filter((model) => {
      const searchable = [model.displayName, model.nameZh, model.nameEn, model.name, model.date, model.format]
        .map(cleanText).join(" ").toLocaleLowerCase();
      return searchable.includes(normalized);
    });

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
  }

  if (list) {
    renderList("");
    search.addEventListener("input", (event) => renderList(event.target.value));
    loadMore?.addEventListener("click", () => {
      visibleCount += 8;
      renderList(search.value);
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
      image.loading = "lazy";
      image.decoding = "async";
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
    const model = id ? models.find((item) => item.id === id) : null;
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
    if (model.published) {
      link.href = model.downloadUrl;
      code.textContent = model.shareCode;
      copy.addEventListener("click", async () => {
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
      link.textContent = "下载信息整理中";
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
      protectModelImage(secondary);
      secondaryWrap.hidden = false;
    }
  }

  const batchRoot = document.getElementById("batch-detail");
  if (batchRoot) {
    const id = new URLSearchParams(window.location.search).get("id");
    const batch = id ? publicBatches.find((item) => item.id === id) : publicBatches[0];
    if (!batch || !Array.isArray(batch.modelIds) || batch.modelIds.length !== 6) {
      document.title = "合集暂不可用｜OUART MODEL";
      batchRoot.innerHTML = '<section class="unavailable-model" role="status"><h1>合集暂不可用</h1><a class="primary-button" href="./index.html">返回首页</a></section>';
    } else {
      document.title = `${batch.title}｜OUART MODEL`;
      document.getElementById("batch-title").textContent = batch.title;
      document.getElementById("batch-description").textContent = batch.description || "";
      const collage = document.getElementById("batch-collage");
      setResponsiveBatchImage(collage, batch, true);
      collage.alt = batch.collageAlt || `${batch.title} 六件模型拼图`;
      protectModelImage(collage);
      const actions = document.getElementById("batch-actions");
      if (actions && batch.downloadUrl) {
        const download = document.createElement("a");
        download.className = "primary-button";
        download.href = batch.downloadUrl;
        download.target = "_blank";
        download.rel = "noopener noreferrer";
        download.textContent = "打开六件合集";
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
          <div><p class="batch-number">${String(index + 1).padStart(2, "0")} / 06</p><h2>${escapeHtml(modelName(model))}</h2><p>${escapeHtml(model.description || "")}</p><a class="primary-button" href="${modelUrl(model)}">查看详情</a></div>`;
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

    section.append(text, image);
    detailPage.appendChild(section);
  }

  window.OUART_insertModelCommunityCta = insertModelCommunityCta;
  insertModelCommunityCta();
})();
