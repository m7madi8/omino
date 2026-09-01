(function (global) {
  const KEY = 'omino.booted';
  const INK = '#0A0A0A';
  const PAPER = '#F2F3F5';
  const reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skipPage = /(?:^|\/)app\.html$/i.test(location.pathname);
  let already = false;
  try { already = sessionStorage.getItem(KEY) === '1'; } catch (e) { already = false; }
  const shouldBoot = !skipPage && !already;
  let ready = false;
  const waiters = [];
  const cinematic = shouldBoot && !reduce;
  let master = null;
  let finished = false;

  function done() {
    if (ready) return;
    ready = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    document.documentElement.classList.remove('is-booting');
    document.documentElement.removeAttribute('aria-busy');
    waiters.splice(0).forEach((fn) => fn(cinematic));
    document.dispatchEvent(new CustomEvent('omino-ready', { detail: { cinematic } }));
  }

  function onReady(fn) {
    if (ready) fn(cinematic);
    else waiters.push(fn);
  }

  const css = [
    'html.is-booting{background:' + INK + ';overflow:hidden}',
    'html.is-booting body{background:' + INK + '}',
    '#ominoIntro{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;background:' + INK + ';color:' + PAPER + ';pointer-events:auto}',
    '#ominoIntro .lockup{display:flex;align-items:center;gap:16px;transform:translateX(0);direction:ltr;unicode-bidi:isolate}',
    '#ominoIntro .mark{width:112px;height:112px;opacity:0;filter:blur(14px);transform:scale(.9)}',
    '#ominoIntro .mark svg{width:100%;height:100%;display:block}',
    '#ominoIntro .mark path.fg{fill:' + PAPER + '}',
    '#ominoIntro .wordmark{display:flex;overflow:hidden;font-family:"Space Grotesk",var(--font-display,system-ui),sans-serif}',
    '#ominoIntro .wordmark span{display:inline-block;font-size:58px;font-weight:600;letter-spacing:0.04em;line-height:1;opacity:0;filter:blur(8px);transform:translateY(14px)}',
    '@media(max-width:640px){#ominoIntro .mark{width:76px;height:76px}#ominoIntro .wordmark span{font-size:38px}#ominoIntro .lockup{gap:12px}}',
    '@media (prefers-reduced-motion:reduce){#ominoIntro,#ominoIntro *{animation:none!important;transition:none!important}}'
  ].join('');

  const markSvg = '<svg viewBox="560 560 920 920" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<path class="fg" d="M 999.452 583.377 C 1002.55 582.864 1011.79 582.534 1015.45 582.52 C 1124.57 582.099 1238.99 628.369 1317.19 703.496 C 1404.53 787.545 1455.19 902.654 1458.17 1023.83 C 1459.59 1107.13 1419.3 1182.53 1345.73 1222.97 C 1309.27 1243.01 1279.13 1246.95 1238.7 1247.38 C 1238.42 1265.6 1237.68 1283.5 1233.94 1301.39 C 1214.83 1392.95 1141.63 1453.75 1050.25 1464.47 C 1047.01 1465.05 1037.72 1465.39 1033.89 1465.44 C 950.752 1466.53 864.349 1439.48 795.274 1393.52 C 772.236 1378.19 747.765 1357.32 728.1 1338.27 C 641.587 1254.46 594.019 1140.41 592.025 1020.18 C 591.024 959.834 610.557 907.971 652.127 864.289 C 695.119 819.111 748.835 802.174 809.971 800.894 C 808.405 683.74 882.351 597.052 999.452 583.377 z"/>' +
    '<path class="cut" d="M 810.758 800.525 C 836.938 798.78 871.66 800.025 898.336 799.863 C 938.965 800.75 979.686 798.785 1020.3 799.771 C 1138.95 802.654 1237.7 897.607 1237.85 1017.49 C 1237.94 1095.14 1239.45 1171.02 1237.99 1247.5 L 1031.78 1247.12 C 968.782 1246.94 918.661 1225.44 873.509 1181.59 C 804.097 1114.17 810.901 1033.82 810.516 946.11 L 810.758 800.525 z" fill="' + INK + '"/>' +
    '</svg>';

  function injectFont() {
    if (document.getElementById('ominoIntroFont')) return;
    const link = document.createElement('link');
    link.id = 'ominoIntroFont';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600&display=swap';
    document.head.appendChild(link);
  }

  function injectStyle() {
    if (document.getElementById('ominoIntroCss')) return;
    const el = document.createElement('style');
    el.id = 'ominoIntroCss';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function mount() {
    injectFont();
    injectStyle();
    if (document.getElementById('ominoIntro')) return document.getElementById('ominoIntro');
    const root = document.createElement('div');
    root.id = 'ominoIntro';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-label', 'OMINO');
    root.innerHTML = '<div class="lockup" id="ominoLockup">' +
      '<div class="mark" id="ominoMark">' + markSvg + '</div>' +
      '<div class="wordmark" id="ominoWordmark" aria-hidden="true">' +
      '<span>O</span><span>M</span><span>I</span><span>N</span><span>O</span>' +
      '</div></div>';
    document.documentElement.classList.add('is-booting');
    document.documentElement.setAttribute('aria-busy', 'true');
    const host = document.body || document.documentElement;
    host.insertBefore(root, host.firstChild);
    return root;
  }

  function finish(root) {
    if (finished) return;
    finished = true;
    if (master) { master.kill(); master = null; }
    if (root && root.parentNode) root.remove();
    done();
  }

  function buildTimeline(root) {
    const gsap = global.gsap;
    const intro = root;
    const mark = root.querySelector('#ominoMark');
    const lockup = root.querySelector('#ominoLockup');
    const wordmarkSpans = root.querySelectorAll('#ominoWordmark span');

    if (!gsap || reduce) {
      finish(root);
      return null;
    }

    gsap.set(intro, { display: 'flex', pointerEvents: 'auto', opacity: 1 });
    gsap.set(mark, { opacity: 0, filter: 'blur(14px)', scale: 0.9, y: 0 });
    gsap.set(lockup, { x: 0 });
    gsap.set(wordmarkSpans, { opacity: 0, filter: 'blur(8px)', y: 14 });

    const tl = gsap.timeline({ defaults: { ease: 'sine.inOut' } });

    tl.to(mark, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.75, ease: 'power4.out' }, 0);

    tl.to(lockup, { x: -14, duration: 0.9, ease: 'sine.inOut' }, 0.78)
      .to(wordmarkSpans, {
        opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.65, stagger: 0.09, ease: 'power3.out'
      }, 0.85);

    tl.to({}, { duration: 0.4 }, 1.55);

    tl.add(() => { done(); }, 1.95)
      .to(mark, {
        opacity: 0, scale: 1.05, filter: 'blur(7px)', y: -6, duration: 0.75, ease: 'sine.in'
      }, 1.95)
      .to(wordmarkSpans, {
        opacity: 0, filter: 'blur(7px)', y: -6, duration: 0.65, stagger: 0.035, ease: 'sine.in'
      }, 1.98)
      .to(intro, {
        opacity: 0, duration: 0.6, ease: 'sine.inOut',
        onComplete: () => {
          gsap.set(intro, { display: 'none', pointerEvents: 'none' });
          if (intro.parentNode) intro.remove();
          finished = true;
          master = null;
        }
      }, 2.35);

    return tl;
  }

  function play(root) {
    if (master) master.kill();
    master = buildTimeline(root);
  }

  function skip(root) {
    finish(root);
  }

  function start() {
    if (!shouldBoot) { done(); return; }
    const root = mount();
    play(root);
    global.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape' && !finished) {
        global.removeEventListener('keydown', onEsc);
        skip(root);
      }
    });
  }

  if (shouldBoot) {
    document.documentElement.classList.add('is-booting');
    document.documentElement.setAttribute('aria-busy', 'true');
    if (document.head) {
      injectFont();
      injectStyle();
    }
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);

  global.OminoLoader = { onReady, get isReady() { return ready; } };
})(window);
