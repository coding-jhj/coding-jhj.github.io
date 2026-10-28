const CATEGORY_LABEL = { security: "SECURITY", ai: "AI SYSTEMS" };

async function loadProjects() {
  const res = await fetch("projects.json");
  const projects = await res.json();
  projects.sort((a, b) => (b.pinned_top ? 1 : 0) - (a.pinned_top ? 1 : 0));
  return projects;
}

function cardHTML(p) {
  const pending = p.status !== "ready";
  const thumbImg = !pending && p.screenshot
    ? `<img src="${p.screenshot}" alt="${p.title} 스크린샷">`
    : "";
  const oneLiner = pending ? "콘텐츠 준비 중입니다." : (p.one_liner || "");
  const roles = pending ? "" : (p.roles || []).join(" · ");
  const award = p.award ? `<p class="award-tag">🏆 ${p.award}</p>` : "";
  const statusLabel = pending ? "콘텐츠 준비 중" : "LIVE";
  const catLabel = CATEGORY_LABEL[p.category] || p.category.toUpperCase();

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
      <div class="card-footer">${pending || !p.github ? "" : "GitHub에서 보기 ↗"}</div>
    </div>`;

  if (pending || !p.github) {
    return `<div class="project-card pending">${inner}</div>`;
  }
  return `<a class="project-card" href="${p.github}" target="_blank" rel="noopener">${inner}</a>`;
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
