(function (global) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaults = {
    en: { skip: 'Skip to content', skipAuth: 'Skip to sign in' },
    ar: { skip: 'تخطي إلى المحتوى', skipAuth: 'تخطي إلى تسجيل الدخول' }
  };

  function withDefaults(copy) {
    return {
      en: Object.assign({}, defaults.en, copy.en || {}),
      ar: Object.assign({}, defaults.ar, copy.ar || {})
    };
  }

  function applyCopy(copy, lang) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = copy[lang][el.dataset.i18n];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = copy[lang][el.dataset.i18nHtml];
      if (v != null) el.innerHTML = v;
    });
    const title = copy[lang].title;
    if (title) document.title = title;
  }

  function init(options) {
    const copy = withDefaults(options.copy);
    let lang = localStorage.getItem('omino-lang') === 'ar' ? 'ar' : 'en';
    const nav = document.getElementById('siteNav');
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const langToggle = document.getElementById('langToggle');
    let menuAnim = null;

    function t(key) { return copy[lang][key]; }

    function setLang(next) {
      lang = next;
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
      if (langToggle) {
        langToggle.textContent = next === 'ar' ? 'EN' : 'AR';
        langToggle.setAttribute('aria-label', next === 'ar' ? 'English' : 'العربية');
      }
      localStorage.setItem('omino-lang', next);
      applyCopy(copy, lang);
      setMenu(false);
      if (options.afterLang) options.afterLang(lang);
      document.dispatchEvent(new CustomEvent('omino-lang', { detail: lang }));
    }

    let lockY = 0;
    function lockPage() {
      lockY = window.scrollY || document.documentElement.scrollTop || 0;
      document.documentElement.classList.add('menu-open');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + lockY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }
    function unlockPage() {
      document.documentElement.classList.remove('menu-open');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lockY);
    }
    function trapScroll(e) {
      if (!document.documentElement.classList.contains('menu-open')) return;
      if (e.target.closest && e.target.closest('.menu-nav')) return;
      e.preventDefault();
    }
    document.addEventListener('touchmove', trapScroll, { passive: false });
    document.addEventListener('wheel', trapScroll, { passive: false });

    function setMenu(open) {
      if (!mobileMenu || !menuBtn) return;
      const drawer = mobileMenu.querySelector('.menu-drawer');
      const scrim = document.getElementById('menuScrim');
      const items = mobileMenu.querySelectorAll('.menu-drawer-top, .menu-link, .menu-cta, .menu-foot');
      const offX = document.documentElement.dir === 'rtl' ? '-100%' : '100%';
      const isOpen = mobileMenu.classList.contains('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? t('menu.close') : t('menu.open'));
      if (scrim) scrim.setAttribute('aria-label', t('menu.close'));
      if (open === isOpen && !menuAnim) return;
      if (menuAnim) { menuAnim.kill(); menuAnim = null; }

      if (open) {
        mobileMenu.classList.add('open');
        lockPage();
        mobileMenu.setAttribute('aria-hidden', 'false');
        mobileMenu.inert = false;
        if (reduceMotion || !global.gsap) {
          if (scrim) scrim.style.opacity = '1';
          if (drawer) drawer.style.transform = 'translateX(0)';
          return;
        }
        gsap.set(scrim, { opacity: 0 });
        gsap.set(drawer, { x: offX });
        gsap.set(items, { opacity: 0, y: 16 });
        menuAnim = gsap.timeline({ defaults: { ease: 'power4.out' }, onComplete: () => { menuAnim = null; } })
          .to(scrim, { opacity: 1, duration: 0.45 }, 0)
          .to(drawer, { x: 0, duration: 0.65 }, 0)
          .to(items, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, 0.14);
        return;
      }

      const finish = () => {
        mobileMenu.classList.remove('open');
        unlockPage();
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.inert = true;
        if (global.gsap) gsap.set([scrim, drawer, items], { clearProps: 'all' });
        menuAnim = null;
      };
      if (reduceMotion || !isOpen || !global.gsap) { finish(); return; }
      menuAnim = gsap.timeline({ onComplete: finish })
        .to(items, { opacity: 0, y: 12, duration: 0.32, stagger: { each: 0.045, from: 'end' }, ease: 'power3.in' }, 0)
        .to(drawer, { x: offX, duration: 0.55, ease: 'power3.inOut' }, 0.08)
        .to(scrim, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.1);
    }

    if (nav) {
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });
    }
    if (menuBtn) menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    const scrim = document.getElementById('menuScrim');
    if (scrim) scrim.addEventListener('click', () => setMenu(false));
    if (mobileMenu) {
      mobileMenu.querySelectorAll('.menu-link, .menu-cta a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) setMenu(false);
    });
    if (langToggle) langToggle.addEventListener('click', () => setLang(lang === 'en' ? 'ar' : 'en'));

    setLang(lang);
    return { t: (key) => copy[lang][key], getLang: () => lang, setLang, setMenu, apply: () => applyCopy(copy, lang) };
  }

  global.OminoNav = { init };
})(window);
