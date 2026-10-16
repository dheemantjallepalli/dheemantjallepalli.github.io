// ---------- Photos: edit captions / categories here ----------
// categories: research, milestones, people, places, light
const PHOTOS = [
  ["1000012867", "research", "Society for Neuroscience"],
  ["20250813_055415", "research", "EEG Session, IIT Jodhpur"],
  ["20251114_092226", "research", "Poster Session"],
  ["20251206_113449", "research", "American Society of Hematology"],
  ["20251207_150904", "research", "ASH — Main Hall"],
  ["20251207_162116", "research", "Presenting at ASH 2025"],
  ["20251212_231536", "research", "The Desk"],
  ["20230808_190619", "milestones", "University of Manitoba — Mitacs Globalink, 2023"],
  ["20251202_120734", "milestones", "Hamerschlag in the Snow"],
  ["DSC01227", "milestones", "Graduation Day"],
  ["IMG-20260513-WA0212", "milestones", "Scaife Hall of Engineering"],
  ["20260309_185939", "people", "Long Table, Good Company"],
  ["IMG_20250929_174344_645", "people", "Pirates Game with the Crew"],
  ["IMG_4939", "people", "Group Trip"],
  ["20230703_142113", "places", "CN Tower, Toronto"],
  ["20251214_002847", "places", "First Snowman of the Year"],
  ["20251229_163145", "places", "Gold"],
  ["VideoCapture_20240519-091331", "places", "Strike"],
  ["PXL_20261003_195538788", "light", "Blue Room"],
  ["PXL_20261003_200957400.LONG_EXPOSURE-02.ORIGINAL", "light", "Coral"],
  ["PXL_20261003_201116451.LONG_EXPOSURE-01.COVER", "light", "Long Exposure I"],
  ["PXL_20261003_201116451.LONG_EXPOSURE-02.ORIGINAL", "light", "Long Exposure II"],
  ["PXL_20261003_203425467", "light", "Light Box"],
];

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Logo: replay the draw + flash every time you land on the hero ----------
(() => {
  const mark = document.querySelector(".hero-mark");
  if (!mark || reduceMotion) return;
  const play = () => {
    mark.classList.remove("play");
    void mark.getBoundingClientRect(); // restart CSS animations
    mark.classList.add("play");
  };
  new IntersectionObserver(([e]) => { if (e.isIntersecting) play(); }, { threshold: 0.6 }).observe(mark);
  mark.addEventListener("pointerenter", play);
  mark.addEventListener("click", play);
})();

// ---------- Square-wave scroll progress ----------
(() => {
  const track = document.getElementById("progress-track");
  const fill = document.getElementById("progress-fill");
  const periods = 24, w = 1200 / periods;
  let d = "M0 10";
  for (let i = 0; i < periods; i++) {
    const x = i * w;
    d += ` H${x + w * 0.25} V2 H${x + w * 0.75} V10`;
  }
  d += " H1200";
  track.setAttribute("d", d);
  fill.setAttribute("d", d);
  const len = fill.getTotalLength();
  fill.style.strokeDasharray = len;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    fill.style.strokeDashoffset = len * (1 - p);
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
})();

// ---------- Live "neural signal" behind the hero ----------
(() => {
  const canvas = document.getElementById("signal");
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const LINES = 5;
  let W, H, dpr, t = 0;
  const mouse = { x: -9999, y: -9999 };
  const spikes = []; // {x, born}

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener("resize", resize);

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  hero.addEventListener("click", (e) => {
    const r = hero.getBoundingClientRect();
    spikes.push({ x: e.clientX - r.left, born: t });
  });

  // cheap smooth noise
  const noise = (x, s) => Math.sin(x * 0.021 + s) * 0.5 + Math.sin(x * 0.053 + s * 1.7) * 0.3 + Math.sin(x * 0.11 + s * 2.3) * 0.2;

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (let l = 0; l < LINES; l++) {
      const baseY = H * (0.18 + l * 0.16);
      const seed = l * 13.7;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 3) {
        let y = noise(x + t * (40 + l * 8), seed + t * 0.6) * 10;
        // cursor proximity boosts amplitude
        const dx = x - mouse.x, dy = baseY - mouse.y;
        const near = Math.exp(-(dx * dx) / 9000 - (dy * dy) / 6000);
        y += near * Math.sin(x * 0.25 + t * 12) * 34;
        // click spikes travel outward
        for (const s of spikes) {
          const age = t - s.born;
          const front = Math.abs(x - s.x) - age * 520;
          y += Math.exp(-(front * front) / 60) * -70 * Math.exp(-age * 1.4) * (l % 2 ? -1 : 1);
        }
        x === 0 ? ctx.moveTo(x, baseY + y) : ctx.lineTo(x, baseY + y);
      }
      const hot = l === 2;
      ctx.strokeStyle = hot ? "rgba(190,20,30,.7)" : "rgba(168,17,27,.25)";
      ctx.lineWidth = hot ? 1.6 : 1;
      ctx.stroke();
    }
    while (spikes.length && t - spikes[0].born > 3) spikes.shift();
  };

  if (reduceMotion) { draw(); return; }
  let last = performance.now(), visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  const loop = (now) => {
    t += Math.min((now - last) / 1000, 0.05); last = now;
    if (visible) draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

// ---------- Letters stretch toward the cursor (variable font width) ----------
document.querySelectorAll("[data-stretch]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute("aria-label", el.textContent.trim());
  el.innerHTML = words
    .map((w) => `<span class="w" aria-hidden="true">${[...w].map((c) => `<span class="ch">${c}</span>`).join("")}</span>`)
    .join(" ");
  if (!canHover || reduceMotion) return;
  const chars = [...el.querySelectorAll(".ch")];
  el.addEventListener("pointermove", (e) => {
    for (const c of chars) {
      const r = c.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const k = Math.max(0, 1 - d / 200);
      c.style.transform = `translateY(${-k * 0.08}em) scaleY(${1 + k * 0.12})`;
      c.style.color = k > 0.75 ? "var(--red)" : "";
    }
  });
  el.addEventListener("pointerleave", () => chars.forEach((c) => { c.style.transform = ""; c.style.color = ""; }));
});

// ---------- Gallery ----------
const grid = document.getElementById("grid");
PHOTOS.forEach(([file, cat, cap], i) => {
  const fig = document.createElement("figure");
  fig.className = "tile reveal";
  fig.dataset.cat = cat;
  fig.dataset.i = i;
  fig.tabIndex = 0;
  fig.innerHTML = `<img src="assets/thumb/${file}.jpg" alt="${cap}" loading="lazy"><figcaption>${cap}</figcaption>`;
  grid.appendChild(fig);

  if (canHover && !reduceMotion) {
    fig.addEventListener("pointermove", (e) => {
      const r = fig.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      fig.style.setProperty("--ry", `${px * 8}deg`);
      fig.style.setProperty("--rx", `${-py * 8}deg`);
    });
    fig.addEventListener("pointerleave", () => { fig.style.removeProperty("--rx"); fig.style.removeProperty("--ry"); });
  }
});

document.querySelectorAll(".filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".filters .on").classList.remove("on");
    btn.classList.add("on");
    const f = btn.dataset.filter;
    grid.querySelectorAll(".tile").forEach((t) => t.classList.toggle("hide", f !== "all" && t.dataset.cat !== f));
  });
});

// ---------- Lightbox ----------
(() => {
  const lb = document.getElementById("lightbox");
  const img = lb.querySelector("img");
  const cap = lb.querySelector(".lb-cap");
  let cur = 0;
  const visibleIdx = () => [...grid.querySelectorAll(".tile:not(.hide)")].map((t) => +t.dataset.i);
  const show = (i) => {
    cur = i;
    const [file, , c] = PHOTOS[i];
    img.src = `assets/img/${file}.jpg`;
    img.alt = c;
    cap.textContent = c;
  };
  const step = (dir) => {
    const v = visibleIdx();
    show(v[(v.indexOf(cur) + dir + v.length) % v.length]);
  };
  grid.addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (t) { show(+t.dataset.i); lb.showModal(); }
  });
  grid.addEventListener("keydown", (e) => {
    const t = e.target.closest(".tile");
    if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); show(+t.dataset.i); lb.showModal(); }
  });
  lb.querySelector(".lb-close").onclick = () => lb.close();
  lb.querySelector(".lb-prev").onclick = () => step(-1);
  lb.querySelector(".lb-next").onclick = () => step(1);
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  // swipe on phones
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    sx = null;
  });
})();

// ---------- Lab videos: hover (desktop) or tap to play ----------
document.querySelectorAll(".clip").forEach((fig) => {
  const v = fig.querySelector("video");
  const play = () => { v.play().catch(() => {}); fig.classList.add("playing"); };
  const pause = () => { v.pause(); fig.classList.remove("playing"); };
  if (canHover) {
    fig.addEventListener("pointerenter", play);
    fig.addEventListener("pointerleave", pause);
  }
  v.addEventListener("click", () => (v.paused ? play() : pause()));
});

// ---------- Education timeline: line fills as you scroll ----------
(() => {
  const tl = document.querySelector(".timeline");
  const items = [...tl.querySelectorAll(".tl")];
  const update = () => {
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    tl.style.setProperty("--fill", `${p * 100}%`);
    items.forEach((li) => li.classList.toggle("lit", li.getBoundingClientRect().top < innerHeight * 0.6));
  };
  addEventListener("scroll", update, { passive: true });
  update();
})();

// timeline thumbnails open in the lightbox too
document.querySelectorAll(".tl-pics img").forEach((im) => {
  im.addEventListener("click", () => {
    const file = im.src.split("/").pop().replace(".jpg", "");
    const i = PHOTOS.findIndex(([f]) => f === file);
    if (i >= 0) grid.querySelector(`.tile[data-i="${i}"]`).click();
  });
});

// ---------- Reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
