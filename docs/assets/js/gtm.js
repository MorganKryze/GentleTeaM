// Fixes docmd's markup for keyboard and screen-reader users, now and after each SPA navigation:
// one h1 per page (the site name in the sidebar becomes a paragraph with the same look), a named
// menu control that Enter and Space open, and scrolling tables reachable with Tab.
(function () {
  function demote() {
    document.querySelectorAll('.sidebar-header h1').forEach(function (h) {
      var p = document.createElement('p');
      p.className = (h.className + ' sidebar-title').trim();
      while (h.firstChild) p.appendChild(h.firstChild);
      h.replaceWith(p);
    });
  }
  function set(el, name, value) {
    if (value === null) { if (el.hasAttribute(name)) el.removeAttribute(name); }
    else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  }
  function menu() {
    var sidebar = document.querySelector('.sidebar');
    var open = String(!!sidebar && sidebar.classList.contains('mobile-expanded'));
    document.querySelectorAll('.sidebar-menu-button').forEach(function (b) {
      set(b, 'role', 'button');
      set(b, 'tabindex', '0');
      set(b, 'aria-label', 'Menu');
      set(b, 'aria-expanded', open);
    });
  }
  function tables() {
    document.querySelectorAll('.table-wrapper').forEach(function (t) {
      var scrolls = t.scrollWidth > t.clientWidth + 1;
      var heads = [].map.call(t.querySelectorAll('th'), function (th) { return th.textContent.trim(); });
      set(t, 'tabindex', scrolls ? '0' : null);
      set(t, 'role', scrolls ? 'region' : null);
      set(t, 'aria-label', scrolls ? 'Table: ' + heads.join(', ') : null);
    });
  }
  function apply() { demote(); menu(); tables(); }
  apply();
  new MutationObserver(apply).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['class']
  });
  window.addEventListener('resize', tables);
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('.sidebar-menu-button');
    if (!b || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    b.click();
  });
})();
