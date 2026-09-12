/**
 * Vanilla SplitText-style hero/headline animation for OMINO landing.
 * Mirrors SplitText + GSAP timing (chars/words/lines, stagger, ScrollTrigger).
 * No React or GSAP Club SplitText plugin required.
 */
(function (global) {
  const registry = new WeakMap();

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function stripTags(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || '';
  }

  function revert(el) {
    const record = registry.get(el);
    if (!record) return;
    record.tween?.kill();
    record.scrollTrigger?.kill();
    if (record.originalHTML != null) el.innerHTML = record.originalHTML;
    el.classList.remove('split-parent', 'split-ready');
    el.removeAttribute('aria-label');
    registry.delete(el);
  }

  function revertAll(root) {
    (root || document).querySelectorAll('[data-split-text]').forEach(revert);
  }

  function wrapUnits(text, unitClass) {
    if (!text) return '';
    const chars = [...text];
    return chars
      .map((ch) => {
        if (ch === ' ') {
          return `<span class="${unitClass} ${unitClass}-space" aria-hidden="true">&nbsp;</span>`;
        }
        return `<span class="${unitClass}" aria-hidden="true">${escapeHtml(ch)}</span>`;
      })
      .join('');
  }

  function wrapWords(text) {
    const parts = text.split(/(\s+)/);
    return parts
      .map((part) => {
        if (!part) return '';
        if (/^\s+$/.test(part)) {
          return `<span class="split-word split-word-space" aria-hidden="true">${part.replace(/ /g, '&nbsp;')}</span>`;
        }
        return `<span class="split-word" aria-hidden="true">${escapeHtml(part)}</span>`;
      })
      .join('');
  }

  function buildSplitHTML(html, splitType) {
    const types = splitType.split(',').map((s) => s.trim());
    const useLines = types.includes('lines') || html.includes('<br');
    const useChars = types.includes('chars');
    const useWords = types.includes('words') || (!useChars && !useLines);

    if (useLines) {
      const lines = html.split(/<br\s*\/?>/i);
      return lines
        .map((line) => {
          const plain = stripTags(line);
          const inner = useChars ? wrapUnits(plain, 'split-char') : wrapWords(plain);
          return `<span class="split-line">${inner}</span>`;
        })
        .join('');
    }

    const plain = stripTags(html);
    if (useChars) return wrapUnits(plain, 'split-char');
    return wrapWords(plain);
  }

  function collectTargets(el, splitType) {
    const types = splitType.split(',').map((s) => s.trim());
    if (types.includes('chars')) {
      const chars = el.querySelectorAll('.split-char');
      if (chars.length) return chars;
    }
    if (types.includes('words')) {
      const words = el.querySelectorAll('.split-word');
      if (words.length) return words;
    }
    const lines = el.querySelectorAll('.split-line');
    if (lines.length) return lines;
    return el.querySelectorAll('.split-char, .split-word, .split-line');
  }

  function scrollStart(threshold, rootMargin) {
    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || '0px');
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
    const sign =
      marginValue === 0
        ? ''
        : marginValue < 0
          ? `-=${Math.abs(marginValue)}${marginUnit}`
          : `+=${marginValue}${marginUnit}`;
    return `top ${startPct}%${sign}`;
  }

  function animate(el, options) {
    if (!el || !global.gsap) return null;

    const {
      splitType = 'chars',
      delay = 50,
      duration = 1.25,
      ease = 'power3.out',
      from = { opacity: 0, y: 40 },
      to = { opacity: 1, y: 0 },
      threshold = 0.1,
      rootMargin = '-100px',
      trigger = 'scroll',
      playDelay = 0,
      onComplete,
    } = options || {};

    revert(el);

    const originalHTML = el.innerHTML;
    const accessibleText = stripTags(originalHTML);
    el.setAttribute('aria-label', accessibleText);
    el.classList.add('split-parent');
    el.innerHTML = buildSplitHTML(originalHTML, splitType);

    const targets = collectTargets(el, splitType);
    if (!targets.length) {
      el.innerHTML = originalHTML;
      return null;
    }

    global.gsap.set(targets, { ...from, force3D: true });

    const tweenConfig = {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      force3D: true,
      onComplete: () => {
        el.classList.add('split-ready');
        onComplete?.();
      },
    };

    let tween;
    let st;

    if (trigger === 'load') {
      tween = global.gsap.to(targets, {
        ...tweenConfig,
        delay: playDelay,
      });
    } else {
      tween = global.gsap.to(targets, {
        ...tweenConfig,
        scrollTrigger: {
          trigger: el,
          start: scrollStart(threshold, rootMargin),
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
      });
      st = tween.scrollTrigger;
    }

    registry.set(el, { originalHTML, tween, scrollTrigger: st });
    return tween;
  }

  function animateAll(selector, options, root) {
    const nodes = (root || document).querySelectorAll(selector);
    return Array.from(nodes).map((el) => animate(el, options));
  }

  function whenFontsReady() {
    if (document.fonts && document.fonts.status === 'loaded') {
      return Promise.resolve();
    }
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready;
    }
    return new Promise((resolve) => global.requestAnimationFrame(resolve));
  }

  function isInView(el, threshold) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top <= vh * (1 - (threshold ?? 0.1)) && rect.bottom >= 0;
  }

  global.OminoSplitText = {
    animate,
    animateAll,
    revert,
    revertAll,
    whenFontsReady,
    isInView,
  };
})(window);
