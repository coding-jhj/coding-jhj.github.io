async function loadProjects() {
  const res = await fetch("projects.json");
  const projects = await res.json();
  projects.sort((a, b) => (b.pinned_top ? 1 : 0) - (a.pinned_top ? 1 : 0));
  return projects;
}

function cardHTML(p) {
  const pending = p.status !== "ready";
  const thumb = !pending && p.screenshot
    ? `<img src="${p.screenshot}" alt="${p.title} 스크린샷">`
    : "";
  const oneLiner = pending ? "콘텐츠 준비 중입니다." : (p.one_liner || "");
  const roles = pending ? "" : (p.roles || []).join(" · ");
  const award = p.award ? `<p class="award-tag">🏆 ${p.award}</p>` : "";

  const inner = `
    <div class="thumb">${thumb}</div>
    <div class="card-body">
      <h3>${p.title}</h3>
      <p class="one-liner">${oneLiner}</p>
      <p class="roles">${roles}</p>
      ${award}
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
