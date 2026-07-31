(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tickers = new Set();
  let rafId = null;

  function loop() {
    tickers.forEach(fn => fn());
    rafId = tickers.size ? requestAnimationFrame(loop) : null;
  }

  function addTicker(fn) {
    tickers.add(fn);
    if (rafId === null) rafId = requestAnimationFrame(loop);
  }

  function removeTicker(fn) {
    tickers.delete(fn);
  }

  function wrapText(element, type) {
    if (!element || element.classList.contains('wrapped')) return;
    const text = element.textContent;
    if (type === 'char') {
      element.innerHTML = [...text].map((ch, i) => `<span class="text-char" style="--i:${i}">${ch === ' ' ? '\u00A0' : ch}</span>`).join('');
    } else if (type === 'word') {
      element.innerHTML = text.split(/\s+/).map((word, i) => `<span class="text-word"><span class="text-word-inner" style="--i:${i}">${word}</span></span>`).join(' ');
    } else if (type === 'line') {
      element.innerHTML = text.split('\n').map((line, i) => `<span class="text-line" style="--i:${i}">${line}</span>`).join('');
    } else if (type === 'split') {
      const words = text.split(/\s+/);
      const midpoint = Math.ceil(words.length / 2);
      const left = words.slice(0, midpoint).join(' ');
      const right = words.slice(midpoint).join(' ');
      element.innerHTML = `<span class="text-split-left">${left}</span> <span class="text-split-right">${right}</span>`;
    } else if (type === 'wave') {
      const period = 10;
      element.innerHTML = [...text].map((ch, i) => {
        const ripple = (Math.sin((i / period) * Math.PI * 2) + 1) / 2;
        const delayMs = Math.round(i * 14 + ripple * 90);
        return `<span class="text-wave-char" style="--delay:${delayMs}ms">${ch === ' ' ? '\u00A0' : ch}</span>`;
      }).join('');
    } else if (type === 'blur') {
      element.classList.add('text-blur');
    }
    element.classList.add('wrapped');
  }

  function revealText(element, type) {
    if (type === 'blur') {
      element.classList.add('in-view');
      return;
    }
    let selector, maxDelayMs;
    if (type === 'char') {
      selector = '.text-char';
      maxDelayMs = element.querySelectorAll(selector).length * 18;
    } else if (type === 'wave') {
      selector = '.text-wave-char';
      maxDelayMs = 1400;
    } else if (type === 'word') {
      selector = '.text-word-inner';
      maxDelayMs = element.querySelectorAll(selector).length * 36;
    } else if (type === 'line') {
      selector = '.text-line';
      maxDelayMs = element.querySelectorAll(selector).length * 60;
    } else if (type === 'split') {
      const left = element.querySelector('.text-split-left');
      const right = element.querySelector('.text-split-right');
      requestAnimationFrame(() => {
        if (left) left.classList.add('in-view');
        if (right) right.classList.add('in-view');
      });
      const spans = [left, right].filter(Boolean);
      releaseWillChange(spans, 700);
      return;
    } else return;
    const spans = element.querySelectorAll(selector);
    requestAnimationFrame(() => {
      spans.forEach(el => el.classList.add('in-view'));
    });
    releaseWillChange(spans, maxDelayMs + 600);
  }

  function releaseWillChange(elements, delayMs) {
    setTimeout(() => {
      elements.forEach(el => {
        el.style.willChange = 'auto';
      });
    }, delayMs);
  }

  function releaseWillChange(elements, delayMs) {
    setTimeout(() => {
      elements.forEach(el => {
        el.style.willChange = 'auto';
      });
    }, delayMs);
  }

  function revealText(element, type) {
    if (type === 'blur') {
      element.classList.add('in-view');
      return;
    }
    if (type === 'char') {
      const chars = element.querySelectorAll('.text-char');
      chars.forEach((char, idx) => {
        setTimeout(() => char.classList.add('in-view'), idx * 18);
      });
      releaseWillChange(chars, chars.length * 18 + 600);
    } else if (type === 'wave') {
      const chars = element.querySelectorAll('.text-wave-char');
      const period = 10;
      let maxDelay = 0;
      chars.forEach((char, idx) => {
        const ripple = (Math.sin((idx / period) * Math.PI * 2) + 1) / 2;
        const delay = idx * 14 + ripple * 90;
        maxDelay = Math.max(maxDelay, delay);
        setTimeout(() => char.classList.add('in-view'), delay);
      });
      releaseWillChange(chars, maxDelay + 550);
    } else if (type === 'word') {
      const words = element.querySelectorAll('.text-word-inner');
      words.forEach((word, idx) => {
        setTimeout(() => word.classList.add('in-view'), idx * 36);
      });
      releaseWillChange(words, words.length * 36 + 650);
    } else if (type === 'line') {
      const lines = element.querySelectorAll('.text-line');
      lines.forEach((line, idx) => {
        setTimeout(() => line.classList.add('in-view'), idx * 60);
      });
      releaseWillChange(lines, lines.length * 60 + 550);
    } else if (type === 'split') {
      const left = element.querySelector('.text-split-left');
      const right = element.querySelector('.text-split-right');
      if (left) left.classList.add('in-view');
      if (right) setTimeout(() => right.classList.add('in-view'), 90);
      releaseWillChange([left, right].filter(Boolean), 700);
    }
  }
  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const type = entry.target.dataset.type;
        wrapText(entry.target, type);
        revealText(entry.target, type);
        textObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '50px'
  });
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    wrapText(heroTitle, 'word');
    revealText(heroTitle, 'word');
  }
  const heroLead = document.getElementById('heroLead');
  if (heroLead) {
    wrapText(heroLead, 'blur');
    revealText(heroLead, 'blur');
  }
  document.querySelectorAll('.feature-title, .feature-text, .closing-title, .closing-text')
    .forEach(el => textObserver.observe(el));
  const progressEl = document.getElementById('lpProgress');
  let scrollHeightCache = 0;
  let progressRafScheduled = false;

  function recalcScrollHeight() {
    const h = document.documentElement;
    scrollHeightCache = h.scrollHeight - h.clientHeight;
  }
  recalcScrollHeight();
  window.addEventListener('resize', recalcScrollHeight, {
    passive: true
  });
  window.addEventListener('load', recalcScrollHeight);

  function updateProgress() {
    progressRafScheduled = false;
    const scrollTop = document.documentElement.scrollTop;
    const pct = scrollHeightCache > 0 ? (scrollTop / scrollHeightCache) * 100 : 0;
    progressEl.style.width = pct + '%';
  }
  window.addEventListener('scroll', () => {
    if (!progressRafScheduled) {
      progressRafScheduled = true;
      requestAnimationFrame(updateProgress);
    }
  }, {
    passive: true
  });
  updateProgress();
  const heroEl = document.getElementById('lpHero');
  const spotlightEl = document.getElementById('lpSpotlight');
  if (spotlightEl && heroEl && !prefersReduced && window.matchMedia('(hover:hover)').matches) {
    let targetX = 50,
      targetY = 30;
    let currentX = 50,
      currentY = 30;
    let spotlightTicking = false;

    function spotlightTick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      spotlightEl.style.setProperty('--sx', currentX + '%');
      spotlightEl.style.setProperty('--sy', currentY + '%');
      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        removeTicker(spotlightTick);
        spotlightTicking = false;
      }
    }
    heroEl.addEventListener('mousemove', (e) => {
      const rect = heroEl.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!spotlightTicking) {
        spotlightTicking = true;
        addTicker(spotlightTick);
      }
    });
  }
  const features = document.querySelectorAll('.lp-feature');
  const indexLinks = document.querySelectorAll('.lp-index a');
  const featureIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        entry.target.querySelectorAll('.lp-frame').forEach(frame => {
          const handler = (ev) => {
            if (ev.propertyName === 'transform') {
              frame.style.willChange = 'auto';
              frame.removeEventListener('transitionend', handler);
            }
          };
          frame.addEventListener('transitionend', handler);
        });
        const id = entry.target.id;
        if (id) {
          indexLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        }
      }
    });
  }, {
    threshold: 0.35
  });
  features.forEach(f => featureIO.observe(f));
  indexLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });
  const closingEl = document.getElementById('lpClosing');
  if (closingEl) {
    const closingIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, {
      threshold: 0.4
    });
    closingIO.observe(closingEl);
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    if (Number.isNaN(target)) return;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1300;
    const startTime = performance.now();

    function format(v) {
      return prefix + v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
    }
    if (prefersReduced) {
      el.textContent = format(target);
      return;
    }

    function tick() {
      const p = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = format(target);
      }
    }
    requestAnimationFrame(tick);
  }
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countIO.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.6
  });
  document.querySelectorAll('.lp-count').forEach(el => countIO.observe(el));
  const before = "I am writing to you today because I would really like it if you could please help me out with something I've been thinking about for quite a while now...";
  const after = "Role: You are an expert blog post writer. Task: Write a comprehensive, detailed blog post about remote work and productivity.";
  const typedEl = document.getElementById('lpTyped');
  const meterEl = document.getElementById('lpMeter');
  const charsEl = document.getElementById('lpChars');

  function playReadout() {
    typedEl.textContent = before;
    meterEl.style.width = '0%';
    charsEl.textContent = '3,233';
    requestAnimationFrame(() => {
      meterEl.style.width = '100%';
    });
    setTimeout(() => {
      typedEl.style.opacity = 0;
      setTimeout(() => {
        typedEl.textContent = after;
        typedEl.style.opacity = 1;
        charsEl.textContent = '1,670';
      }, 420);
    }, 1500);
  }
  if (typedEl && meterEl && charsEl) {
    if (!prefersReduced) {
      playReadout();
      setInterval(playReadout, 6000);
    } else {
      typedEl.textContent = after;
      charsEl.textContent = '1,670';
      meterEl.style.width = '100%';
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (tickers.size) {
      rafId = requestAnimationFrame(loop);
    }
  });
})();