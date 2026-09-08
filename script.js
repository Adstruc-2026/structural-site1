/* ============================================================
   结构 · 工程师 个人网站  script.js
   内容从 data/*.json 动态加载（单一数据源，便于大规模管理）
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- 字段定义：每个板块可编辑的字段与类型 ---------- */
const FIELDS = {
  codes:   [
    { k: "no",   t: "text", label: "规范编号" },
    { k: "name", t: "text", label: "规范名称" },
    { k: "cat",  t: "select", label: "分类", options: ["concrete","steel","foundation","seismic","load","highrise","reliability"] },
    { k: "sum",  t: "text", label: "简介" },
    { k: "note", t: "text", label: "要点/易错提示" },
  ],
  cases:   [
    { k: "title", t: "text", label: "项目名称" },
    { k: "type",  t: "text", label: "结构形式" },
    { k: "area",  t: "text", label: "规模" },
    { k: "city",  t: "text", label: "地区" },
    { k: "hard",  t: "text", label: "关键难点" },
    { k: "img",   t: "text", label: "缩略图路径(可选)", ph: "如 assets/cases/01.jpg" },
  ],
  gallery: [
    { k: "title", t: "text", label: "作品标题" },
    { k: "sub",   t: "text", label: "副标题" },
    { k: "ico",   t: "select", label: "占位图标", options: ["cube","node","cloud","draw","fusion","param"] },
    { k: "img",   t: "text", label: "图片路径(可选)", ph: "如 assets/gallery/01.jpg" },
  ],
  notes:   [
    { k: "day",  t: "text", label: "日期(日)" },
    { k: "mon",  t: "text", label: "日期(年月)" },
    { k: "title",t: "text", label: "标题" },
    { k: "tags", t: "tags", label: "标签(逗号分隔)" },
    { k: "text", t: "long", label: "正文" },
  ],
  reviews: [
    { k: "name", t: "text", label: "案例名称" },
    { k: "score",t: "text", label: "评分" },
    { k: "meta", t: "text", label: "类型/属性" },
    { k: "pro",  t: "long", label: "可取之处" },
    { k: "con",  t: "long", label: "可优化之处" },
  ],
  qa:      [
    { k: "q",  t: "long", label: "提问" },
    { k: "by", t: "text", label: "提问者" },
    { k: "a",  t: "long", label: "回复" },
  ],
};

/* ---------- 数据缓存 ---------- */
const DATA = { codes: [], cases: [], gallery: [], notes: [], reviews: [], qa: [] };

async function loadJSON(name) {
  try {
    const res = await fetch(`./data/${name}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (e) {
    console.warn(`加载 data/${name}.json 失败：`, e.message);
    return null;
  }
}

/* ---------- 渲染 ---------- */
function thumbSVG(kind) {
  const m = {
    cube:  '<path d="M32 14 L52 24 V44 L32 54 L12 44 V24 Z" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M32 14 V34 L52 24 M32 34 L12 24 M32 34 V54" fill="none" stroke="#fff" stroke-width="2.4"/>',
    node:  '<circle cx="32" cy="32" r="8" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M32 8 V24 M32 40 V56 M8 32 H24 M40 32 H56 M14 14 L24 24 M50 14 L40 24 M14 50 L24 40 M50 50 L40 40" stroke="#fff" stroke-width="2.2"/>',
    cloud: '<path d="M10 40 Q10 26 24 26 Q26 14 40 16 Q54 14 54 30 Q62 30 60 40 Z" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M18 38 H46 M22 32 H44 M26 28 H42" stroke="#fff" stroke-width="1.8" opacity=".7"/>',
    draw:  '<rect x="12" y="14" width="40" height="36" rx="2" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M12 22 H52 M20 14 V50 M12 34 H40 M28 34 V50" stroke="#fff" stroke-width="1.8" opacity=".7"/>',
    fusion:'<path d="M16 48 L32 16 L48 48 Z" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="32" cy="40" r="6" fill="none" stroke="#fff" stroke-width="2.2"/>',
    param: '<path d="M14 50 Q32 10 50 50" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="22" cy="40" r="3" fill="#fff"/><circle cx="32" cy="30" r="3" fill="#fff"/><circle cx="42" cy="40" r="3" fill="#fff"/>',
  };
  return `<svg viewBox="0 0 64 64" class="g-ico">${m[kind] || m.cube}</svg>`;
}

function catLabel(cat) {
  return ({ concrete:"混凝土", steel:"钢结构", foundation:"地基基础", seismic:"抗震",
    load:"荷载", highrise:"高层", reliability:"可靠度" })[cat] || "其他";
}

function renderCodes(list) {
  const grid = $("#codeGrid");
  if (!list || !list.length) { grid.innerHTML = '<p style="color:var(--ink-soft)">暂无规范，去管理台添加吧。</p>'; return; }
  grid.innerHTML = list.map(c => `
    <div class="card code-card" data-cat="${c.cat}">
      <span class="code-no">${esc(c.no)}</span>
      <h4>${esc(c.name)}</h4>
      <span class="tag">${catLabel(c.cat)}</span>
      <p>${esc(c.sum)}</p>
      <div class="note">要点：${esc(c.note)}</div>
      ${c.file ? `<a class="file-link" href="${esc(c.file)}" target="_blank" rel="noopener">📄 查看规范 PDF</a>` : ""}
    </div>`).join("");
}

function renderCases(list) {
  const grid = $("#caseGrid");
  if (!list || !list.length) { grid.innerHTML = '<p style="color:var(--ink-soft)">暂无案例。</p>'; return; }
  grid.innerHTML = list.map(c => {
    const bg = c.img
      ? `background:url('${esc(c.img)}') center/cover no-repeat;`
      : `background:linear-gradient(140deg, ${c.hue?.[0]||'#16568f'}, ${c.hue?.[1]||'#1d6fb8'});`;
    const visual = c.img ? "" : thumbSVG("cube");
    return `<div class="card case-card">
      <div class="case-thumb" style="${bg}">
        <span class="case-tag">${esc(c.type)}</span>${visual}
      </div>
      <div class="case-body">
        <h4>${esc(c.title)}</h4>
        <div class="case-meta"><span>规模 <b>${esc(c.area)}</b></span><span>地区 <b>${esc(c.city)}</b></span></div>
        <p><b style="color:var(--blue-700)">关键难点：</b>${esc(c.hard)}</p>
        ${c.file ? `<a class="case-link" href="${esc(c.file)}" target="_blank" rel="noopener">🔗 打开案例页面</a>` : ""}
      </div>
    </div>`;
  }).join("");
}

function renderGallery(list) {
  const grid = $("#galleryGrid");
  if (!list || !list.length) { grid.innerHTML = '<p style="color:var(--ink-soft)">暂无作品。</p>'; return; }
  grid.innerHTML = list.map(g => {
    const bg = g.img
      ? `background:url('${esc(g.img)}') center/cover no-repeat;`
      : `background:linear-gradient(140deg, ${g.hue?.[0]||'#16568f'}, ${g.hue?.[1]||'#1d6fb8'});`;
    const visual = g.img ? "" : thumbSVG(g.ico || "cube");
    return `<div class="g-item" style="${bg}">
      ${visual}
      <div class="g-label"><b>${esc(g.title)}</b><span>${esc(g.sub)}</span></div>
    </div>`;
  }).join("");
}

function renderNotes(list) {
  const el = $("#noteList");
  if (!list || !list.length) { el.innerHTML = '<p style="color:var(--ink-soft)">暂无笔记。</p>'; return; }
  el.innerHTML = list.map(n => `
    <div class="note-item">
      <div class="note-date"><b>${esc(n.day)}</b><span>${esc(n.mon)}</span></div>
      <div>
        <h4>${esc(n.title)}</h4>
        <div class="tags">${(n.tags||[]).map(t => `<em>${esc(t)}</em>`).join("")}</div>
        <p>${esc(n.text)}</p>
        ${n.images && n.images.length ? `<div class="note-imgs">${n.images.map(i => `<img src="${esc(i)}" alt="" loading="lazy"/>`).join("")}</div>` : ""}
        ${n.videos && n.videos.length ? `<div class="note-vids">${n.videos.map(v => `<video src="${esc(v)}" controls preload="metadata"></video>`).join("")}</div>` : ""}
        <a class="more" href="#" onclick="return false;">阅读全文 →</a>
      </div>
    </div>`).join("");
}

function renderReviews(list) {
  const el = $("#reviewList");
  if (!list || !list.length) { el.innerHTML = '<p style="color:var(--ink-soft)">暂无点评。</p>'; return; }
  el.innerHTML = list.map(r => `
    <div class="review-item">
      <div class="r-head">
        <span class="r-score">${esc(r.score)}</span>
        <h4>${esc(r.name)}</h4>
        <span class="r-meta">${esc(r.meta)}</span>
      </div>
      <p class="r-pro">✓ 可取：${esc(r.pro)}</p>
      <p class="r-con">△ 可优化：${esc(r.con)}</p>
    </div>`).join("");
}

function renderQA(list) {
  const el = $("#qaList");
  if (!list || !list.length) { el.innerHTML = '<p style="color:var(--ink-soft)">暂无留言。</p>'; return; }
  el.innerHTML = list.map(q => `
    <div class="qa-item">
      <div class="qa-q"><span class="q-badge">Q</span><p>${esc(q.q)}</p><span class="q-by">${esc(q.by)}</span></div>
      <div class="qa-a"><span class="a-badge">A</span><p>${esc(q.a)}</p></div>
    </div>`).join("");
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
}

/* ---------- 交互 ---------- */
function initFilters() {
  const search = $("#codeSearch");
  const chips = $$("#codeChips .chip");
  const apply = () => {
    const kw = search.value.trim().toLowerCase();
    const cat = (chips.find(c => c.classList.contains("is-active"))?.dataset.cat) || "all";
    const list = (DATA.codes || []).filter(c => {
      const okCat = cat === "all" || c.cat === cat;
      const okKw = !kw || (c.name + c.no + c.sum + c.note + catLabel(c.cat)).toLowerCase().includes(kw);
      return okCat && okKw;
    });
    renderCodes(list);
  };
  search.addEventListener("input", apply);
  chips.forEach(chip => chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    apply();
  }));
}

function initNav() {
  const nav = $("#primaryNav");
  $("#navToggle").addEventListener("click", e => {
    const open = nav.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });
  $$("#primaryNav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
  const links = $$(".nav-link");
  const map = new Map(links.map(l => [l.getAttribute("href").slice(1), l]));
  const sections = [...map.keys()].map(id => document.getElementById(id)).filter(Boolean);
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.remove("active"));
        map.get(en.target.id)?.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => obs.observe(s));
}

function initToTop() {
  const btn = $("#toTop");
  addEventListener("scroll", () => btn.classList.toggle("show", scrollY > 500), { passive: true });
  btn.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
}

function initForm() {
  const form = $("#msgForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#msgName").value.trim();
    const topic = $("#msgTopic").value.trim();
    const text = $("#msgText").value.trim();
    if (!name || !topic || !text) { alert("请填写称呼、主题和留言内容～"); return; }
    console.log("[留言演示] 新留言：", { name, topic, text, at: new Date().toISOString() });
    $("#formHint").hidden = false;
    form.reset();
  });
}

/* ---------- 启动 ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const names = ["codes", "cases", "gallery", "notes", "reviews", "qa"];
  await Promise.all(names.map(async n => { DATA[n] = await loadJSON(n) || []; }));

  renderCodes(DATA.codes);
  renderCases(DATA.cases);
  renderGallery(DATA.gallery);
  renderNotes(DATA.notes);
  renderReviews(DATA.reviews);
  renderQA(DATA.qa);

  initFilters();
  initNav();
  initToTop();
  initForm();

  $("#year").textContent = new Date().getFullYear();
  $("#statCodes").textContent = DATA.codes.length + (DATA.codes.length ? "+" : "");
  $("#statCases").textContent = DATA.cases.length;
  $("#statNotes").textContent = DATA.notes.length;
});
