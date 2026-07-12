(function () {
  "use strict";

  const models = window.OUART_MODELS || [];
  const publicModels = models.filter((model) => model && model.published === true);
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
  let visibleCount = 12;

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

  function renderHero() {
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
      heroImage.src = latest.image;
      heroImage.alt = cleanText(latest.alt) || `${modelName(latest)} 模型预览`;
      protectModelImage(heroImage);
      heroMedia.hidden = false;
    }
  }

  renderHero();

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
        <span class="model-thumb"><img src="${escapeHtml(model.image)}" alt="${escapeHtml(cleanText(model.alt) || `${modelName(model)} 模型预览`)}" loading="${index === 0 ? "eager" : "lazy"}" data-no-visual-search="true" draggable="false" disablepictureinpicture /></span>
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
      visibleCount += 12;
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

  function renderGallery(model) {
    const section = document.getElementById("detail-gallery-section");
    const root = document.getElementById("detail-gallery");
    const gallery = Array.isArray(model.gallery) ? model.gallery.filter((item) => item && item.src && item.alt) : [];
    if (!section || !root || !gallery.length) return;
    root.replaceChildren();
    gallery.forEach((item) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt;
      image.loading = "lazy";
      protectModelImage(image);
      figure.appendChild(image);
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
    const id = new URLSearchParams(window.location.search).get("id") || models[0]?.id;
    const model = models.find((item) => item.id === id) || models[0];
    if (!model) return;

    const name = modelName(model);
    document.title = `${name}｜OUART MODEL`;
    const image = document.getElementById("detail-image");
    image.src = model.image;
    image.alt = cleanText(model.alt) || `${name} 模型预览`;
    protectModelImage(image);
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
      protectModelImage(secondary);
      secondaryWrap.hidden = false;
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
