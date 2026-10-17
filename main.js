// ---------- Life outside the lab: edit captions / categories here ----------
// [file, category, caption, type]  type "video" files live in assets/video, photos in assets/img + assets/thumb
const LIFE = [
  ["img-20240511-wa0067", "football", "Night training squad"],
  ["football-1", "football", "Team photo under the lights", "video"],
  ["img-20240501-wa0123", "football", "Match-day squad"],
  ["img-20240502-wa0061", "football", "On the ball"],
  ["img-20260719-wa0042", "football", "Barça kit day"],
  ["20240107_203820", "football", "Boots under the floodlights"],
  ["img-20240511-wa0073", "football", "After the game"],
  ["img-20240412-wa0049", "football", "Team pool night"],
  ["20250511_164928", "lego", "Technic Porsche build"],
  ["20251229_173625", "lego", "Formula 1 car"],
  ["20241018_215950", "lego", "Fresh build, library break"],
  ["20260530_221810", "lego", "Lucky cat & bonsai"],
  ["20260222_105840", "hobbies", "Bouldering"],
  ["img_5739", "hobbies", "Surfing"],
  ["img_7083", "hobbies", "Hiking the falls"],
  ["img_7654", "hobbies", "Trail day"],
  ["img-20240908-wa0242", "hobbies", "Countryside drive"],
  ["img-20250307-wa0045", "hobbies", "Pizza night"],
  ["20230703_142113", "travel", "CN Tower, Toronto"],
  ["img-20250308-wa0081", "travel", "New York at night"],
  ["img-20250906-wa0272", "travel", "On the river, Pittsburgh"],
  ["20260606_143803", "travel", "Packed and moving"],
  ["20260309_185939", "friends", "Long table, good company"],
  ["img_20250929_174344_645", "friends", "Pirates game with the crew"],
  ["img-20260103-wa0040", "friends", "Snow day"],
  ["img_4939", "friends", "Group trip"],
  ["me-wa-1", "me", "Fall colours"],
  ["me-wa-2", "me", "Under the flag"],
  ["img-20260315-wa0013", "me", "Night walk"],
  ["pxl_20261003_195538788", "me", "Blue room"],
  ["pxl_20261003_203425467", "me", "Light box"],
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

// ---------- Scroll progress: a flowing EMG stream, red where you've scrolled ----------
(() => {
  const c = document.getElementById("progress");
  const ctx = c.getContext("2d");
  let W, H, dpr, t = 0, p = 0;
  // deterministic noise so the signal looks like real EMG rather than flicker
  const hash = (i) => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
  const envelope = (i) => Math.max(0, Math.sin(i * 0.013)) ** 3 + 0.6 * Math.max(0, Math.sin(i * 0.031 + 2)) ** 4;
  const emg = (i) => (hash(i) * 2 - 1) * (0.08 + envelope(i));

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const progress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    p = max > 0 ? Math.min(1, scrollY / max) : 0;
  };
  // live reading: amplitude follows how much text is on screen right now
  const textEls = [...document.querySelectorAll("h1, h2, h3, p, li, dt, dd, figcaption, .links a, .filters button")]
    .filter((el) => !el.querySelector("p, li, h2, h3"))
    .map((el) => ({ el, n: el.textContent.trim().length }));
  let amp = 0.3, target = 0.3;
  const measure = () => {
    let chars = 0;
    for (const { el, n } of textEls) {
      if (!n) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= innerHeight || !r.height) continue;
      const vis = (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height;
      chars += n * vis;
    }
    // ~1400 characters fills a typical screen with text
    target = Math.min(1, Math.max(0.08, chars / (1400 * (innerWidth * innerHeight) / (1280 * 800))));
  };
  let measureQueued = false;
  const queueMeasure = () => {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(() => { measureQueued = false; measure(); });
  };
  const trace = (from, to, color, width) => {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width;
    const mid = H / 2, gain = H * 0.46 * (0.15 + 0.85 * amp);
    for (let x = Math.floor(from); x <= to; x++) {
      const y = mid - emg(Math.floor(x + t)) * gain;
      x === Math.floor(from) ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const cut = W * p;
    trace(cut, W, "rgba(243,238,234,.2)", 1);
    if (cut > 1) trace(0, cut, "#a8111b", 1.4);
  };

  resize(); progress(); measure(); amp = target;
  addEventListener("resize", () => { resize(); progress(); measure(); draw(); });
  addEventListener("scroll", () => { progress(); queueMeasure(); if (reduceMotion) { amp = target; draw(); } }, { passive: true });
  if (reduceMotion) { draw(); return; }
  setInterval(measure, 1000); // catches reveal animations and lazy images settling
  const loop = () => {
    amp += (target - amp) * 0.06;
    t += 0.8 + amp * 0.8; // busier screens also fire a little faster
    draw(); requestAnimationFrame(loop);
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

// ---------- Life gallery ----------
const grid = document.getElementById("grid");
LIFE.forEach(([file, cat, cap, type]) => {
  const isVid = type === "video";
  const fig = document.createElement("figure");
  fig.className = "tile reveal" + (isVid ? " tile-vid" : "");
  fig.dataset.cat = cat;
  fig.dataset.lb = "";
  fig.dataset.type = isVid ? "video" : "img";
  fig.dataset.full = isVid ? `assets/video/${file}.mp4` : `assets/img/${file}.jpg`;
  fig.dataset.cap = cap;
  fig.tabIndex = 0;
  const thumb = isVid ? `assets/video/${file}.jpg` : `assets/thumb/${file}.jpg`;
  fig.innerHTML = `<img src="${thumb}" alt="${cap}" loading="lazy">${isVid ? '<span class="play-badge" aria-hidden="true">▶</span>' : ""}<figcaption>${cap}</figcaption>`;
  grid.appendChild(fig);

  if (canHover && !reduceMotion) {
    fig.addEventListener("pointermove", (e) => {
      const r = fig.getBoundingClientRect();
      fig.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
      fig.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
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

// ---------- Lightbox: any [data-lb] item opens it; arrows move within its [data-lb-group] ----------
(() => {
  const lb = document.getElementById("lightbox");
  const img = lb.querySelector(".lb-media img");
  const vid = lb.querySelector(".lb-media video");
  const cap = lb.querySelector(".lb-cap");
  let items = [], cur = 0;
  const show = (i) => {
    cur = (i + items.length) % items.length;
    const it = items[cur], isVid = it.dataset.type === "video";
    vid.pause();
    img.hidden = isVid; vid.hidden = !isVid;
    if (isVid) { vid.src = it.dataset.full; vid.play().catch(() => {}); }
    else { vid.removeAttribute("src"); img.src = it.dataset.full; img.alt = it.dataset.cap; }
    cap.textContent = it.dataset.cap;
  };
  const open = (el) => {
    const group = el.closest("[data-lb-group]") || el.parentElement;
    items = [...group.querySelectorAll("[data-lb]")].filter((x) => !x.classList.contains("hide"));
    show(items.indexOf(el));
    lb.showModal();
  };
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-lb]");
    if (el && !lb.contains(el)) open(el);
  });
  document.addEventListener("keydown", (e) => {
    const el = e.target.closest && e.target.closest("[data-lb]");
    if (el && el.tagName !== "BUTTON" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(el); }
  });
  lb.addEventListener("close", () => { vid.pause(); vid.removeAttribute("src"); vid.load(); });
  lb.querySelector(".lb-close").onclick = () => lb.close();
  lb.querySelector(".lb-prev").onclick = () => show(cur - 1);
  lb.querySelector(".lb-next").onclick = () => show(cur + 1);
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    sx = null;
  });
})();

// ---------- Project cards with a video preview play on hover ----------
document.querySelectorAll(".card-media video").forEach((v) => {
  const card = v.closest(".card");
  if (canHover && !reduceMotion) {
    card.addEventListener("pointerenter", () => v.play().catch(() => {}));
    card.addEventListener("pointerleave", () => v.pause());
  }
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

// ---------- Personal bests count up when they scroll into view ----------
(() => {
  const fmt = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target.querySelector(".pb-time"), total = +e.target.dataset.time;
      if (reduceMotion) return;
      const start = performance.now(), dur = 1400;
      const tick = (now) => {
        const k = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(total * eased));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll(".pb[data-time]").forEach((pb) => obs.observe(pb));
})();

// ---------- About: stacked photo deck that deals itself ----------
(() => {
  const deck = document.querySelector(".deck");
  if (!deck) return;
  const cards = [...deck.querySelectorAll(".deck-card")];
  const cap = document.querySelector(".deck-cap");
  const tilt = [-2, 4, -5, 6, -3, 3, -6];
  let order = cards.map((_, i) => i), busy = false;
  const lay = () => {
    order.forEach((ci, pos) => {
      const c = cards[ci];
      c.style.zIndex = cards.length - pos;
      c.style.opacity = pos < 4 ? 1 : 0;
      c.style.transform = `translate(${pos * 8}px, ${pos * -7}px) rotate(${tilt[pos % tilt.length]}deg)`;
    });
    if (cap) cap.textContent = cards[order[0]].dataset.cap;
  };
  const next = () => {
    if (busy) return;
    busy = true;
    const top = cards[order[0]];
    top.style.transform = "translate(-115%, 14px) rotate(-18deg)";
    top.style.opacity = 0;
    setTimeout(() => { order.push(order.shift()); lay(); busy = false; }, 520);
  };
  lay();
  deck.addEventListener("click", (e) => {
    if (e.target.closest(".deck-more") && order[0] === cards.length - 1) return; // let the link work
    e.preventDefault();
    next();
  });
  deck.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (order[0] === cards.length - 1) location.hash = "#life"; else next();
  });
  if (reduceMotion) return;
  let paused = false, visible = false;
  deck.addEventListener("pointerenter", () => { paused = true; });
  deck.addEventListener("pointerleave", () => { paused = false; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(deck);
  setInterval(() => { if (!paused && visible && !document.hidden) next(); }, 3400);
})();

// ---------- Reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
