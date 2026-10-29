const CATEGORY_LABEL = { security: "SECURITY", ai: "AI SYSTEMS" };

async function loadProjects() {
  const res = await fetch("projects.json");
  const projects = await res.json();
  projects.sort((a, b) => (b.pinned_top ? 1 : 0) - (a.pinned_top ? 1 : 0));
  return projects;
}

function cardHTML(p) {
  const pending = p.status !== "ready";
  const clickable = !pending && !!p.detail;
  const thumbImg = !pending && p.screenshot
    ? `<img src="${p.screenshot}" alt="${p.title} 스크린샷">`
    : "";
  const oneLiner = pending ? "콘텐츠 준비 중입니다." : (p.one_liner || "");
  const roles = pending ? "" : (p.roles || []).join(" · ");
  const award = p.award ? `<p class="award-tag">🏆 ${p.award}</p>` : "";
  const statusLabel = pending ? "콘텐츠 준비 중" : "LIVE";
  const catLabel = CATEGORY_LABEL[p.category] || p.category.toUpperCase();
  const githubLink = (!pending && p.github)
    ? `<a class="card-github-link" href="${p.github}" target="_blank" rel="noopener">GitHub에서 보기 ↗</a>`
    : "";

  const inner = `
    <div class="thumb">
      <div class="thumb-meta">
        <span class="cat-label">${catLabel}</span>
        <span class="status-pill${pending ? " pending" : ""}"><i></i>${statusLabel}</span>
      </div>
      ${thumbImg}
    </div>
    <div class="card-body">
      <h3>${p.title}</h3>
      <p class="one-liner">${oneLiner}</p>
      <p class="roles">${roles}</p>
      ${award}
      <div class="card-footer">${githubLink}</div>
    </div>`;

  const classNames = ["project-card"];
  if (pending) classNames.push("pending");
  if (clickable) classNames.push("clickable");

  if (clickable) {
    return `<div class="${classNames.join(" ")}" role="button" tabindex="0" data-project-id="${p.id}" aria-label="${p.title} 자세히 보기">${inner}</div>`;
  }
  return `<div class="${classNames.join(" ")}">${inner}</div>`;
}

// ---- project detail pane content (rendered into a dynamic file tab) ----

function detailHeroHTML(d) {
  if (!d.hero_image) return "";
  return `<div class="detail-hero"><img src="${d.hero_image}" alt="프로젝트 대표 이미지"></div>`;
}

function detailIntroHTML(d) {
  if (!d.intro) return "";
  const lines = d.intro.split("\n").map(line => `<p>${line}</p>`).join("");
  return `<div class="detail-intro">${lines}</div>`;
}

function detailInfoTableHTML(rows) {
  if (!rows || !rows.length) return "";
  const body = rows.map(r => `<tr><th>${r.label}</th><td>${r.value}</td></tr>`).join("");
  return `<table class="detail-info-table">${body}</table>`;
}

function detailFlowStepHTML(step) {
  const bullets = (step.bullets || []).map(b => `<li>${b}</li>`).join("");
  const media = step.image
    ? `<figure class="detail-flow-media">
        <img src="${step.image}" alt="${step.image_caption || step.title}">
        ${step.image_caption ? `<figcaption>${step.image_caption}</figcaption>` : ""}
      </figure>`
    : "";
  return `
    <div class="detail-flow-step">
      <div class="detail-flow-num">${step.step}</div>
      <div class="detail-flow-body">
        <h4>${step.title}</h4>
        <ul>${bullets}</ul>
        ${media}
      </div>
    </div>`;
}

function detailFlowHTML(steps) {
  if (!steps || !steps.length) return "";
  return `<div class="detail-flow">${steps.map(detailFlowStepHTML).join("")}</div>`;
}

function detailProblemsHTML(problems) {
  if (!problems || !problems.length) return "";
  const rows = problems.map(p => `<tr><td>${p.problem}</td><td>${p.solution}</td></tr>`).join("");
  return `
    <table class="detail-problems-table">
      <thead><tr><th>문제</th><th>해결</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function detailLeadershipHTML(items) {
  if (!items || !items.length) return "";
  return `<ul class="detail-leadership-list">${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
}

function detailMetricsHTML(d) {
  if (!d.metrics || !d.metrics.length) return "";
  const rows = d.metrics.map(m => `<tr><th>${m.label}</th><td>${m.value}</td></tr>`).join("");
  const note = d.metrics_note ? `<p class="detail-metrics-note">${d.metrics_note}</p>` : "";
  return `<table class="detail-metrics-table">${rows}</table>${note}`;
}

function projectDetailHTML(p) {
  const d = p.detail;
  if (!d) return "";
  const noteTag = d.note ? ` <span class="detail-note-tag">${d.note}</span>` : "";
  const githubCTA = p.github
    ? `<a class="detail-github-link" href="${p.github}" target="_blank" rel="noopener">GitHub에서 전체 코드 보기 ↗</a>`
    : "";
  const problemsSection = (d.problems && d.problems.length)
    ? `<h3 class="detail-section-title">문제 해결</h3>${detailProblemsHTML(d.problems)}`
    : "";
  const leadershipSection = (d.leadership && d.leadership.length)
    ? `<h3 class="detail-section-title">리더십</h3>${detailLeadershipHTML(d.leadership)}`
    : "";
  const metricsSection = (d.metrics && d.metrics.length)
    ? `<h3 class="detail-section-title">성과${noteTag}</h3>${detailMetricsHTML(d)}`
    : "";

  return `
    <div class="project-detail">
      <p class="eyebrow">CASE STUDY</p>
      <h2>${p.title}</h2>
      ${detailHeroHTML(d)}
      ${detailIntroHTML(d)}
      ${detailInfoTableHTML(d.info_table)}
      ${detailFlowHTML(d.flow)}
      ${problemsSection}
      ${leadershipSection}
      ${metricsSection}
      ${githubCTA}
    </div>`;
}

function matchesFilter(p, filter) {
  if (filter === "all") return true;
  if (filter === "ai") return p.category === "ai";
  if (filter === "security-project") return p.category === "security" && p.subgroup === "project";
  if (filter === "security-ctf") return p.category === "security" && p.subgroup === "ctf";
  return false;
}

function render(projects, filter) {
  const grid = document.getElementById("project-grid");
  const list = projects.filter(p => matchesFilter(p, filter));
  grid.innerHTML = list.map(cardHTML).join("");
}

async function init() {
  const projects = await loadProjects();
  render(projects, "all");

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render(projects, btn.dataset.filter);
    });
  });

  document.getElementById("award").addEventListener("click", () => {
    goToFile("projects");
  });

  const grid = document.getElementById("project-grid");
  grid.addEventListener("click", (e) => {
    if (e.target.closest(".card-github-link")) return;
    const card = e.target.closest(".project-card.clickable");
    if (!card) return;
    const p = projects.find(proj => proj.id === card.dataset.projectId);
    if (p) openProjectDetail(p);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".project-card.clickable");
    if (!card) return;
    e.preventDefault();
    const p = projects.find(proj => proj.id === card.dataset.projectId);
    if (p) openProjectDetail(p);
  });
}

init();

// ---- VSCode shell: explorer/tab file switching, line-number gutter, mobile sidebar ----

const FILE_LANG = {
  readme: "Markdown",
  resume: "Markdown",
  education: "Markdown",
  skills: "JSON",
  projects: "Markdown",
  contact: "Markdown",
};
const PROJECT_DETAIL_TAB_LABELS = {
  "lease-companion": "슬기로운계약생활.md",
};
const LINE_HEIGHT = 20; // px — decorative only, not tied to real line count
const MOBILE_QUERY = "(max-width: 600px)";

function validFileKey(key) {
  return Object.prototype.hasOwnProperty.call(FILE_LANG, key) ? key : "readme";
}

function currentHashFile() {
  return validFileKey(location.hash.slice(1));
}

function renderGutter() {
  const gutter = document.getElementById("gutter");
  const content = document.getElementById("editorContent");
  const scroller = document.getElementById("editorScroll");
  if (!gutter || !content) return;
  const contentHeight = Math.max(content.scrollHeight, scroller ? scroller.clientHeight : 0);
  const lineCount = Math.max(14, Math.ceil(contentHeight / LINE_HEIGHT));
  if (gutter.dataset.count === String(lineCount)) return;
  gutter.dataset.count = String(lineCount);
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= lineCount; i++) {
    const line = document.createElement("div");
    line.className = "line-num";
    line.textContent = String(i);
    frag.appendChild(line);
  }
  gutter.innerHTML = "";
  gutter.appendChild(frag);
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");
  if (!sidebar) return;
  sidebar.classList.remove("mobile-open");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");
  if (!sidebar) return;
  const open = sidebar.classList.toggle("mobile-open");
  if (toggle) toggle.setAttribute("aria-expanded", String(open));
}

function renderFile(fileKey) {
  fileKey = validFileKey(fileKey);

  Object.keys(FILE_LANG).forEach((key) => {
    const pane = document.getElementById("pane-" + key);
    if (!pane) return;
    const active = key === fileKey;
    pane.classList.toggle("active", active);
    pane.setAttribute("aria-hidden", active ? "false" : "true");
  });

  document.querySelectorAll(".tree-file").forEach((el) => {
    const active = el.dataset.file === fileKey;
    el.classList.toggle("active", active);
    el.setAttribute("aria-selected", active ? "true" : "false");
  });

  document.querySelectorAll(".tab").forEach((el) => {
    const active = el.dataset.file === fileKey;
    el.classList.toggle("active", active);
    el.setAttribute("aria-selected", active ? "true" : "false");
  });

  const statusLang = document.getElementById("statusLang");
  if (statusLang) statusLang.textContent = FILE_LANG[fileKey];

  const scroller = document.getElementById("editorScroll");
  if (scroller) scroller.scrollTop = 0;

  renderGutter();

  if (window.matchMedia(MOBILE_QUERY).matches) closeSidebar();
}

function goToFile(fileKey) {
  fileKey = validFileKey(fileKey);
  if (currentHashFile() === fileKey) {
    renderFile(fileKey);
  } else {
    location.hash = fileKey;
  }
}

function createDynamicTab(fileKey, label) {
  const tab = document.createElement("div");
  tab.className = "tab tab-dynamic";
  tab.id = "tab-" + fileKey;
  tab.setAttribute("role", "tab");
  tab.setAttribute("tabindex", "0");
  tab.dataset.file = fileKey;
  tab.setAttribute("aria-selected", "false");
  tab.setAttribute("aria-controls", "pane-" + fileKey);

  const labelSpan = document.createElement("span");
  labelSpan.className = "tab-label";
  labelSpan.textContent = label;
  tab.appendChild(labelSpan);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "tab-close";
  closeBtn.setAttribute("aria-label", label + " 탭 닫기");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeDetailTab(fileKey);
  });
  tab.appendChild(closeBtn);

  tab.addEventListener("click", () => goToFile(fileKey));
  tab.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToFile(fileKey);
    }
  });

  return tab;
}

function openProjectDetail(p) {
  const fileKey = p.id;
  if (!document.getElementById("pane-" + fileKey)) {
    const label = PROJECT_DETAIL_TAB_LABELS[fileKey] || (p.title + ".md");
    document.querySelector(".tab-bar").appendChild(createDynamicTab(fileKey, label));

    const pane = document.createElement("section");
    pane.className = "file-pane";
    pane.id = "pane-" + fileKey;
    pane.setAttribute("role", "tabpanel");
    pane.setAttribute("aria-labelledby", "tab-" + fileKey);
    pane.setAttribute("aria-hidden", "true");
    pane.innerHTML = projectDetailHTML(p);
    document.getElementById("editorContent").appendChild(pane);
  }
  FILE_LANG[fileKey] = "Markdown";
  goToFile(fileKey);
}

function closeDetailTab(fileKey) {
  const wasActive = location.hash.slice(1) === fileKey;
  const tab = document.getElementById("tab-" + fileKey);
  const pane = document.getElementById("pane-" + fileKey);
  if (tab) tab.remove();
  if (pane) pane.remove();
  delete FILE_LANG[fileKey];
  if (wasActive) goToFile("projects");
}

function initShell() {
  document.querySelectorAll(".tree-file").forEach((el) => {
    el.addEventListener("click", () => goToFile(el.dataset.file));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToFile(el.dataset.file);
      }
    });
  });

  document.querySelectorAll(".tab").forEach((el) => {
    el.addEventListener("click", () => goToFile(el.dataset.file));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToFile(el.dataset.file);
      }
    });
  });

  const toggle = document.getElementById("sidebarToggle");
  if (toggle) toggle.addEventListener("click", toggleSidebar);

  window.addEventListener("hashchange", () => renderFile(currentHashFile()));

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderGutter, 150);
  });

  renderFile(currentHashFile());
}

initShell();
