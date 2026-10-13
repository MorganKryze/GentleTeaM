// One h1 per page: docmd renders the site name in the sidebar as an h1, next to the page title.
// Swap it for a paragraph with the same look, now and after each SPA navigation.
(function () {
  function demote() {
    document.querySelectorAll('.sidebar-header h1').forEach(function (h) {
      var p = document.createElement('p');
      p.className = (h.className + ' sidebar-title').trim();
      while (h.firstChild) p.appendChild(h.firstChild);
      h.replaceWith(p);
    });
  }
  demote();
  new MutationObserver(demote).observe(document.documentElement, { childList: true, subtree: true });
})();
