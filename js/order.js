(function () {
  const O = window.OMINO;
  if (!O) return;

  const params = new URLSearchParams(location.search);
  const checkoutForm = document.getElementById('checkoutForm');
  const confirmRoot = document.getElementById('confirmRoot');

  function lang() {
    return document.documentElement.lang === 'ar' ? 'ar' : 'en';
  }

  function money(n) {
    const v = Number(n);
    return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, '');
  }

  function last4(num) {
    return O.digits(num).slice(-4) || '••••';
  }

  function toWa(phone) {
    let d = O.digits(phone);
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith('0') && d.length === 10) d = '970' + d.slice(1);
    return d;
  }

  function addressBlock(order, ar) {
    const lines = [order.address1];
    if (order.address2) lines.push(order.address2);
    const cityLine = [order.cityLabel || order.city, order.countryLabel, order.postal].filter(Boolean).join(' — ');
    lines.push(cityLine);
    return ar
      ? ('الاسم: ' + (order.fullname || '') + '\nالعنوان:\n' + lines.join('\n'))
      : ('Name: ' + (order.fullname || '') + '\nAddress:\n' + lines.join('\n'));
  }

  function messages(order) {
    const ar = lang() === 'ar';
    const price = order.billing === 'yearly'
      ? (ar
        ? '$' + money(order.monthly) + ' / شهر — يُفوتر $' + money(order.annual) + ' سنوياً'
        : '$' + money(order.monthly) + ' / month — billed $' + money(order.annual) + ' / year')
      : (ar ? '$' + money(order.monthly) + ' / شهر' : '$' + money(order.monthly) + ' / month');
    const method = order.method === 'whatsapp'
      ? (ar ? 'واتساب' : 'WhatsApp')
      : (ar ? 'بطاقة' + (order.last4 ? ' •••• ' + order.last4 : '') : 'Card' + (order.last4 ? ' •••• ' + order.last4 : ''));
    const ref = order.ref;

    const who = order.fullname || order.business || '';
    const addr = addressBlock(order, ar);
    const email = ar
      ? ('OMINO\nتأكيد طلب الباقة\n\nمرحباً ' + who + ',\n\nاستلمنا طلبك لباقة ' + order.planName + '.\nالمرجع: ' + ref + '\nالسعر: ' + price + '\nطريقة الدفع: ' + method + '\nالنشاط: ' + (order.business || '') + '\n' + addr + '\n\nأول 50 نشاطاً يثبتون تسعير المؤسسين طالما بقوا على OMINO.\nرسوم المنصة 0.3%–0.5% على كل دفعة إلكترونية ناجحة.\n\nإذا كان عندك سؤال: ' + O.contact.email + ' أو واتساب ' + O.waDisplay() + '\n\nOMINO — نظام تشغيل الأعمال')
      : ('OMINO\nPlan order confirmation\n\nHello ' + who + ',\n\nWe received your ' + order.planName + ' plan request.\nReference: ' + ref + '\nPrice: ' + price + '\nPayment: ' + method + '\nBusiness: ' + (order.business || '') + '\n' + addr + '\n\nThe first 50 businesses lock in founding pricing for as long as they stay on OMINO.\nPlatform fee: 0.3%–0.5% on successful online payments.\n\nQuestions: ' + O.contact.email + ' or WhatsApp ' + O.waDisplay() + '\n\nOMINO — AI Business OS');

    const whatsapp = ar
      ? ('تأكيد OMINO\n\nطلب باقة ' + order.planName + '\nالمرجع: ' + ref + '\n' + price + '\nالدفع: ' + method + '\n\n' + who + ' — ' + (order.business || '') + '\n' + (order.address1 || '') + (order.address2 ? '\n' + order.address2 : '') + '\n' + (order.cityLabel || order.city || '') + (order.countryLabel ? ' — ' + order.countryLabel : '') + ' ' + (order.postal || '') + '\n\nاستلمنا طلبكم. نجهّز الحساب ضمن أول 50.')
      : ('OMINO confirmation\n\n' + order.planName + ' plan request\nRef: ' + ref + '\n' + price + '\nPayment: ' + method + '\n\n' + who + ' — ' + (order.business || '') + '\n' + (order.address1 || '') + (order.address2 ? '\n' + order.address2 : '') + '\n' + (order.cityLabel || order.city || '') + (order.countryLabel ? ', ' + order.countryLabel : '') + ' ' + (order.postal || '') + '\n\nWe received your request. We are preparing the founding account.');

    const team = ar
      ? ('طلب باقة OMINO\n\nالاسم: ' + (order.fullname || '') + '\nالنشاط: ' + (order.business || '') + '\nالإيميل: ' + (order.email || '') + '\nالجوال: ' + (order.phone || '') + '\nالعنوان 1: ' + (order.address1 || '') + '\nالعنوان 2: ' + (order.address2 || '—') + '\nالدولة: ' + (order.countryLabel || '') + '\nالمدينة: ' + (order.cityLabel || order.city || '') + '\nالرمز البريدي: ' + (order.postal || '') + '\nالباقة: ' + order.planName + '\nالفوترة: ' + (order.billing === 'yearly' ? 'سنوي' : 'شهري') + '\n' + price + '\nالدفع: ' + method + '\nالمرجع: ' + ref)
      : ('OMINO plan request\n\nName: ' + (order.fullname || '') + '\nBusiness: ' + (order.business || '') + '\nEmail: ' + (order.email || '') + '\nPhone: ' + (order.phone || '') + '\nAddress 1: ' + (order.address1 || '') + '\nAddress 2: ' + (order.address2 || '—') + '\nCountry: ' + (order.countryLabel || '') + '\nCity: ' + (order.cityLabel || order.city || '') + '\nPostal code: ' + (order.postal || '') + '\nPlan: ' + order.planName + '\nBilling: ' + order.billing + '\n' + price + '\nPayment: ' + method + '\nRef: ' + ref);

    return { email, whatsapp, team, price, method };
  }

  function fillSummary(planId, billing) {
    const info = O.planPrice(planId, billing);
    const nameEl = document.getElementById('sumPlan');
    const billEl = document.getElementById('sumBilling');
    const monthEl = document.getElementById('sumMonthly');
    const yearEl = document.getElementById('sumAnnual');
    const yearRow = document.getElementById('sumAnnualRow');
    const foundingEl = document.getElementById('foundingLeft');
    if (nameEl) nameEl.textContent = info.plan.name;
    if (billEl) billEl.textContent = info.billing === 'yearly' ? (lang() === 'ar' ? 'سنوي' : 'Yearly') : (lang() === 'ar' ? 'شهري' : 'Monthly');
    if (monthEl) monthEl.textContent = '$' + money(info.monthly);
    if (yearEl) yearEl.textContent = '$' + money(info.annual);
    if (yearRow) yearRow.hidden = info.billing !== 'yearly';
    const left = Math.max(0, 50 - (window.OminoAuth ? OminoAuth.foundingCount() : 0));
    if (foundingEl) foundingEl.textContent = String(left);
    return info;
  }

  if (checkoutForm) {
    const planInput = document.getElementById('planId');
    const billingInput = document.getElementById('billingId');
    const cardBlock = document.getElementById('cardBlock');
    const err = document.getElementById('payError');
    const cardNum = document.getElementById('cardNumber');
    const cardExp = document.getElementById('cardExp');
    const cardFace = document.getElementById('cardFaceNum');
    let planId = (params.get('plan') || 'pro').toLowerCase();
    if (!O.plans[planId]) planId = 'pro';
    let billing = params.get('billing') === 'yearly' ? 'yearly' : 'monthly';
    planInput.value = planId;
    billingInput.value = billing;
    fillSummary(planId, billing);

    const countryEl = checkoutForm.country;
    const cityEl = checkoutForm.city;
    function refreshPlaces(keepCity) {
      const ar = lang() === 'ar';
      O.fillCountrySelect(countryEl, ar ? 'ar' : 'en', countryEl.value || 'ps');
      O.fillCitySelect(cityEl, countryEl.value || 'ps', ar ? 'ar' : 'en', keepCity ? cityEl.value : '');
    }
    if (countryEl && cityEl && O.fillCitySelect) {
      refreshPlaces(true);
      if (O.enhancePlaceSelects) O.enhancePlaceSelects(countryEl, cityEl);
      countryEl.addEventListener('change', () => refreshPlaces(false));
    }

    document.querySelectorAll('input[name="method"]').forEach((input) => {
      input.addEventListener('change', () => {
        const wa = checkoutForm.method.value === 'whatsapp';
        cardBlock.hidden = wa;
        cardBlock.querySelectorAll('input').forEach((el) => { el.required = !wa; });
        document.querySelectorAll('.pay-methods label').forEach((l) => l.classList.toggle('is-on', l.querySelector('input').checked));
      });
    });
    document.querySelectorAll('.pay-methods label').forEach((l) => l.classList.toggle('is-on', l.querySelector('input').checked));

    if (cardNum) {
      cardNum.addEventListener('input', () => {
        const d = O.digits(cardNum.value).slice(0, 16);
        cardNum.value = d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        if (cardFace) cardFace.textContent = cardNum.value || '•••• •••• •••• ••••';
      });
    }
    if (cardExp) {
      cardExp.addEventListener('input', () => {
        const d = O.digits(cardExp.value).slice(0, 4);
        cardExp.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
      });
    }

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      err.textContent = '';
      const method = checkoutForm.method.value;
      const fullname = checkoutForm.fullname.value.trim();
      const business = checkoutForm.business.value.trim();
      const email = checkoutForm.email.value.trim();
      const phone = checkoutForm.phone.value.trim();
      const address1 = checkoutForm.address1.value.trim();
      const address2 = checkoutForm.address2.value.trim();
      const country = checkoutForm.country.value;
      const city = checkoutForm.city.value.trim();
      const postal = checkoutForm.postal.value.trim();
      if (!fullname || !business || !email || !phone) {
        err.textContent = lang() === 'ar' ? 'أدخل الاسم، اسم النشاط، الإيميل، والجوال.' : 'Enter name, business, email, and mobile.';
        return;
      }
      if (!address1 || !country || !city || !postal) {
        err.textContent = lang() === 'ar' ? 'أدخل العنوان 1، واختر الدولة والمدينة، وأدخل الرمز البريدي. العنوان 2 اختياري.' : 'Enter address line 1, choose country and city, and enter postal code. Line 2 is optional.';
        return;
      }
      if (postal.replace(/\s/g, '').length < 3) {
        err.textContent = lang() === 'ar' ? 'أدخل رمزاً بريدياً صحيحاً.' : 'Enter a valid postal code.';
        return;
      }
      if (toWa(phone).length < 10) {
        err.textContent = lang() === 'ar' ? 'أدخل رقم واتساب صحيح مع مفتاح الدولة.' : 'Enter a valid WhatsApp number with country code.';
        return;
      }
      if (method === 'card') {
        const n = O.digits(cardNum.value);
        const exp = O.digits(cardExp.value);
        const cvc = O.digits(checkoutForm.cvc.value);
        if (n.length < 13 || exp.length !== 4 || cvc.length < 3) {
          err.textContent = lang() === 'ar' ? 'تحقق من بيانات البطاقة.' : 'Check the card details.';
          return;
        }
      }
      const info = O.planPrice(planId, billing);
      const order = {
        ref: 'OM-' + Date.now().toString(36).toUpperCase(),
        planId,
        planName: info.plan.name,
        billing: info.billing,
        monthly: info.monthly,
        annual: info.annual,
        business,
        fullname,
        email,
        phone: toWa(phone),
        address1,
        address2,
        country,
        countryLabel: O.countryName(country, lang()),
        city,
        cityLabel: O.cityName(country, city, lang()),
        postal,
        method,
        last4: method === 'card' ? last4(cardNum.value) : '',
        at: Date.now()
      };
      sessionStorage.setItem(O.ORDER_KEY, JSON.stringify(order));
      location.href = 'confirm.html';
    });

    document.addEventListener('omino-lang', () => {
      fillSummary(planId, billing);
      if (countryEl && cityEl && O.fillCitySelect) refreshPlaces(true);
    });
  }

  if (confirmRoot) {
    let order;
    try { order = JSON.parse(sessionStorage.getItem(O.ORDER_KEY) || 'null'); } catch { order = null; }
    if (!order) {
      location.replace('index.html#pricing');
      return;
    }

    function render() {
      const msg = messages(order);
      document.getElementById('confirmRef').textContent = order.ref;
      document.getElementById('emailTo').textContent = order.email;
      document.getElementById('emailBody').textContent = msg.email;
      document.getElementById('waBody').textContent = msg.whatsapp;
      const mailBtn = document.getElementById('emailSend');
      const waCustomer = document.getElementById('waCustomer');
      const waTeam = document.getElementById('waTeam');
      mailBtn.href = O.mailLink(order.email, lang() === 'ar' ? 'تأكيد طلب OMINO ' + order.ref : 'OMINO order ' + order.ref, msg.email);
      waCustomer.href = O.waLink(msg.whatsapp, order.phone);
      waTeam.href = O.waLink(msg.team);
    }

    render();
    document.addEventListener('omino-lang', render);
  }
})();
