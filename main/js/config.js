(function (global) {
  const contact = {
    email: 'hello@omino.ps',
    /* E.164 without +. Replace with the live WhatsApp Business number. */
    whatsapp: '970599000000',
    defaultMessage: 'Hello OMINO — I want to join the founding 50.'
  };

  const plans = {
    starter: { id: 'starter', name: 'Run', monthly: 9, yearly: 7.5, annual: 90, save: 18 },
    pro: { id: 'pro', name: 'Grow', monthly: 29, yearly: 24.2, annual: 290, save: 58 },
    business: { id: 'business', name: 'Scale', monthly: 59, yearly: 49.2, annual: 590, save: 118 }
  };

  const ORDER_KEY = 'omino.lastOrder';

  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function waDisplay() {
    const d = digits(contact.whatsapp);
    if (d.startsWith('970') && d.length === 12) {
      return '+' + d.slice(0, 3) + ' ' + d.slice(3, 5) + ' ' + d.slice(5, 8) + ' ' + d.slice(8);
    }
    return d ? '+' + d : '';
  }

  function waLink(text, to) {
    const num = digits(to || contact.whatsapp);
    const msg = encodeURIComponent(text || contact.defaultMessage);
    return 'https://wa.me/' + num + (msg ? '?text=' + msg : '');
  }

  function mailLink(to, subject, body) {
    let href = 'mailto:' + (to || contact.email);
    const q = [];
    if (subject) q.push('subject=' + encodeURIComponent(subject));
    if (body) q.push('body=' + encodeURIComponent(body));
    if (q.length) href += '?' + q.join('&');
    return href;
  }

  function planPrice(plan, billing) {
    const p = plans[plan] || plans.pro;
    const yearly = billing === 'yearly';
    const monthly = yearly ? p.yearly : p.monthly;
    return {
      plan: p,
      billing: yearly ? 'yearly' : 'monthly',
      monthly,
      annual: p.annual != null ? p.annual : Math.round(p.yearly * 12 * 10) / 10,
      save: p.save
    };
  }

  function bind() {
    document.querySelectorAll('[data-mail]').forEach((el) => {
      el.href = mailLink(
        el.getAttribute('data-mail-to') || contact.email,
        el.getAttribute('data-mail-subject'),
        el.getAttribute('data-mail-body')
      );
      if (el.hasAttribute('data-mail-label')) el.textContent = contact.email;
    });
    document.querySelectorAll('[data-wa]').forEach((el) => {
      el.href = waLink(el.getAttribute('data-wa-msg'), el.getAttribute('data-wa-to'));
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    });
    document.querySelectorAll('[data-wa-display]').forEach((el) => {
      el.textContent = waDisplay();
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  global.OMINO = { contact, plans, ORDER_KEY, digits, waDisplay, waLink, mailLink, planPrice, bind };
  ready(bind);
})(window);
