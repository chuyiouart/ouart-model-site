(function () {
  "use strict";

  const models = window.OUART_MODELS || [];
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

  function renderHero() {
    const latest = models.find((model) => model && model.published === true && model.id && model.image);
    if (!latest) return;

    const heroLink = document.getElementById("hero-link");
    const heroLabel = document.getElementById("hero-link-label");
    const heroMedia = document.getElementById("hero-media");
    const heroImage = document.getElementById("hero-image");
    const href = modelUrl(latest);

    if (heroLink) {
      heroLink.href = href;
      heroLink.setAttribute("aria-label", `查看 ${latest.name}`);
    }
    if (heroLabel) heroLabel.textContent = `查看 ${latest.name}`;
    if (heroMedia && heroImage) {
      heroMedia.href = href;
      heroMedia.setAttribute("aria-label", `查看 ${latest.name}`);
      heroImage.src = latest.image;
      heroImage.alt = latest.alt || `${latest.name} 模型预览`;
      heroMedia.hidden = false;
    }
  }

  renderHero();

  function renderList(query) {
    if (!list) return;
    const normalized = String(query || "").trim().toLowerCase();
    const filtered = models.filter((model) => {
      return `${model.name} ${model.date} ${model.format}`.toLowerCase().includes(normalized);
    });

    const visible = normalized ? filtered : filtered.slice(0, visibleCount);
    list.innerHTML = visible.map((model, index) => `
      <a class="model-row${index === 0 ? " featured" : ""}" href="${modelUrl(model)}">
        <span class="model-thumb"><img src="${model.image}" alt="${model.alt}" loading="${index === 0 ? "eager" : "lazy"}" /></span>
        <span class="model-summary">
          <strong>${model.name}</strong>
          <span>${model.displayDate}${model.fileCount ? `<i></i>${model.fileCount} 个 ${model.format}` : `<i></i>${model.format} 模型分享`}${model.size ? `<i></i>${model.size}` : ""}</span>
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

  const detailRoot = document.getElementById("model-detail");
  if (detailRoot) {
    const id = new URLSearchParams(window.location.search).get("id") || models[0]?.id;
    const model = models.find((item) => item.id === id) || models[0];
    if (!model) return;

    document.title = `${model.name}｜OUART MODEL`;
    const image = document.getElementById("detail-image");
    image.src = model.image;
    image.alt = model.alt;
    document.getElementById("detail-title").textContent = model.name;
    const date = document.getElementById("detail-date");
    date.textContent = model.displayDate;
    date.dateTime = model.date;
    document.getElementById("detail-description").textContent = model.description;
    document.getElementById("detail-intro").textContent = model.intro;
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
      secondary.alt = `${model.name} 细节预览`;
      secondaryWrap.hidden = false;
    }
  }
})();
