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

function render(projects, filter) {
  const grid = document.getElementById("project-grid");
  const list = projects.filter(p => filter === "all" || p.category === filter);

  if (filter === "security") {
    const groups = [
      { key: "project", label: "프로젝트" },
      { key: "ctf", label: "CTF 경험" },
    ];
    grid.innerHTML = groups.map(g => {
      const items = list.filter(p => p.subgroup === g.key);
      if (!items.length) return "";
      return `<div class="subgroup-heading">${g.label}</div>` + items.map(cardHTML).join("");
    }).join("");
  } else {
    grid.innerHTML = list.map(cardHTML).join("");
  }
}

async function init() {
  const projects = await loadProjects();
  render(projects, "all");

  const meta = document.getElementById("projects-meta");
  const today = new Date().toISOString().slice(0, 10);
  meta.textContent = `${projects.length}개 프로젝트 · ${today} 기준`;

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render(projects, btn.dataset.filter);
    });
  });

  document.getElementById("award").addEventListener("click", () => {
    document.getElementById("projects").scrollIntoView({ behavior: "smooth" });
  });
}

init();
