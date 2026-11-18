/* Gustavo Lucena — Portfolio
   Small, dependency-free enhancements. The site works without JS. */
(() => {
  // Resolve other assets relative to this file, so it works at any page depth
  const SCRIPT_URL = document.currentScript ? document.currentScript.src : location.href;
  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const isWeb = window.matchMedia('(min-width: 1200px)');

  /* ---------- Header state on scroll ---------- */
  const onScroll = () => root.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Fade media in when loaded ---------- */
  document.querySelectorAll('.fade-media').forEach((el) => {
    const done = () => el.classList.add('is-loaded');
    if (el.tagName === 'IMG') {
      if (el.complete && el.naturalWidth) done();
      else el.addEventListener('load', done, { once: true });
      el.addEventListener('error', done, { once: true });
    } else if (el.tagName === 'VIDEO') {
      // poster shows immediately; reveal right away
      done();
    }
  });

  /* ---------- Videos: load + play only while visible ---------- */
  const videos = [...document.querySelectorAll('video[data-autoplay]')];
  if (videos.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target: v, isIntersecting }) => {
          if (isIntersecting) {
            if (reduceMotion) return; // keep poster frame
            const p = v.play();
            if (p && p.catch) p.catch(() => {});
          } else if (!v.paused) {
            v.pause();
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );
    videos.forEach((v) => {
      v.muted = true; // required for autoplay on iOS
      io.observe(v);
    });
  }

  /* ---------- Smooth scroll (Lenis) ----------
     Same library and settings as the Framer "Smooth Scroll" component the
     original site used (intensity 10 → duration 1s, expo-out easing).
     - Content pages: smooth vertical scroll of the window.
     - Home on Web: the card strip scrolls horizontally with the same feel;
       a vertical wheel anywhere on the page moves it sideways.
     Off for prefers-reduced-motion; touch keeps native momentum. */
  const work = document.querySelector('.work');
  const LenisCtor = window.Lenis;
  const smoothOK = typeof LenisCtor === 'function' && !reduceMotion;
  const lenisOptions = {
    duration: 1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    autoRaf: true,
  };
  let pageLenis = null;
  let workLenis = null;

  if (smoothOK) {
    const syncSmooth = () => {
      const wantWork = Boolean(work) && isWeb.matches; // home strip on Web
      if (wantWork && !workLenis) {
        workLenis = new LenisCtor({
          ...lenisOptions,
          wrapper: work,
          content: work,
          eventsTarget: window,
          orientation: 'horizontal',
          gestureOrientation: 'both',
        });
      } else if (!wantWork && workLenis) {
        workLenis.destroy();
        workLenis = null;
      }
      if (!wantWork && !pageLenis) pageLenis = new LenisCtor(lenisOptions);
      else if (wantWork && pageLenis) {
        pageLenis.destroy();
        pageLenis = null;
      }
    };
    syncSmooth();
    isWeb.addEventListener('change', syncSmooth);
  }

  /* ---------- Drag-to-scroll (+ plain wheel → horizontal fallback) ---------- */
  function dragScroll(el, { wheel = false, onDragStart } = {}) {
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let down = false;

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        el.classList.add('is-dragging');
        if (onDragStart) onDragStart();
        el.style.scrollSnapType = 'none';
      }
      if (moved) el.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      el.classList.remove('is-dragging');
      el.style.scrollSnapType = '';
    });
    // Swallow the click that ends a drag so links don't fire
    el.addEventListener(
      'click',
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      },
      true
    );

    if (wheel) {
      let target = el.scrollLeft;
      let raf = 0;
      const step = () => {
        const diff = target - el.scrollLeft;
        if (Math.abs(diff) < 0.5) {
          raf = 0;
          return;
        }
        el.scrollLeft += reduceMotion ? diff : diff * 0.18;
        raf = requestAnimationFrame(step);
      };
      el.addEventListener(
        'wheel',
        (e) => {
          // Only when Lenis isn't driving the strip (e.g. reduced motion)
          if (!isWeb.matches || workLenis) return;
          // Trackpads already scroll horizontally; only remap mostly-vertical wheels
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            target = el.scrollLeft;
            return;
          }
          e.preventDefault();
          const max = el.scrollWidth - el.clientWidth;
          if (!raf) target = el.scrollLeft;
          target = Math.max(0, Math.min(max, target + e.deltaY));
          if (!raf) raf = requestAnimationFrame(step);
        },
        { passive: false }
      );
    }
  }

  if (work)
    dragScroll(work, {
      wheel: true,
      // Cancel any running Lenis animation so it doesn't fight the drag
      onDragStart: () => workLenis && workLenis.scrollTo(work.scrollLeft, { immediate: true, force: true }),
    });
  document.querySelectorAll('[data-drag-scroll]').forEach((el) => dragScroll(el));

  /* ---------- Custom cursor (site-wide, mouse/trackpad only) ----------
     States: default (dot) · link (bigger circle) · arrow (cards).
     Users who prefer reduced motion keep the native cursor. */
  if (finePointer.matches && !reduceMotion) {
    const sprite = new URL('../icons/sprite.svg', SCRIPT_URL).href;
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML =
      '<span class="cursor__dot"></span>' +
      `<svg class="cursor__icon"><use href="${sprite}#arrow-right"></use></svg>`;
    document.body.appendChild(cursor);
    root.classList.add('has-cursor');

    const LINKS = 'a, button, [role="button"], [role="menuitemradio"], label, summary';
    let x = -100;
    let y = -100;
    let cx = x;
    let cy = y;
    let raf = 0;

    const stateFor = (el) => {
      if (!el || !el.closest) return 'default';
      if (el.closest('.card')) return 'arrow';
      if (el.closest(LINKS)) return 'link';
      return 'default';
    };
    const setState = (s) => {
      if (cursor.dataset.state !== s) cursor.dataset.state = s;
    };
    const loop = () => {
      cx += (x - cx) * 0.35;
      cy += (y - cy) * 0.35;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(loop) : 0;
    };

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (!cursor.classList.contains('is-active')) {
        cx = x; // first move: appear in place, no fly-in
        cy = y;
        cursor.classList.add('is-active');
      }
      setState(stateFor(e.target));
      if (!raf) raf = requestAnimationFrame(loop);
    });
    // Content can move under a still pointer (wheel/scroll) — re-check what's below
    const recheck = () => setState(stateFor(document.elementFromPoint(x, y)));
    window.addEventListener('scroll', recheck, { passive: true });
    if (work) work.addEventListener('scroll', recheck, { passive: true });

    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    document.documentElement.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
  }

  /* ---------- Work filter ---------- */
  const filter = document.querySelector('.filter');
  if (filter && work) {
    const button = filter.querySelector('.filter__button');
    const labelEl = filter.querySelector('.filter__current');
    const menu = filter.querySelector('.filter__menu');
    const options = [...menu.querySelectorAll('[role="menuitemradio"]')];
    const cards = [...work.querySelectorAll('.card')];

    const open = (state) => {
      filter.classList.toggle('is-open', state);
      button.setAttribute('aria-expanded', String(state));
      if (state) (options.find((o) => o.getAttribute('aria-checked') === 'true') || options[0]).focus();
    };

    const apply = (value) => {
      options.forEach((o) => o.setAttribute('aria-checked', String(o.dataset.value === value)));
      labelEl.textContent = options.find((o) => o.dataset.value === value).textContent;
      cards.forEach((c) => {
        const cats = (c.dataset.category || '').split(' ');
        c.hidden = value !== 'all' && !cats.includes(value);
      });
      if (workLenis) {
        workLenis.resize(); // strip width changed
        workLenis.scrollTo(0);
      } else {
        work.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      if (pageLenis) pageLenis.resize();
    };

    button.addEventListener('click', () => open(!filter.classList.contains('is-open')));
    options.forEach((o) =>
      o.addEventListener('click', () => {
        apply(o.dataset.value);
        open(false);
        button.focus();
      })
    );
    menu.addEventListener('keydown', (e) => {
      const i = options.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); options[(i + 1) % options.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); options[(i - 1 + options.length) % options.length].focus(); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && filter.classList.contains('is-open')) { open(false); button.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (!filter.contains(e.target)) open(false);
    });
  }
})();
