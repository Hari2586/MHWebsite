/* MoneyHoney Sunrise: header behaviour. Without this file the menus open on hover and on focus (CSS).
   With it the nav follows the disclosure pattern: Enter, Space or a click opens a menu (aria-expanded),
   Esc, a click outside or leaving the nav closes it, and hover opens it with a short intent delay, so a
   pointer that crosses the other buttons on its way into a menu doesn't swap it. All menus open in one place. */
(function () {
  var nav = document.querySelector('.sr-nav');
  if (!nav) return;
  nav.classList.add('sr-nav--js');
  var items = Array.prototype.slice.call(nav.querySelectorAll('.sr-nav__item'));
  var timer = null;
  function later(fn, ms) { clearTimeout(timer); timer = null; if (ms) timer = setTimeout(fn, ms); else fn(); }
  function button(it) { return it.querySelector('button.sr-nav__top'); }
  function current() { return nav.querySelector('.sr-nav__item.is-open'); }
  function close(except) {
    items.forEach(function (it) {
      if (it === except) return;
      it.classList.remove('is-open');
      delete it.dataset.by;
      var b = button(it);
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function open(it, by) {
    close(it);
    it.classList.add('is-open');
    it.dataset.by = by;
    button(it).setAttribute('aria-expanded', 'true');
  }
  items.forEach(function (it) {
    var b = button(it);
    it.addEventListener('mouseenter', function () {
      var cur = current();
      if (cur === it) { clearTimeout(timer); return; }
      if (!b) { later(function () { close(null); }, 150); return; }  // Talk to Us has no menu
      later(function () { open(it, 'hover'); }, cur ? 150 : 0);
    });
    it.addEventListener('focusin', function () { var cur = current(); if (cur && cur !== it) close(null); });
    if (!b) return;
    b.addEventListener('click', function () {
      clearTimeout(timer);
      if (it.classList.contains('is-open') && it.dataset.by === 'click') close(null);
      else open(it, 'click');
    });
  });
  nav.addEventListener('mouseleave', function () {
    var cur = current();
    if (cur && cur.dataset.by === 'hover') later(function () { close(null); }, 250);
  });
  nav.addEventListener('focusout', function (e) {
    if (!nav.contains(e.relatedTarget) && !nav.matches(':hover')) close(null);
  });
  document.addEventListener('keydown', function (e) {
    var cur = current();
    if (e.key !== 'Escape' || !cur) return;
    close(null);
    button(cur).focus();
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.sr-nav__item')) close(null);
  });
})();
