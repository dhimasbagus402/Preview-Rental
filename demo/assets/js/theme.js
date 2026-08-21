/* Light/dark toggle.
   The design doc drives both modes off the same token set, so switching is
   just a data-theme flip on <html>. The site defaults to LIGHT; an explicit
   choice is remembered per visitor.

   Each page also carries a tiny inline script in <head> that applies the
   stored value before first paint — without it the page flashes light. */
(function () {
  'use strict';

  var KEY = 'sab-theme';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  /* Bawaan situs adalah TERANG, bukan mengikuti sistem operasi. Kalau ini
     ditebak dari prefers-color-scheme lagi, di komputer bermode gelap klik
     pertama pada tombol justru menyetel "light" dan tombolnya seolah tidak
     berfungsi. */
  function defaultTheme() {
    return 'light';
  }

  /* What the visitor is looking at right now, whether or not they chose it. */
  function current() {
    return document.documentElement.getAttribute('data-theme') || defaultTheme();
  }

  function syncButtons(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      btn.setAttribute('aria-label', theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
    });
  }

  /* Disimpan hanya saat tombolnya benar-benar diklik. */
  function choose(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) { /* private mode — session only */ }
    syncButtons(theme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncButtons(current());

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        choose(current() === 'dark' ? 'light' : 'dark');
      });
    });
  });
})();
