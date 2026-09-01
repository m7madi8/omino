(function (global) {
  const STORAGE_KEY = 'ominoCookieConsent';
  const skipPage = /(?:^|\/)app\.html$/i.test(location.pathname);
  if (skipPage) return;

  const copy = {
    en: {
      title: 'Your privacy',
      body: 'OMINO uses cookies to keep your session secure and understand how the product is used. You choose what’s on.',
      privacy: 'Privacy policy',
      reject: 'Reject non-essential',
      accept: 'Accept all',
      manage: 'Manage preferences',
      essential: 'Essential',
      essentialD: 'Required for sign-in and core functionality. Always on.',
      analytics: 'Analytics',
      analyticsD: 'Helps us understand which parts of OMINO are actually useful.',
      marketing: 'Marketing',
      marketingD: 'Used to measure and improve OMINO’s own campaigns.',
      save: 'Save preferences',
      reopen: 'Cookie settings',
      essentialAria: 'Essential cookies, always on',
      analyticsAria: 'Toggle analytics cookies',
      marketingAria: 'Toggle marketing cookies',
      dialog: 'Cookie preferences'
    },
    ar: {
      title: 'خصوصيتك',
      body: 'OMINO يستخدم الكوكيز لحماية جلستك وفهم كيف يُستخدم المنتج. أنت تختار ما يشتغل.',
      privacy: 'سياسة الخصوصية',
      reject: 'رفض غير الضروري',
      accept: 'قبول الكل',
      manage: 'إدارة التفضيلات',
      essential: 'ضروري',
      essentialD: 'مطلوب لتسجيل الدخول والوظائف الأساسية. دائماً شغّال.',
      analytics: 'تحليلات',
      analyticsD: 'يساعدنا نفهم أي أجزاء من OMINO مفيدة فعلاً.',
      marketing: 'تسويق',
      marketingD: 'لقياس وتحسين حملات OMINO نفسها.',
      save: 'حفظ التفضيلات',
      reopen: 'إعدادات الكوكيز',
      essentialAria: 'كوكيز ضرورية، دائماً شغّالة',
      analyticsAria: 'تفعيل كوكيز التحليلات',
      marketingAria: 'تفعيل كوكيز التسويق',
      dialog: 'تفضيلات الكوكيز'
    }
  };

  const markSvg = '<svg viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path fill="#f5f1e8" d="M 999.452 583.377 C 1002.55 582.864 1011.79 582.534 1015.45 582.52 C 1124.57 582.099 1238.99 628.369 1317.19 703.496 C 1404.53 787.545 1455.19 902.654 1458.17 1023.83 C 1459.59 1107.13 1419.3 1182.53 1345.73 1222.97 C 1309.27 1243.01 1279.13 1246.95 1238.7 1247.38 C 1238.42 1265.6 1237.68 1283.5 1233.94 1301.39 C 1214.83 1392.95 1141.63 1453.75 1050.25 1464.47 C 1047.01 1465.05 1037.72 1465.39 1033.89 1465.44 C 950.752 1466.53 864.349 1439.48 795.274 1393.52 C 772.236 1378.19 747.765 1357.32 728.1 1338.27 C 641.587 1254.46 594.019 1140.41 592.025 1020.18 C 591.024 959.834 610.557 907.971 652.127 864.289 C 695.119 819.111 748.835 802.174 809.971 800.894 C 808.405 683.74 882.351 597.052 999.452 583.377 z"/><path fill="#0a0a0a" d="M 810.758 800.525 C 836.938 798.78 871.66 800.025 898.336 799.863 C 938.965 800.75 979.686 798.785 1020.3 799.771 C 1138.95 802.654 1237.7 897.607 1237.85 1017.49 C 1237.94 1095.14 1239.45 1171.02 1237.99 1247.5 L 1031.78 1247.12 C 968.782 1246.94 918.661 1225.44 873.509 1181.59 C 804.097 1114.17 810.901 1033.82 810.516 946.11 L 810.758 800.525 z"/></svg>';

  const css = [
    '#cookieConsent{position:fixed;inset-inline-start:24px;bottom:24px;z-index:200;width:min(400px,calc(100vw - 48px));background:var(--ink,#0A0A0A);color:var(--paper,#F2F3F5);border-radius:16px;border:1px solid var(--hairline-dark,#2c2b28);box-shadow:0 30px 70px -25px rgba(0,0,0,.45);padding:24px;opacity:0;transform:translateY(16px);transition:opacity .5s var(--ease,cubic-bezier(.22,1,.36,1)),transform .5s var(--ease,cubic-bezier(.22,1,.36,1))}',
    '#cookieConsent.show{opacity:1;transform:translateY(0)}',
    '#cookieConsent[hidden]{display:none}',
    '#cookieConsent .cc-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}',
    '#cookieConsent .cc-mark{width:26px;height:26px;flex:none}',
    '#cookieConsent .cc-mark svg{width:100%;height:100%;display:block}',
    '#cookieConsent .cc-title{font-family:var(--font-display,"Archivo",sans-serif);font-size:15px;font-weight:500;font-stretch:125%;letter-spacing:.02em}',
    'html[lang="ar"] #cookieConsent .cc-title{font-family:var(--font-ar-display,"Zain",sans-serif);font-stretch:normal;letter-spacing:0}',
    '#cookieConsent .cc-body{font-size:13.5px;line-height:1.6;color:#C5C9CE}',
    'html[lang="ar"] #cookieConsent .cc-body{font-family:var(--font-ar,"IBM Plex Sans Arabic",sans-serif)}',
    '#cookieConsent .cc-body a{text-decoration:underline;text-underline-offset:2px;color:var(--paper,#F2F3F5)}',
    '#cookieConsent .cc-actions{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}',
    '#cookieConsent .cc-btn{flex:1;padding:11px 16px;border-radius:999px;font-size:13px;font-weight:600;border:1px solid transparent;text-align:center;transition:transform .25s var(--ease,cubic-bezier(.22,1,.36,1)),background .25s var(--ease,cubic-bezier(.22,1,.36,1));min-width:120px;min-height:44px;font-family:inherit;cursor:pointer;color:inherit}',
    'html[lang="ar"] #cookieConsent .cc-btn{font-family:var(--font-ar,"IBM Plex Sans Arabic",sans-serif);font-weight:500}',
    '#cookieConsent .cc-btn-primary{background:var(--paper,#F2F3F5);color:var(--ink,#0A0A0A)}',
    '#cookieConsent .cc-btn-primary:hover{transform:translateY(-1px);background:#fff}',
    '#cookieConsent .cc-btn-ghost{border-color:var(--hairline-dark,#2c2b28);color:var(--paper,#F2F3F5);background:transparent}',
    '#cookieConsent .cc-btn-ghost:hover{transform:translateY(-1px);border-color:#5f5c53}',
    '#cookieConsent .cc-manage{margin-top:14px;text-align:center}',
    '#cookieConsent .cc-manage button{background:none;border:none;font-size:12.5px;color:#8A9096;text-decoration:underline;text-underline-offset:2px;cursor:pointer;font-family:inherit;min-height:44px;padding:8px}',
    '#cookieConsent .cc-manage button:hover{color:var(--paper,#F2F3F5)}',
    '#cookieConsent .cc-prefs{margin-top:16px;padding-top:16px;border-top:1px solid var(--hairline-dark,#2c2b28);display:none;flex-direction:column;gap:14px}',
    '#cookieConsent .cc-prefs.open{display:flex}',
    '#cookieConsent .cc-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}',
    '#cookieConsent .cc-row .info{flex:1}',
    '#cookieConsent .cc-row .k{font-size:13px;font-weight:600;margin-bottom:3px}',
    '#cookieConsent .cc-row .d{font-size:12px;color:#8A9096;line-height:1.5}',
    '#cookieConsent .cc-toggle{position:relative;width:38px;height:22px;border-radius:999px;background:#3a3830;flex:none;border:none;padding:0;margin-top:2px;cursor:pointer}',
    '#cookieConsent .cc-toggle .knob{position:absolute;top:3px;inset-inline-start:3px;width:16px;height:16px;border-radius:50%;background:#8f8b7f;transition:.25s var(--ease,cubic-bezier(.22,1,.36,1))}',
    '#cookieConsent .cc-toggle.on{background:var(--accent,#5B7CFF)}',
    '#cookieConsent .cc-toggle.on .knob{inset-inline-start:19px;background:#fff}',
    '#cookieConsent .cc-toggle[disabled]{opacity:.55;cursor:default}',
    '#cookieConsent .cc-save{margin-top:4px}',
    '#cookieReopen{position:fixed;inset-inline-start:24px;bottom:24px;z-index:190;display:none;align-items:center;gap:8px;background:var(--ink,#0A0A0A);color:var(--paper,#F2F3F5);border-radius:999px;padding:10px 16px;font-size:12.5px;font-weight:500;border:1px solid var(--hairline-dark,#2c2b28);box-shadow:0 20px 40px -18px rgba(0,0,0,.4);cursor:pointer;font-family:inherit;min-height:44px}',
    '#cookieReopen.show{display:inline-flex}',
    '#cookieReopen svg{width:16px;height:16px;flex:none}',
    '#cookieConsent:focus-visible,#cookieConsent button:focus-visible,#cookieReopen:focus-visible{outline:none;box-shadow:var(--ring,0 0 0 4px rgba(91,124,255,.22))}',
    '@media(max-width:480px){#cookieConsent,#cookieReopen{inset-inline:16px;width:auto;bottom:16px}}',
    '@media (prefers-reduced-motion:reduce){#cookieConsent,#cookieConsent *,#cookieReopen{transition-duration:.01ms!important}}'
  ].join('');

  function lang() {
    const stored = localStorage.getItem('omino-lang');
    if (stored === 'ar' || stored === 'en') return stored;
    return document.documentElement.lang === 'ar' ? 'ar' : 'en';
  }

  function t(key) {
    return copy[lang()][key];
  }

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch (e) { return null; }
  }

  function setConsent(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
    global.dispatchEvent(new CustomEvent('omino-consent', { detail: prefs }));
  }

  function injectStyle() {
    if (document.getElementById('ominoCookieCss')) return;
    const el = document.createElement('style');
    el.id = 'ominoCookieCss';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function applyCopy(root) {
    root.querySelectorAll('[data-cc]').forEach((el) => {
      const v = t(el.dataset.cc);
      if (v != null) el.textContent = v;
    });
    const dialog = document.getElementById('cookieConsent');
    const reopen = document.getElementById('cookieReopen');
    if (dialog) dialog.setAttribute('aria-label', t('dialog'));
    if (reopen) reopen.setAttribute('aria-label', t('reopen'));
    const ess = root.querySelector('#ccEssential');
    const an = root.querySelector('#toggleAnalytics');
    const mk = root.querySelector('#toggleMarketing');
    if (ess) ess.setAttribute('aria-label', t('essentialAria'));
    if (an) an.setAttribute('aria-label', t('analyticsAria'));
    if (mk) mk.setAttribute('aria-label', t('marketingAria'));
  }

  function mount() {
    injectStyle();
    if (document.getElementById('cookieConsent')) return;
    const reopen = document.createElement('button');
    reopen.id = 'cookieReopen';
    reopen.type = 'button';
    reopen.setAttribute('aria-label', t('reopen'));
    reopen.innerHTML = markSvg + '<span data-cc="reopen">Cookie settings</span>';

    const banner = document.createElement('div');
    banner.id = 'cookieConsent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', t('dialog'));
    banner.hidden = true;
    banner.innerHTML =
      '<div class="cc-head"><div class="cc-mark">' + markSvg + '</div><div class="cc-title" data-cc="title">Your privacy</div></div>' +
      '<div class="cc-body"><span data-cc="body"></span> <a href="privacy.html" data-cc="privacy">Privacy policy</a></div>' +
      '<div class="cc-actions">' +
        '<button type="button" class="cc-btn cc-btn-ghost" id="ccReject" data-cc="reject">Reject non-essential</button>' +
        '<button type="button" class="cc-btn cc-btn-primary" id="ccAccept" data-cc="accept">Accept all</button>' +
      '</div>' +
      '<div class="cc-manage"><button type="button" id="ccManageToggle" aria-expanded="false" aria-controls="ccPrefs" data-cc="manage">Manage preferences</button></div>' +
      '<div class="cc-prefs" id="ccPrefs">' +
        '<div class="cc-row"><div class="info"><div class="k" data-cc="essential">Essential</div><div class="d" data-cc="essentialD"></div></div>' +
        '<button type="button" class="cc-toggle on" id="ccEssential" disabled><span class="knob"></span></button></div>' +
        '<div class="cc-row"><div class="info"><div class="k" data-cc="analytics">Analytics</div><div class="d" data-cc="analyticsD"></div></div>' +
        '<button type="button" class="cc-toggle" id="toggleAnalytics" aria-pressed="false"><span class="knob"></span></button></div>' +
        '<div class="cc-row"><div class="info"><div class="k" data-cc="marketing">Marketing</div><div class="d" data-cc="marketingD"></div></div>' +
        '<button type="button" class="cc-toggle" id="toggleMarketing" aria-pressed="false"><span class="knob"></span></button></div>' +
        '<button type="button" class="cc-btn cc-btn-primary cc-save" id="ccSave" data-cc="save">Save preferences</button>' +
      '</div>';

    document.body.appendChild(reopen);
    document.body.appendChild(banner);
    applyCopy(document);
    bind(banner, reopen);
  }

  function bind(banner, reopenBtn) {
    const reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const acceptBtn = document.getElementById('ccAccept');
    const rejectBtn = document.getElementById('ccReject');
    const manageToggle = document.getElementById('ccManageToggle');
    const prefsPanel = document.getElementById('ccPrefs');
    const saveBtn = document.getElementById('ccSave');
    const toggleAnalytics = document.getElementById('toggleAnalytics');
    const toggleMarketing = document.getElementById('toggleMarketing');

    function showBanner() {
      banner.hidden = false;
      requestAnimationFrame(() => banner.classList.add('show'));
      reopenBtn.classList.remove('show');
    }
    function hideBanner() {
      banner.classList.remove('show');
      setTimeout(() => { banner.hidden = true; }, reduce ? 0 : 500);
      reopenBtn.classList.add('show');
    }
    function applyToggles(prefs) {
      toggleAnalytics.classList.toggle('on', !!prefs.analytics);
      toggleMarketing.classList.toggle('on', !!prefs.marketing);
      toggleAnalytics.setAttribute('aria-pressed', String(!!prefs.analytics));
      toggleMarketing.setAttribute('aria-pressed', String(!!prefs.marketing));
    }

    const existing = getConsent();
    if (existing) {
      applyToggles(existing);
      reopenBtn.classList.add('show');
    } else {
      showBanner();
    }

    acceptBtn.addEventListener('click', () => {
      const prefs = { essential: true, analytics: true, marketing: true, ts: Date.now() };
      setConsent(prefs);
      applyToggles(prefs);
      hideBanner();
    });
    rejectBtn.addEventListener('click', () => {
      const prefs = { essential: true, analytics: false, marketing: false, ts: Date.now() };
      setConsent(prefs);
      applyToggles(prefs);
      hideBanner();
    });
    manageToggle.addEventListener('click', () => {
      const open = prefsPanel.classList.toggle('open');
      manageToggle.setAttribute('aria-expanded', String(open));
    });
    [toggleAnalytics, toggleMarketing].forEach((btn) => {
      btn.addEventListener('click', () => {
        const on = btn.classList.toggle('on');
        btn.setAttribute('aria-pressed', String(on));
      });
    });
    saveBtn.addEventListener('click', () => {
      const prefs = {
        essential: true,
        analytics: toggleAnalytics.classList.contains('on'),
        marketing: toggleMarketing.classList.contains('on'),
        ts: Date.now()
      };
      setConsent(prefs);
      hideBanner();
    });
    reopenBtn.addEventListener('click', () => {
      const saved = getConsent();
      if (saved) {
        applyToggles(saved);
        prefsPanel.classList.add('open');
        manageToggle.setAttribute('aria-expanded', 'true');
      }
      showBanner();
    });

    document.addEventListener('omino-lang', () => applyCopy(document));
    new MutationObserver(() => applyCopy(document)).observe(document.documentElement, {
      attributes: true, attributeFilter: ['lang']
    });
  }

  function start() {
    mount();
  }

  function boot() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', boot);
      return;
    }
    if (global.OminoLoader) global.OminoLoader.onReady(start);
    else start();
  }

  boot();

  global.OminoCookies = { get: getConsent };
})(window);
