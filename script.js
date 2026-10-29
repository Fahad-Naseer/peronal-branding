/* 1. Expanding panels: one open at a time.
      Click, tap, Previous/Next buttons, or Left/Right/Home/End keys. */
(function () {
  'use strict';

  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var stacked = window.matchMedia('(max-width: 1099px)');   // accordion layout
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  if (panels.length) {
    var toggles = panels.map(function (panel) { return panel.querySelector('.toggle'); });

    function scrollToPanel(index) {
      panels[index].scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }

    function openPanel(index, moveFocus) {
      var animate = stacked.matches && !reduceMotion.matches && !!panels[0].animate;
      var before = animate ? panels.map(function (p) { return p.getBoundingClientRect().height; }) : null;

      panels.forEach(function (panel, i) {
        var isOpen = i === index;
        panel.classList.toggle('is-open', isOpen);
        toggles[i].setAttribute('aria-expanded', String(isOpen));
      });
      if (moveFocus) toggles[index].focus({ preventScroll: true });
      if (!stacked.matches) return;

      if (!animate) { requestAnimationFrame(function () { scrollToPanel(index); }); return; }

      // Mobile accordion: animate each band from its old height to its new one
      var runs = [];
      panels.forEach(function (panel, i) {
        var after = panel.getBoundingClientRect().height;
        if (Math.abs(after - before[i]) < 2) return;
        panel.style.overflow = 'hidden';
        var run = panel.animate([{ height: before[i] + 'px' }, { height: after + 'px' }], { duration: 500, easing: 'cubic-bezier(0.22, 0.7, 0.2, 1)' });
        var clear = function () { panel.style.overflow = ''; };
        run.onfinish = clear; run.oncancel = clear;
        runs.push(run.finished.catch(function () {}));
      });
      Promise.all(runs).then(function () { scrollToPanel(index); });
    }

    // Previous / Next buttons with a counter, added to every caption
    panels.forEach(function (panel, i) {
      var bar = document.createElement('div');
      bar.className = 'panel-nav';
      var count = document.createElement('span');
      count.className = 'count';
      count.textContent = pad(i + 1) + ' / ' + pad(panels.length);
      bar.appendChild(count);

      [['Previous', -1], ['Next', 1]].forEach(function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn step';
        btn.textContent = item[0];
        btn.dataset.step = item[1];
        btn.disabled = i + item[1] < 0 || i + item[1] >= panels.length;
        btn.addEventListener('click', function () {
          var target = i + item[1];
          openPanel(target, false);
          // Keep keyboard focus in the newly opened panel
          var same = panels[target].querySelector('.step[data-step="' + item[1] + '"]');
          var other = panels[target].querySelector('.step:not(:disabled)');
          (same && !same.disabled ? same : other).focus({ preventScroll: true });
        });
        bar.appendChild(btn);
      });
      panel.querySelector('.caption').appendChild(bar);
    });

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
  }

  /* 2. Highlight the nav link of the section on screen */
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a'));
  var sections = ['portfolio', 'contact'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var navTicking = false;

  function updateNav() {
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    var current = null;
    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.4 && rect.bottom > 0) current = section.id;
    });
    if (atBottom && sections.length) current = sections[sections.length - 1].id;
    links.forEach(function (link) {
      if (current && link.getAttribute('href') === '#' + current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    navTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!navTicking) { navTicking = true; requestAnimationFrame(updateNav); }
  }, { passive: true });
  updateNav();

  /* 3. Back to top button appears after scrolling */
  var toTop = document.getElementById('to-top');
  if (toTop) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        toTop.hidden = window.scrollY < 600;
        ticking = false;
      });
    }, { passive: true });
  }

  /* 4. Copy email button */
  var copyBtn = document.querySelector('[data-copy]');
  var status = document.querySelector('.copy-status');
  if (copyBtn && status) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy');
      function done(ok) {
        status.textContent = ok ? 'Copied' : 'Copy failed. Select the email above instead.';
        setTimeout(function () { status.textContent = ''; }, 2500);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var box = document.createElement('textarea');
        box.value = text;
        box.setAttribute('readonly', '');
        box.style.position = 'fixed';
        box.style.opacity = '0';
        document.body.appendChild(box);
        box.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(box);
        done(ok);
      }
    });
  }
})();
