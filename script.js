/* Expanding panels: only one panel is open at a time.
   Click or tap opens a panel. Left/Right arrows, Home and End move between panels. */
(function () {
  'use strict';

  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  if (!panels.length) return;

  var toggles = panels.map(function (panel) { return panel.querySelector('.toggle'); });
  var stacked = window.matchMedia('(max-width: 1099px)');   // accordion layout
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function openPanel(index, moveFocus) {
    panels.forEach(function (panel, i) {
      var isOpen = i === index;
      panel.classList.toggle('is-open', isOpen);
      toggles[i].setAttribute('aria-expanded', String(isOpen));
    });

    if (moveFocus) toggles[index].focus({ preventScroll: true });

    // In the stacked layout, bring the opened band to the top of the screen.
    if (stacked.matches) {
      requestAnimationFrame(function () {
        panels[index].scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }

  toggles.forEach(function (button, i) {
    button.addEventListener('click', function () {
      if (!panels[i].classList.contains('is-open')) openPanel(i, false);
    });

    button.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight') next = Math.min(i + 1, panels.length - 1);
      else if (event.key === 'ArrowLeft') next = Math.max(i - 1, 0);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = panels.length - 1;

      if (next !== null) {
        event.preventDefault();
        if (next !== i) openPanel(next, true);
      }
    });
  });
})();
