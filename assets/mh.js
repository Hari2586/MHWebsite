/* MoneyHoney · shared interactions (design/mh.js, copied to assets/mh.js; loaded once, with defer).
   Everything here is progressive: without it the page is complete and readable, and nothing is hidden. It never
   changes text except to count a home figure up to the exact string already there, and never restructures the page.
   Rules: Design System/MONEYHONEY-DESIGN-SYSTEM.md, "Motion" and "Header". */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('mh-js');
  var motion = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var io = 'IntersectionObserver' in window;

  /* 1. Reading progress bar (decorative) */
  var bar = document.createElement('div');
  bar.className = 'mh-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function progress() {
    var max = root.scrollHeight - root.clientHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, root.scrollTop / max).toFixed(4) : 0);
  }
  addEventListener('scroll', progress, { passive: true }); addEventListener('resize', progress); progress();

  /* 2. Header: below 600px the Menu button opens the nav bar as a panel; from 1,280px the bar sticks to the top */
  var head = document.querySelector('.mh-header'), menu = head && head.querySelector('.mh-menu-btn');
  if (head && menu) {
    function setOpen(open) { head.classList.toggle('is-open', open); menu.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    menu.addEventListener('click', function () { setOpen(!head.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && head.classList.contains('is-open')) { setOpen(false); menu.focus(); } });
    document.addEventListener('click', function (e) { if (head.classList.contains('is-open') && !head.contains(e.target)) setOpen(false); });
  }
  var hbar = head && head.querySelector('.mh-header__bar');
  if (head && hbar) {
    function stick() { head.style.setProperty('--mh-stick', -hbar.offsetTop + 'px'); head.classList.add('is-sticky'); }
    stick(); addEventListener('resize', stick);
    var cur = hbar.querySelector('[aria-current="page"]'), nav = cur && cur.parentElement;
    if (cur && nav && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - 16);
  }

  /* 3. Scroll reveal: card grids and the solution story's steps only, staggered within each group. Never warnings,
        the demo notice, headings, text, FAQs, tables, fact tiles or ledger tables. Printing shows everything. */
  if (motion && io) {
    root.classList.add('mh-anim');
    ['.linkgrid', 'ul.ledger', '.pcards', '.page-solution .steps', '.close-steps'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (g) {
        Array.prototype.forEach.call(g.children, function (el, i) { el.classList.add('reveal'); el.style.setProperty('--i', Math.min(i, 8)); });
      });
    });
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); seen.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(function (el) { seen.observe(el); });
    requestAnimationFrame(function () {           /* anything already on screen shows at once */
      document.querySelectorAll('.reveal').forEach(function (el) {
        var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    });
    addEventListener('beforeprint', function () { document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); }); });
  }

  /* 4. Range sliders: paint the filled part of the track */
  function paint(sl) {
    var lo = +sl.min || 0, hi = +sl.max || 100, v = +sl.value;
    sl.style.setProperty('--p', (hi > lo ? (v - lo) / (hi - lo) * 100 : 0).toFixed(2) + '%');
  }
  document.querySelectorAll('input[type=range]').forEach(function (sl) {
    paint(sl);
    sl.addEventListener('input', function () { paint(sl); });
    var box = sl.dataset.for && document.getElementById(sl.dataset.for);
    if (box) { box.addEventListener('input', function () { paint(sl); }); box.addEventListener('change', function () { paint(sl); }); }
  });
  document.querySelectorAll('[data-presets] button, [data-picker] button').forEach(function (b) {
    b.addEventListener('click', function () { setTimeout(function () { document.querySelectorAll('input[type=range]').forEach(paint); }, 0); });
  });

  /* 5. A figure that changes gets a brief colour tick */
  if (motion && 'MutationObserver' in window) {
    var tick = new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        var el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
        el = el && el.closest('.stat__value, .m');
        if (!el) return;
        el.classList.remove('is-tick'); void el.offsetWidth; el.classList.add('is-tick');
      });
    });
    document.querySelectorAll('.stat__value, .m').forEach(function (el) { tick.observe(el, { characterData: true, childList: true, subtree: true }); });
  }

  /* 6. The sticky result bar stays out of the way while the calculator itself is on screen */
  var gap = document.querySelector('.gapbar'), rail = document.getElementById('where-you-stand');
  if (gap && rail && io) {
    var watch = new IntersectionObserver(function (es) { gap.classList.toggle('is-hidden', es[0].isIntersecting); }, { threshold: 0.15 });
    watch.observe(rail);
  }

  /* 7. Home page fact tiles count up to the exact figure already printed */
  if (motion && io) {
    document.querySelectorAll('.page-home .facts .stat__value').forEach(function (el) {
      var final = el.textContent, n = final.replace(/,/g, '');
      if (!/^\d+$/.test(n)) return;
      var end = +n, obs = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        obs.disconnect();
        var t0 = performance.now();
        (function step(t) {
          var k = Math.min(1, (t - t0) / 900), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
          el.textContent = k < 1 ? v.toLocaleString('en-IN') : final;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
      obs.observe(el);
    });
  }

  /* 8. Interactive charts: hover, tap or focus a bar to read its value; click a legend item to hide a series.
        Values come from the page's own calculator (window.mhCalc) and from each chart's aria-label. */
  var tip = document.createElement('div');
  tip.className = 'mh-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  function tipShow(title, rows, x, y) {
    tip.textContent = '';
    if (title) { var b = document.createElement('b'); b.textContent = title; tip.appendChild(b); }
    rows.forEach(function (r) {
      var line = document.createElement('span');
      if (r[2]) { var sw = document.createElement('i'); sw.style.background = r[2]; line.appendChild(sw); }
      var l = document.createElement('em'); l.textContent = r[0]; line.appendChild(l);
      var v = document.createElement('strong'); v.textContent = r[1]; line.appendChild(v);
      tip.appendChild(line);
    });
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight, pad = 8;
    var left = Math.min(Math.max(x, w / 2 + pad), innerWidth - w / 2 - pad);
    var top = y - h - 12; if (top < pad) top = y + 18;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
    requestAnimationFrame(function () { tip.classList.add('is-show'); });
  }
  function tipHide() { tip.classList.remove('is-show'); tip.hidden = true; }
  addEventListener('scroll', tipHide, { passive: true }); addEventListener('resize', tipHide);
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest('svg')) tipHide(); });
  function inr(v) { var n = Math.floor(Math.abs(v) + 0.5); return (v < 0 && n ? '-' : '') + '₹' + n.toLocaleString('en-IN'); }
  function centerTop(el) { var b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top]; }

  /* 8a. Story charts */
  document.querySelectorAll('svg.schart').forEach(function (svg) {
    var items = (svg.getAttribute('aria-label') || '').split('; ').map(function (p) {
      var parts = p.split(': '); var v = parts.pop(); return [parts.pop() || '', v];
    });
    var bars = svg.querySelectorAll('rect.chbar, rect.cbar');
    if (bars.length !== items.length) return;
    bars.forEach(function (r, i) {
      r.setAttribute('tabindex', '0'); r.setAttribute('role', 'img'); r.setAttribute('aria-label', items[i][0] + ': ' + items[i][1]);
      function on() { svg.classList.add('is-hover'); r.classList.add('is-on'); var c = centerTop(r); tipShow(items[i][0], [['', items[i][1]]], c[0], c[1] - (r.classList.contains('cbar') ? 26 : 0)); }
      function off() { svg.classList.remove('is-hover'); r.classList.remove('is-on'); tipHide(); }
      r.addEventListener('pointerenter', on); r.addEventListener('pointerleave', off);
      r.addEventListener('focus', on); r.addEventListener('blur', off);
      r.addEventListener('click', function (e) { e.stopPropagation(); if (tip.hidden) on(); else off(); });
    });
  });

  /* 8b. The calculator's chart: one hit zone per year, rebuilt after every recalculation */
  var chart = document.getElementById('chart');
  if (chart && window.mhCalc) {
    var legend = Array.prototype.map.call(chart.parentNode.querySelectorAll('.legend > span'), function (s) { return s.textContent.trim(); });
    var colors = ['var(--chart-3)', 'var(--chart-1)'];
    var yearHead = (function () { var th = document.querySelector('#ytab thead th'); return th ? th.textContent.trim() : 'Year'; })();
    function wire(r) {
      var old = chart.querySelector('.mh-hits'); if (old) old.remove();
      var bars = r.bars || []; if (!bars.length) return;
      var vb = chart.viewBox.baseVal, x0 = 8, slot = (vb.width - 8 - x0) / bars.length;
      var rects = chart.querySelectorAll(':scope > rect');
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'mh-hits');
      bars.forEach(function (b, k) {
        var h = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        h.setAttribute('x', (x0 + k * slot).toFixed(1)); h.setAttribute('y', 0); h.setAttribute('width', slot.toFixed(1)); h.setAttribute('height', vb.height);
        h.setAttribute('tabindex', '0'); h.setAttribute('role', 'img');
        h.setAttribute('aria-label', yearHead + ' ' + b[0] + ': ' + legend[0] + ' ' + inr(b[1]) + ', ' + legend[1] + ' ' + inr(b[2]));
        function on() {
          chart.classList.add('is-hover');
          [rects[2 * k], rects[2 * k + 1]].forEach(function (x) { if (x) x.classList.add('is-on'); });
          var tall = rects[2 * k + 1] || rects[2 * k] || h, c = centerTop(tall);
          tipShow(yearHead + ' ' + b[0], [[legend[0], inr(b[1]), colors[0]], [legend[1], inr(b[2]), colors[1]]], c[0], c[1]);
        }
        function off() { chart.classList.remove('is-hover'); chart.querySelectorAll('.is-on').forEach(function (x) { x.classList.remove('is-on'); }); tipHide(); }
        h.addEventListener('pointerenter', on); h.addEventListener('pointerleave', off);
        h.addEventListener('focus', on); h.addEventListener('blur', off);
        h.addEventListener('click', function (e) { e.stopPropagation(); if (tip.hidden) on(); else off(); });
        g.appendChild(h);
      });
      chart.appendChild(g);
    }
    try { wire(window.mhCalc({})); } catch (e) {}
    document.addEventListener('mh-calc', function (e) { wire(e.detail); });
    document.addEventListener('mh-chart', function (e) { wire(e.detail); });   // redrawn at a new width
    chart.parentNode.querySelectorAll('.legend > span').forEach(function (sp, i) {
      sp.setAttribute('role', 'button'); sp.setAttribute('tabindex', '0'); sp.setAttribute('aria-pressed', 'true');
      function toggle() {
        var hidden = chart.classList.toggle(i ? 'hide-b' : 'hide-a');
        sp.setAttribute('aria-pressed', hidden ? 'false' : 'true');
      }
      sp.addEventListener('click', toggle);
      sp.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  /* 9. Names and keyboard reach for the explorer and scheme tools. Landmarks belong in the markup; this only adds
        ARIA names taken from text already on the page, and makes scrolling panels focusable. Nothing moves. */
  (function () {
    var h1 = document.querySelector('h1'), n = 0;
    function idOf(el) { if (!el.id) el.id = 'mh-lm-' + (++n); return el.id; }
    Array.prototype.slice.call(document.body.children).forEach(function (el) {
      if (el.matches('header, nav, main, aside, footer, script, style, [role], [hidden], [aria-hidden="true"], .mh-progress, .mh-tip') || !el.textContent.trim()) return;
      if (el.querySelector('main, aside, [role="main"]')) return;
      if (getComputedStyle(el).display === 'none') return;
      if (el.matches('.secnav')) { el.setAttribute('role', 'navigation'); if (h1) el.setAttribute('aria-labelledby', idOf(h1)); return; }
      var label = el.querySelector('h1, h2, h3, h4, b, .t'); if (!label) return;
      el.setAttribute('role', 'region'); el.setAttribute('aria-labelledby', idOf(label));
    });
    function enhance(scope) {
      scope.querySelectorAll('input[type=checkbox]:not([aria-label]):not([id])').forEach(function (box) {
        if (box.closest('label')) return;
        var row = box.closest('tr, .card, .nfo-card'), nm = row && row.querySelector('.nm, a, td'), cmp = document.querySelector('.cmpbar b');
        if (nm) box.setAttribute('aria-label', (cmp ? cmp.textContent.trim() + ' ' : '') + nm.textContent.trim());
      });
      scope.querySelectorAll('.scrollx, .table-wrap, .ledger-scroll, .gw, .sx, .vlist, .variant-paths .steps').forEach(function (el) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      });
    }
    enhance(document);
    var app = document.getElementById('app') || document.getElementById('list');
    if (app && 'MutationObserver' in window) new MutationObserver(function () { enhance(app); }).observe(app, { childList: true, subtree: true });
  })();
})();
