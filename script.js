// Theme toggle (dark default, remembered) + keyboard shortcuts + footer year.
(function () {
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function applyTheme(theme) {
    // Freeze element transitions so nothing keeps fading after the page swap.
    root.classList.add("theming");
    root.setAttribute("data-theme", theme);
    if (meta) meta.setAttribute("content", theme === "light" ? "#ffffff" : "#0b0b0c");
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove("theming"); }); });
  }

  function setTheme(theme) {
    try { localStorage.setItem("theme", theme); } catch { /* storage blocked: theme still applies for this visit */ }
    // One GPU cross-fade of the whole page, so every color changes at the same moment.
    // Per-element color transitions finished at different times on slower phones.
    if (document.startViewTransition && !reduceMotion.matches) {
      document.startViewTransition(function () { applyTheme(theme); });
    } else {
      applyTheme(theme);
    }
  }

  function flip() {
    setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light");
  }

  if (toggle) toggle.addEventListener("click", flip);
  if (meta) meta.setAttribute("content", root.getAttribute("data-theme") === "light" ? "#ffffff" : "#0b0b0c");

  // B = book a call, E = email, T = theme (ignored while typing or with modifiers)
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    var key = e.key.toLowerCase();
    if (key === "t") return flip();
    var link = document.querySelector('[data-key="' + key + '"]');
    if (link) link.click();
  });

  // ---------- Smooth scrolling (Lenis, if it loaded and motion is allowed) ----------
  var lenis = null;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.95 });
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // ---------- Overlay scrollbar: visible only while scrolling ----------
  var bar = document.querySelector(".sbar");
  var thumb = document.querySelector(".sbar__thumb");
  if (bar && thumb) {
    var hideTimer = 0, dragging = false, grab = 0;
    var metrics = function () {
      var vh = window.innerHeight, doc = document.documentElement.scrollHeight;
      var h = Math.max(40, (vh / doc) * vh);
      return { vh: vh, h: h, max: doc - vh };
    };
    var paint = function () {
      var m = metrics();
      bar.style.display = m.max > 0 ? "" : "none";
      thumb.style.height = m.h + "px";
      thumb.style.transform = "translateY(" + (m.max > 0 ? (window.scrollY / m.max) * (m.vh - m.h) : 0) + "px)";
    };
    var show = function () {
      bar.classList.add("is-visible");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { if (!dragging) bar.classList.remove("is-visible"); }, 800);
    };
    var jump = function (y) { if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); };

    window.addEventListener("scroll", function () { paint(); show(); }, { passive: true });
    window.addEventListener("resize", paint);
    if (window.ResizeObserver) new ResizeObserver(paint).observe(document.body);
    thumb.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      dragging = true; grab = e.clientY - thumb.getBoundingClientRect().top;
      bar.classList.add("is-visible", "is-dragging");
      thumb.setPointerCapture(e.pointerId);
    });
    thumb.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var m = metrics();
      var p = Math.min(1, Math.max(0, (e.clientY - grab) / (m.vh - m.h)));
      jump(p * m.max);
    });
    thumb.addEventListener("pointerup", function () { dragging = false; bar.classList.remove("is-dragging"); show(); });
    paint();
  }

  // ---------- Background dots: faint grid that floats and reacts to the pointer ----------
  var canvas = document.querySelector(".bg__dots");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var GAP = 22, RADIUS = 150, PUSH = 7;
    var dots = [], w = 0, h = 0, dpr = 1;
    var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    var col = { base: "255,255,255", a: 0.05, hot: "245,165,36" };

    var readColors = function () {
      var cs = getComputedStyle(root);
      col.base = cs.getPropertyValue("--dot").trim() || col.base;
      col.a = parseFloat(cs.getPropertyValue("--dot-a")) || col.a;
      col.hot = cs.getPropertyValue("--dot-hot").trim() || col.hot;
    };

    var build = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (var y = GAP / 2; y < h + GAP; y += GAP) {
        for (var x = GAP / 2; x < w + GAP; x += GAP) {
          dots.push({ x: x, y: y, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 0.6 });
        }
      }
    };

    var draw = function (t) {
      // Ease the pointer so the halo trails smoothly.
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      ctx.clearRect(0, 0, w, h);
      var time = (t || 0) / 1000;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        // Gentle floating
        var fx = Math.sin(time * 0.6 * d.s + d.p) * 1.4;
        var fy = Math.cos(time * 0.5 * d.s + d.p) * 1.4;
        var x = d.x + fx, y = d.y + fy;
        // Pointer influence
        var dx = x - mouse.x, dy = y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var k = dist < RADIUS ? 1 - dist / RADIUS : 0;
        k = k * k;
        if (k > 0 && dist > 0.01) { x += (dx / dist) * PUSH * k; y += (dy / dist) * PUSH * k; }
        ctx.beginPath();
        ctx.arc(x, y, 1 + k * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = k > 0.02
          ? "rgba(" + col.hot + "," + (col.a + k * 0.55).toFixed(3) + ")"
          : "rgba(" + col.base + "," + col.a + ")";
        ctx.fill();
      }
    };

    var still = reduced;
    var loop = function (t) { draw(t); if (!still) requestAnimationFrame(loop); };

    readColors(); build();
    if (still) draw(0); else requestAnimationFrame(loop);

    window.addEventListener("resize", function () { build(); if (still) draw(0); });
    window.addEventListener("pointermove", function (e) { mouse.tx = e.clientX; mouse.ty = e.clientY; if (mouse.x < -9000) { mouse.x = e.clientX; mouse.y = e.clientY; } }, { passive: true });
    document.addEventListener("pointerleave", function () { mouse.tx = -9999; mouse.ty = -9999; });
    // Re-read colors when the theme flips.
    new MutationObserver(function () { readColors(); if (still) draw(0); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
