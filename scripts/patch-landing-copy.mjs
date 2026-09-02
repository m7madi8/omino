import fs from 'fs';

const path = 'D:/projects/OMINO/main/index.html';
let html = fs.readFileSync(path, 'utf8');

const en = {
  title: 'OMINO — The Intelligent Operating System for Your Business',
  'nav.product': 'Product', 'nav.ai': 'AI', 'nav.pricing': 'Pricing', 'nav.about': 'About', 'nav.login': 'Login',
  'cta.start': 'Start for free', 'cta.fit': 'Explore OMINO', 'cta.see': 'See how OMINO works',
  'menu.open': 'Open menu', 'menu.close': 'Close menu',
  'menu.kicker': 'Menu / 00', 'menu.tag': 'AI Business OS', 'menu.connect': 'Connect',
  skip: 'Skip to content',
  'hero.idx': 'AI BUSINESS OS / 001',
  'hero.line1': 'Your business has data.',
  'hero.line2': 'OMINO turns it into decisions.',
  'hero.sub': "OMINO brings your store, sales, inventory, customers, payments, marketing and AI into one intelligent business system — so you can see what's happening, understand why, and know what to do next.",
  'hero.micro': 'No credit card required.',
  'hero.fine': 'Founding pricing available to the first 50 businesses.',
  'problem.idx': 'The old way / 002',
  'problem.title': "Your business is connected.<br>Your tools aren't.",
  'problem.sub': 'Your sales live somewhere. Your inventory somewhere else. Your customers somewhere else. Your reports are scattered across different systems. You have the data.',
  'problem.shift': "But the data doesn't talk to each other.",
  'problem.lead': 'That means more manual work, more guessing, and more decisions made without the full picture.',
  'system.idx': 'The OMINO way / 003',
  'problem.caption': 'One business. One system. One clear picture.',
  'system.sub': 'OMINO connects the moving parts of your business into one operating system. Every part works with the others. Not another tool. The system behind your business.',
  'connected.idx': 'Connected by default / 004',
  'connected.title': 'One sale should do more<br>than record a sale.',
  'connected.sub': 'A customer buys.',
  'connected.close': 'Your business keeps moving.<br>OMINO keeps everything connected.',
  'flow.1': 'An order is created.',
  'flow.2': 'Payment is recorded.',
  'flow.3': 'Inventory updates.',
  'flow.4': 'Customer history updates.',
  'flow.5': 'Analytics update.',
  'flow.6': 'Business signals change.',
  'flow.7': 'OMINO identifies what matters next.',
  'business.idx': 'Built around your business / 005',
  'business.title': 'Different businesses.<br>Same clarity.',
  'business.sub': 'Whether you run retail, fashion, beauty, perfume, a café, restaurant, electronics, services, or wholesale — OMINO adapts to how your business actually operates. Because your business is unique. Your operating system should be too.',
  'intel.idx': 'Business intelligence / 006',
  'ai.title': 'Numbers tell you what happened.<br>OMINO helps you understand why.',
  'ai.sub': 'Instead of giving you another dashboard full of numbers, OMINO connects the signals behind your business — and turns them into what happened, why it happened, what deserves attention, and what you can do next.',
  'chat.top': 'Profit analysis',
  'chat.user': 'Why did my profit drop this month?',
  'chat.ai': 'Costs increased.<br>Margins fell on key products.<br>Discounting went up.',
  'chat.1': 'Certain products are carrying more volume with less profit.',
  'chat.rk': "Here's what I would look at next.",
  'chat.rec': "Review margin on your top sellers and tighten discounting where it's eroding profit.",
  'ai.note': 'Your AI should not live outside your business. It should understand it from the inside.',
  'loop.idx': 'The experience / 007',
  'loop.title': 'Everything you need.<br>Nothing you need to fight with.',
  'loop.sub': 'OMINO is designed around the way business owners actually work. See what matters today. Manage orders. Add products. Check inventory. Understand performance. Ask AI. Take action. Everything else stays out of the way until you need it.',
  'loop.tag': 'Simple enough to use every day.<br>Powerful enough to grow with you.',
  'ai.idx': 'AI for your business / 008',
  'ai.agent.title': 'AI that knows your business —<br>not just your question.',
  'ai.agent.sub': 'Ask OMINO anything about your business. It works with your real context — products, orders, customers, inventory, analytics, and operations — to surface the signals behind the change.',
  'ai.ex1': 'Which products are losing margin?',
  'ai.ex2': 'What should I restock this week?',
  'ai.ex3': 'Which customers are becoming inactive?',
  'ai.ex4': 'What changed in my sales this month?',
  'ai.ex5': "Show me where I'm losing money.",
  'ai.agent.note': 'It should understand your business from the inside — not just the question.',
  'control.idx': 'AI with control / 009',
  'control.title': 'Intelligent enough to help.<br>Controlled enough to trust.',
  'control.sub': 'OMINO can identify opportunities, prepare actions, and automate routine work. But important decisions stay yours.',
  'control.1': 'You decide what happens.',
  'control.2': 'No important financial action should happen silently.',
  'control.3': 'You stay in control of your business.',
  'auto.idx': 'Automation / 010',
  'auto.title': 'Let the business handle the routine.',
  'auto.sub': 'When something happens, OMINO can respond.',
  'auto.1': 'Low stock → Flag it.',
  'auto.2': 'New customer → Organize them.',
  'auto.3': 'Order completed → Update their history.',
  'auto.4': 'Payment received → Update the business.',
  'auto.5': 'Customer becoming inactive → Surface the opportunity.',
  'auto.note': 'Automate what should be automatic. Stay in control of what matters.',
  'growth.idx': 'Growth / 011',
  'growth.title': 'Stop guessing what to do next.',
  'growth.sub': "OMINO connects customers, sales, inventory, analytics, marketing, and AI — so growth decisions are based on what is actually happening inside your business. Know what sells. Know who buys. Know what changes. Know where you're losing money. Know where the next opportunity is.",
  'growth.path': 'Customers → Sales → Inventory → Analytics → Marketing → AI',
  'growth.tag': 'Turn business data into better decisions.',
  'commerce.idx': 'One business. Everywhere. / 012',
  'commerce.title': 'Sell online.<br>Sell in-store.<br>Run everything from one place.',
  'commerce.sub': 'Whether a customer buys from your online store, your physical location, or through your sales team, OMINO keeps the business connected. One customer. One order history. One inventory. One source of truth.',
  'commerce.eq': 'ONLINE + IN-STORE<br>=<br>ONE BUSINESS',
  'analytics.idx': 'Analytics / 012',
  'analytics.title': 'A dashboard that tells you something.',
  'analytics.sub': 'See revenue, orders, customers, products, inventory, and performance — then move from numbers to meaning. Less reporting. More understanding.',
  'pricing.idx': 'Plans / 013',
  'pricing.title': 'Start simple.<br>Grow without rebuilding your business.',
  'bill.month': 'Monthly', 'bill.year': 'Yearly', 'bill.per': '/ month', 'bill.perY': '/ month, billed yearly',
  'plan.s.name': 'Run',
  'plan.s.desc': 'For businesses getting started.',
  'plan.s.1': 'Core business tools', 'plan.s.2': 'OMINO Intelligence', 'plan.s.3': 'Essential insights', 'plan.s.cta': 'Start with Run',
  'plan.p.name': 'Grow', 'plan.p.badge': 'Most popular',
  'plan.p.desc': 'For businesses ready for deeper intelligence.',
  'plan.p.1': 'Advanced AI insights', 'plan.p.2': 'Recommendations', 'plan.p.3': 'Forecasting', 'plan.p.4': 'Automation', 'plan.p.cta': 'Start with Grow',
  'plan.b.name': 'Scale',
  'plan.b.desc': 'For businesses operating at greater complexity.',
  'plan.b.1': 'AI Business Agent', 'plan.b.2': 'Advanced intelligence', 'plan.b.3': 'Advanced automation', 'plan.b.4': 'More powerful business capabilities', 'plan.b.cta': 'Start with Scale',
  'founding.title': 'The first 50 businesses build OMINO with us.',
  founding: 'OMINO is being built with real businesses — not just for them. The first 50 businesses become part of the founding group and lock in founding pricing for as long as they remain on OMINO.',
  'founding.tag': '50 businesses. One beginning.',
  'founding.cta': 'Become a founding business',
  'final.title': 'Your business already has the data.',
  'final.sub': 'Now give it a system that understands it. Bring your business together with OMINO.',
  'final.tag': 'One business. One system. One clear picture.',
  'final.brand': 'The intelligent operating system for your business.',
  'fee.title': 'Payments',
  fee: 'Online payments can include a small OMINO platform fee. Transparent pricing. No hidden complexity.',
  'footer.copy': '© 2026 OMINO. All rights reserved.',
  'foot.privacy': 'Privacy', 'foot.terms': 'Terms', 'foot.faq': 'FAQ', 'foot.contact': 'Contact', 'foot.cookies': 'Cookies',
};

const ar = {
  title: 'OMINO — نظام التشغيل الذكي لأعمالك',
  'nav.product': 'المنتج', 'nav.ai': 'AI', 'nav.pricing': 'التسعير', 'nav.about': 'عن OMINO', 'nav.login': 'دخول',
  'cta.start': 'ابدأ مجاناً', 'cta.fit': 'استكشف OMINO', 'cta.see': 'شاهد كيف يعمل OMINO',
  'menu.open': 'فتح القائمة', 'menu.close': 'إغلاق القائمة',
  'menu.kicker': 'Menu / 00', 'menu.tag': 'نظام تشغيل الأعمال', 'menu.connect': 'تواصل',
  skip: 'تخطي إلى المحتوى',
  'hero.idx': 'نظام تشغيل الأعمال بالذكاء الاصطناعي / 001',
  'hero.line1': 'عملك يملك البيانات.',
  'hero.line2': 'OMINO يحوّلها إلى قرارات.',
  'hero.sub': 'OMINO يجمع متجرك، مبيعاتك، مخزونك، عملاءك، مدفوعاتك، تسويقك والذكاء الاصطناعي في نظام أعمال ذكي واحد — لتعرف ما يحدث، وتفهم السبب، وتعرف ماذا تفعل بعد ذلك.',
  'hero.micro': 'لا حاجة لبطاقة ائتمان.',
  'hero.fine': 'تسعير المؤسسين متاح لأول 50 نشاطاً.',
  'problem.idx': 'الطريقة القديمة / 002',
  'problem.title': 'عملك متصل.<br>أدواتك ليست كذلك.',
  'problem.sub': 'مبيعاتك في مكان. مخزونك في مكان آخر. عملاؤك في مكان ثالث. تقاريرك مبعثرة على أنظمة مختلفة. لديك البيانات.',
  'problem.shift': 'لكن البيانات لا تتحدث مع بعضها.',
  'problem.lead': 'هذا يعني عملاً يدوياً أكثر، وتخميناً أكثر، وقرارات بدون الصورة الكاملة.',
  'system.idx': 'طريقة OMINO / 003',
  'problem.caption': 'عمل واحد. نظام واحد. صورة واضحة.',
  'system.sub': 'OMINO يربط أجزاء عملك في نظام تشغيل واحد. كل جزء يعمل مع الآخر. ليس أداة أخرى. النظام الذي يقف خلف عملك.',
  'connected.idx': 'متصل افتراضياً / 004',
  'connected.title': 'البيع الواحد يجب أن يفعل<br>أكثر من تسجيل عملية بيع.',
  'connected.sub': 'العميل يشتري.',
  'connected.close': 'عملك يستمر.<br>OMINO يبقي كل شيء متصلاً.',
  'flow.1': 'يُنشأ الطلب.',
  'flow.2': 'تُسجَّل الدفعة.',
  'flow.3': 'يُحدَّث المخزون.',
  'flow.4': 'يُحدَّث سجل العميل.',
  'flow.5': 'تُحدَّث التحليلات.',
  'flow.6': 'تتغيّر إشارات الأعمال.',
  'flow.7': 'OMINO يحدد ما يستحق الانتباه.',
  'business.idx': 'مصمم حول عملك / 005',
  'business.title': 'أعمال مختلفة.<br>وضوح واحد.',
  'business.sub': 'سواء كنت تدير تجزئة، أزياء، جمال، عطور، مقهى، مطعم، إلكترونيات، خدمات، أو جملة — OMINO يتكيّف مع طريقة عملك الفعلية. لأن عملك فريد. ونظام التشغيل يجب أن يكون كذلك.',
  'intel.idx': 'ذكاء الأعمال / 006',
  'ai.title': 'الأرقام تقول لك ما حدث.<br>OMINO يساعدك تفهم السبب.',
  'ai.sub': 'بدل لوحة تحكم مليئة بالأرقام، OMINO يربط الإشارات وراء عملك — ويحوّلها إلى ما حدث، ولماذا حدث، وما يستحق انتباهك، وماذا يمكنك أن تفعل.',
  'chat.top': 'تحليل الربح',
  'chat.user': 'ليش الربح نزل هذا الشهر؟',
  'chat.ai': 'التكاليف ارتفعت.<br>الهوامش انخفضت على منتجات أساسية.<br>الخصومات زادت.',
  'chat.1': 'بعض المنتجات تحمل حجماً أكبر بهامش أقل.',
  'chat.rk': 'إليك ما أنصحك تراجعه.',
  'chat.rec': 'راجع هامش أكثر منتجاتك مبيعاً وقلّل الخصومات حيث تآكل الربح.',
  'ai.note': 'الذكاء الاصطناعي لا يجب أن يعيش خارج عملك. بل يفهمه من الداخل.',
  'loop.idx': 'التجربة / 007',
  'loop.title': 'كل ما تحتاجه.<br>بدون ما تحارب الواجهة.',
  'loop.sub': 'OMINO مصمم حول طريقة عمل أصحاب الأعمال فعلياً. شاهد ما يهم اليوم. أدر الطلبات. أضف منتجات. راقب المخزون. افهم الأداء. اسأل الذكاء الاصطناعي. نفّذ. والباقي يبقى بعيداً حتى تحتاجه.',
  'loop.tag': 'بسيط بما يكفي للاستخدام اليومي.<br>قوي بما يكفي لينمو معك.',
  'ai.idx': 'الذكاء الاصطناعي لعملك / 008',
  'ai.agent.title': 'ذكاء يعرف عملك —<br>لا سؤالك فقط.',
  'ai.agent.sub': 'اسأل OMINO عن أي شيء في عملك. يعمل مع سياقك الحقيقي — المنتجات، الطلبات، العملاء، المخزون، التحليلات، والعمليات — ليكشف الإشارات وراء التغيير.',
  'ai.ex1': 'أي المنتجات تفقد الهامش؟',
  'ai.ex2': 'ماذا أعيد تخزينه هذا الأسبوع؟',
  'ai.ex3': 'أي العملاء يصبحون غير نشطين؟',
  'ai.ex4': 'ما الذي تغيّر في مبيعاتي هذا الشهر؟',
  'ai.ex5': 'أرني أين أفقد المال.',
  'ai.agent.note': 'يفهم عملك من الداخل — لا السؤال فقط.',
  'control.idx': 'ذكاء بتحكم / 009',
  'control.title': 'ذكي بما يكفي للمساعدة.<br>ومضبوط بما يكفي للثقة.',
  'control.sub': 'OMINO يحدد الفرص، ويجهّز الإجراءات، ويؤتمت الروتين. لكن القرارات المهمة تبقى لك.',
  'control.1': 'أنت تقرر ما يحدث.',
  'control.2': 'لا إجراء مالي مهم يحدث بصمت.',
  'control.3': 'أنت تبقى مسيطراً على عملك.',
  'auto.idx': 'الأتمتة / 010',
  'auto.title': 'دع العمل يتولى الروتين.',
  'auto.sub': 'عندما يحدث شيء، OMINO يمكنه الاستجابة.',
  'auto.1': 'مخزون منخفض ← تنبيه',
  'auto.2': 'عميل جديد ← تنظيم',
  'auto.3': 'طلب مكتمل ← تحديث السجل',
  'auto.4': 'دفعة مستلمة ← تحديث الأعمال',
  'auto.5': 'عميل غير نشط ← فرصة تسويقية',
  'auto.note': 'أتمت ما يجب أتمتته. وابقَ مسيطراً على المهم.',
  'growth.idx': 'النمو / 011',
  'growth.title': 'توقف عن التخمين بماذا تبدأ.',
  'growth.sub': 'OMINO يربط العملاء، المبيعات، المخزون، التحليلات، التسويق، والذكاء الاصطناعي — لتبني قرارات النمو على ما يحدث فعلياً داخل عملك.',
  'growth.path': 'العملاء ← المبيعات ← المخزون ← التحليلات ← التسويق ← AI',
  'growth.tag': 'حوّل بيانات الأعمال إلى قرارات أفضل.',
  'commerce.idx': 'عمل واحد. في كل مكان. / 012',
  'commerce.title': 'بِع أونلاين.<br>بِع من المحل.<br>أدر كل شيء من مكان واحد.',
  'commerce.sub': 'سواء اشترى العميل من متجرك أونلاين، من موقعك، أو عبر فريق المبيعات — OMINO يبقي العمل متصلاً. عميل واحد. سجل طلبات واحد. مخزون واحد. مصدر حقيقة واحد.',
  'commerce.eq': 'أونلاين + المحل<br>=<br>عمل واحد',
  'analytics.idx': 'التحليلات / 012',
  'analytics.title': 'لوحة تحكم تقول لك شيئاً.',
  'analytics.sub': 'شاهد الإيرادات والطلبات والعملاء والمنتجات والمخزون والأداء — ثم انتقل من الأرقام إلى المعنى.',
  'pricing.idx': 'الباقات / 013',
  'pricing.title': 'ابدأ ببساطة.<br>ونمُ دون إعادة بناء عملك.',
  'bill.month': 'شهري', 'bill.year': 'سنوي', 'bill.per': '/ شهر', 'bill.perY': '/ شهر، سنوياً',
  'plan.s.name': 'Run',
  'plan.s.desc': 'للأنشطة التي تبدأ.',
  'plan.s.1': 'أدوات الأعمال الأساسية', 'plan.s.2': 'OMINO Intelligence', 'plan.s.3': 'رؤى أساسية', 'plan.s.cta': 'ابدأ مع Run',
  'plan.p.name': 'Grow', 'plan.p.badge': 'الأكثر شعبية',
  'plan.p.desc': 'للأنشطة الجاهزة لذكاء أعمق.',
  'plan.p.1': 'رؤى ذكاء متقدمة', 'plan.p.2': 'توصيات', 'plan.p.3': 'توقعات', 'plan.p.4': 'أتمتة', 'plan.p.cta': 'ابدأ مع Grow',
  'plan.b.name': 'Scale',
  'plan.b.desc': 'للأنشطة ذات التعقيد الأعلى.',
  'plan.b.1': 'AI Business Agent', 'plan.b.2': 'ذكاء متقدم', 'plan.b.3': 'أتمتة متقدمة', 'plan.b.4': 'قدرات أعمال أقوى', 'plan.b.cta': 'ابدأ مع Scale',
  'founding.title': 'أول 50 نشاطاً يبنون OMINO معنا.',
  founding: 'OMINO يُبنى مع أعمال حقيقية — لا لها فقط. أول 50 نشاطاً يصبحون جزءاً من مجموعة المؤسسين ويثبتون تسعير المؤسسين طالما بقوا على OMINO.',
  'founding.tag': '50 نشاطاً. بداية واحدة.',
  'founding.cta': 'كن من نشاطات المؤسسين',
  'final.title': 'عملك يملك البيانات أصلاً.',
  'final.sub': 'الآن أعطه نظاماً يفهمها. اجمع عملك مع OMINO.',
  'final.tag': 'عمل واحد. نظام واحد. صورة واضحة.',
  'final.brand': 'نظام التشغيل الذكي لأعمالك.',
  'fee.title': 'المدفوعات',
  fee: 'المدفوعات أونلاين قد تتضمن رسوم منصة بسيطة. تسعير شفاف. بدون تعقيد مخفي.',
  'footer.copy': '© 2026 OMINO. All rights reserved.',
  'foot.privacy': 'الخصوصية', 'foot.terms': 'الشروط', 'foot.faq': 'أسئلة', 'foot.contact': 'تواصل', 'foot.cookies': 'الكوكيز',
};

function serializeLocale(obj) {
  const lines = Object.entries(obj).map(([key, value]) => {
    const k = /^[a-z]+$/.test(key) ? key : `'${key}'`;
    return `    ${k}: '${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  });
  return lines.join(',\n');
}

const copyBlock = `const copy = {\n  en: {\n${serializeLocale(en)}\n  },\n  ar: {\n${serializeLocale(ar)}\n  }\n};`;

html = html.replace(/const copy = \{[\s\S]*?\r?\n\};\r?\n\r?\nconst cats =/, `${copyBlock}\r\n\r\nconst cats =`);

// Meta
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  `<meta name="description" content="${en['hero.sub'].replace(/"/g, '&quot;')}">`
);
html = html.replace(
  /<meta property="og:description" content="[^"]*">/,
  `<meta property="og:description" content="${en['hero.sub'].replace(/"/g, '&quot;')}">`
);

// Hero HTML
html = html.replace(
  /<span class="hero-line"><span data-i18n="hero\.line1">[\s\S]*?<\/span><\/span>\s*<span class="hero-line"><span data-i18n="hero\.line2">[\s\S]*?<\/span><\/span>/,
  `<span class="hero-line"><span data-i18n="hero.line1">${en['hero.line1']}</span></span>\n        <span class="hero-line"><span data-i18n="hero.line2">${en['hero.line2']}</span></span>`
);
html = html.replace(/data-i18n="hero\.sub">[\s\S]*?<\/p>\s*<div class="hero-ctas"/, `data-i18n="hero.sub">${en['hero.sub']}</p>\n      <div class="hero-ctas"`);
html = html.replace(/data-i18n="cta\.fit">Explore OMINO<\/a>\s*<\/div>\s*<p class="hero-micro"/, `data-i18n="cta.see">${en['cta.see']}</a>\n      </div>\n      <p class="hero-micro"`);
html = html.replace(/data-i18n="hero\.fine">[\s\S]*?<\/p>/, `data-i18n="hero.fine">${en['hero.fine']}</p>`);

// Problem section
html = html.replace(
  /<p class="section-index idx reveal" data-i18n="problem\.idx">[\s\S]*?<p class="problem-shift reveal" data-i18n="problem\.shift">[\s\S]*?<\/p>\s*<div class="problem-visual">/,
  `<p class="section-index idx reveal" data-i18n="problem.idx">${en['problem.idx']}</p>\n    <h2 class="section-head reveal" data-i18n-html="problem.title">${en['problem.title']}</h2>\n    <p class="section-sub reveal" style="text-align:center;margin-inline:auto;" data-i18n="problem.sub">${en['problem.sub']}</p>\n    <p class="problem-shift reveal" data-i18n="problem.shift">${en['problem.shift']}</p>\n    <p class="problem-lead reveal" data-i18n="problem.lead">${en['problem.lead']}</p>\n    <div class="problem-visual">`
);
html = html.replace(/data-i18n="problem\.connect"/, 'data-i18n="system.idx"');
html = html.replace(/data-i18n="system\.sub">[\s\S]*?<\/p>\s*<div class="frag-row system-chips/, `data-i18n="system.sub">${en['system.sub']}</p>\n      <div class="frag-row system-chips`);

// Connected section
html = html.replace(
  /<section class="section-pad section-flow" id="connected">[\s\S]*?<\/section>\s*<section class="section-pad section-flow" id="business">/,
  `<section class="section-pad section-flow" id="connected">
  <div class="wrap">
    <p class="section-index idx reveal" data-i18n="connected.idx">${en['connected.idx']}</p>
    <h2 class="section-head reveal" data-i18n-html="connected.title">${en['connected.title']}</h2>
    <p class="section-sub reveal" data-i18n="connected.sub">${en['connected.sub']}</p>
    <div class="story-flow reveal">
      <div class="story-step" data-i18n="flow.1">${en['flow.1']}</div>
      <div class="story-step" data-i18n="flow.2">${en['flow.2']}</div>
      <div class="story-step" data-i18n="flow.3">${en['flow.3']}</div>
      <div class="story-step" data-i18n="flow.4">${en['flow.4']}</div>
      <div class="story-step" data-i18n="flow.5">${en['flow.5']}</div>
      <div class="story-step" data-i18n="flow.6">${en['flow.6']}</div>
      <div class="story-step" data-i18n="flow.7">${en['flow.7']}</div>
    </div>
    <p class="section-sub reveal" style="margin-top:32px;" data-i18n-html="connected.close">${en['connected.close']}</p>
  </div>
</section>

<section class="section-pad section-flow" id="business">`
);

// Loop -> experience
html = html.replace(
  /<section class="section-pad section-flow" id="loop">[\s\S]*?<\/section>\s*<section class="band band-center on-dark" id="ai">/,
  `<section class="section-pad section-flow" id="loop">
  <div class="wrap">
    <p class="section-index idx reveal" data-i18n="loop.idx">${en['loop.idx']}</p>
    <h2 class="section-head reveal" data-i18n-html="loop.title">${en['loop.title']}</h2>
    <p class="section-sub reveal" data-i18n="loop.sub">${en['loop.sub']}</p>
    <p class="section-sub reveal" data-i18n-html="loop.tag">${en['loop.tag']}</p>
  </div>
</section>

<section class="band band-center on-dark" id="ai">`
);

// Growth tag
html = html.replace(
  /<p class="section-sub reveal" data-i18n="growth\.path">[\s\S]*?<\/p>\s*<\/div>\s*<\/section>\s*<section class="band band-center on-dark" id="commerce">/,
  `<p class="section-sub reveal" data-i18n="growth.path">${en['growth.path']}</p>
    <p class="section-sub reveal" data-i18n="growth.tag">${en['growth.tag']}</p>
  </div>
</section>

<section class="band band-center on-dark" id="commerce">`
);

// Pricing
html = html.replace(/data-monthly="24"/, 'data-monthly="29"');
html = html.replace(/data-yearly="20">24</, 'data-yearly="24.2">29</');
html = html.replace(/data-monthly="49"/, 'data-monthly="59"');
html = html.replace(/data-yearly="40.8">49</, 'data-yearly="49.2">59</');
html = html.replace(/<div class="plan-tab en">Most popular<\/div>/, `<div class="plan-tab en" data-i18n="plan.p.badge">${en['plan.p.badge']}</div>`);

// Founding + fee + final
html = html.replace(
  /<div class="founding-box">[\s\S]*?<\/div>\s*<div class="fee-note">/,
  `<div class="founding-box">
      <div class="num">50</div>
      <div>
        <h3 data-i18n="founding.title">${en['founding.title']}</h3>
        <p data-i18n="founding">${en.founding}</p>
        <p class="founding-tag" data-i18n="founding.tag">${en['founding.tag']}</p>
        <a href="/signup" class="btn btn-primary" style="margin-top:20px;display:inline-flex;" data-i18n="founding.cta">${en['founding.cta']}</a>
      </div>
    </div>

    <div class="fee-note">`
);
html = html.replace(/<div class="pct">0\.3%–0\.5%<\/div>/, '<div class="pct" aria-hidden="true">—</div>');

html = html.replace(
  /<p class="final-tagline reveal" data-i18n="final\.tag">[\s\S]*?<\/p>\s*<\/div>\s*<\/section>\s*<\/main>/,
  `<p class="final-tagline reveal" data-i18n="final.tag">${en['final.tag']}</p>
    <p class="final-brand reveal" data-i18n="final.brand">${en['final.brand']}</p>
  </div>
</section>
</main>`
);

if (!html.includes('.founding-tag')) {
  html = html.replace(
    '.founding-box p{max-width:420px;font-size:16px;color:var(--stone-2);}',
    '.founding-box p{max-width:420px;font-size:16px;color:var(--stone-2);}\n.founding-tag{font-family:var(--font-display);font-size:clamp(1.1rem,2.2vw,1.35rem);margin-top:16px;color:var(--ink);}\n.final-brand{margin-top:12px;font-size:15px;color:var(--stone);}'
  );
}

html = html.replace('<section class="section-pad section-flow" id="analytics">', '<section class="section-pad section-flow" id="analytics" hidden aria-hidden="true">');

fs.writeFileSync(path, html);
console.log('Landing copy updated successfully.');
