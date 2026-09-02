import fs from 'fs';

const path = 'main/index.html';
let html = fs.readFileSync(path, 'utf8');

const enPatch = {
  'hero.line1': 'Your business has data.',
  'hero.line2': 'OMINO turns it into decisions.',
  'hero.sub': 'One intelligent system for store, sales, inventory, customers, payments, and AI — so you see what matters and know what to do next.',
  'problem.shift': 'The data doesn\'t talk. More manual work. More guessing.',
  'problem.sub': '',
  'connected.sub': 'A customer buys — and the whole business responds.',
  'flow.1': 'Order created',
  'flow.2': 'Payment recorded',
  'flow.3': 'Inventory updated',
  'flow.4': 'Customer history updated',
  'flow.5': 'Analytics updated',
  'flow.7': 'OMINO surfaces what matters next',
  'connected.close': '',
  'commerce.idx': 'One business. Everywhere. / 005',
  'commerce.sub': 'Online store, physical location, and sales team — one customer, one order history, one inventory.',
  'commerce.t1': 'One customer',
  'commerce.t2': 'One order history',
  'commerce.t3': 'One inventory',
  'commerce.t4': 'One source of truth',
  'intel.idx': 'Business intelligence / 006',
  'ai.title': 'Numbers tell you what happened.<br>OMINO helps you understand why.',
  'ai.sub': 'Connect the signals behind your business — then move from what happened to why it happened, what matters, and what to do next.',
  'intel.old.k': 'Traditional analytics',
  'intel.old.v': 'What happened?',
  'intel.new.v': 'What happened?<br>Why?<br>What matters?<br>What next?',
  'chat.ai': 'Costs increased.<br>Margins fell on key products.<br>Discounting went up.',
  'chat.1': 'Certain products carry more volume with less profit.',
  'chat.rk': 'Here\'s what I would look at next.',
  'chat.rec': 'Review margin on top sellers and tighten discounting where it\'s eroding profit.',
  'ai.idx': 'AI for your business / 007',
  'ai.agent.title': 'AI that knows your business —<br>not just your question.',
  'ai.agent.sub': 'Ask about products, orders, customers, inventory, and performance — with your real business context.',
  'ai.role.user': 'You',
  'ai.demo.answer': '3 products are generating volume but reducing overall margin. Two are high-discount items. One has rising supplier cost.',
  'trust.idx': 'Automation + control / 008',
  'trust.title': 'Intelligent enough to help.<br>Controlled enough to trust.',
  'trust.sub': 'OMINO can detect, recommend, prepare actions, and automate routine work. Important decisions stay yours.',
  'trust.1': 'Nothing important happens without your approval.',
  'trust.2': 'Refunds, inventory adjustments, and financial actions require confirmation.',
  'trust.3': 'You see what changed, who approved it, and why.',
  'auto.r1.k': 'Event', 'auto.r1.e': 'Low stock detected', 'auto.r1.a': 'OMINO action', 'auto.r1.act': 'Flag product', 'auto.r1.o': 'Outcome', 'auto.r1.out': 'Restock before lost sales',
  'auto.r2.k': 'Event', 'auto.r2.e': 'New customer', 'auto.r2.a': 'OMINO action', 'auto.r2.act': 'Organize segment', 'auto.r2.o': 'Outcome', 'auto.r2.out': 'Ready for follow-up',
  'auto.r3.k': 'Event', 'auto.r3.e': 'Order completed', 'auto.r3.a': 'OMINO action', 'auto.r3.act': 'Update history', 'auto.r3.o': 'Outcome', 'auto.r3.out': 'Customer record stays current',
  'loop.idx': 'The experience / 009',
  'loop.title': 'Simple enough to use every day.<br>Powerful enough to grow with you.',
  'loop.sub': 'The interface stays out of the way until you need it.',
  'loop.p1': 'Today', 'loop.p2': 'Orders', 'loop.p3': 'Products', 'loop.p4': 'Inventory', 'loop.p5': 'AI', 'loop.p6': 'Action',
  'business.idx': 'Built around your business / 010',
  'business.sub': 'One platform that adapts to how you actually operate.',
  'business.markets': 'Retail · Fashion · Beauty · Perfume · Cafés · Restaurants · Electronics · Services · Wholesale',
  'pricing.idx': 'Plans / 011',
  'bill.save': 'Save 2 mo',
  'final.tag': 'One business. One system. One clear picture.',
};

const arPatch = {
  'problem.shift': 'البيانات لا تتحدث. عمل يدوي أكثر. تخمين أكثر.',
  'problem.sub': '',
  'connected.sub': 'العميل يشتري — والعمل كله يستجيب.',
  'flow.1': 'يُنشأ الطلب',
  'flow.2': 'تُسجَّل الدفعة',
  'flow.3': 'يُحدَّث المخزون',
  'flow.4': 'يُحدَّث سجل العميل',
  'flow.5': 'تُحدَّث التحليلات',
  'flow.7': 'OMINO يُبرز ما يهم',
  'connected.close': '',
  'commerce.idx': 'عمل واحد. في كل مكان. / 005',
  'commerce.sub': 'متجر أونلاين، موقع فعلي، وفريق مبيعات — عميل واحد، سجل طلبات واحد، مخزون واحد.',
  'commerce.t1': 'عميل واحد',
  'commerce.t2': 'سجل طلبات واحد',
  'commerce.t3': 'مخزون واحد',
  'commerce.t4': 'مصدر حقيقة واحد',
  'intel.idx': 'ذكاء الأعمال / 006',
  'ai.title': 'الأرقام تقول لك ما حدث.<br>OMINO يساعدك تفهم السبب.',
  'ai.sub': 'اربط الإشارات وراء عملك — من ما حدث إلى لماذا حدث، وما يهم، وماذا تفعل.',
  'intel.old.k': 'التحليلات التقليدية',
  'intel.old.v': 'ماذا حدث؟',
  'intel.new.v': 'ماذا حدث؟<br>لماذا؟<br>ما يهم؟<br>ماذا بعد؟',
  'chat.ai': 'التكاليف ارتفعت.<br>الهوامش انخفضت على منتجات أساسية.<br>الخصومات زادت.',
  'chat.1': 'بعض المنتجات تحمل حجماً أكبر بهامش أقل.',
  'chat.rk': 'إليك ما أنصحك تراجعه.',
  'chat.rec': 'راجع هامش أكثر منتجاتك مبيعاً وقلّل الخصومات حيث تآكل الربح.',
  'ai.idx': 'الذكاء الاصطناعي لعملك / 007',
  'ai.agent.title': 'ذكاء يعرف عملك —<br>لا سؤالك فقط.',
  'ai.agent.sub': 'اسأل عن المنتجات، الطلبات، العملاء، المخزون، والأداء — بسياق عملك الحقيقي.',
  'ai.role.user': 'أنت',
  'ai.demo.answer': '3 منتجات تولّد حجماً لكن تقلّل الهامش الإجمالي. اثنان عليهم خصومات عالية. واحد تكلفته من المورد ارتفعت.',
  'trust.idx': 'الأتمتة + التحكم / 008',
  'trust.title': 'ذكي بما يكفي للمساعدة.<br>ومضبوط بما يكفي للثقة.',
  'trust.sub': 'OMINO يكتشف، يوصي، يجهّز الإجراءات، ويؤتمت الروتين. القرارات المهمة تبقى لك.',
  'trust.1': 'لا شيء مهم يحدث بدون موافقتك.',
  'trust.2': 'المبالغ المستردة وتعديلات المخزون والإجراءات المالية تحتاج تأكيداً.',
  'trust.3': 'ترى ما تغيّر، ومن وافق، ولماذا.',
  'auto.r1.k': 'حدث', 'auto.r1.e': 'مخزون منخفض', 'auto.r1.a': 'إجراء OMINO', 'auto.r1.act': 'تنبيه المنتج', 'auto.r1.o': 'النتيجة', 'auto.r1.out': 'إعادة تخزين قبل خسارة مبيعات',
  'auto.r2.k': 'حدث', 'auto.r2.e': 'عميل جديد', 'auto.r2.a': 'إجراء OMINO', 'auto.r2.act': 'تنظيم الشريحة', 'auto.r2.o': 'النتيجة', 'auto.r2.out': 'جاهز للمتابعة',
  'auto.r3.k': 'حدث', 'auto.r3.e': 'طلب مكتمل', 'auto.r3.a': 'إجراء OMINO', 'auto.r3.act': 'تحديث السجل', 'auto.r3.o': 'النتيجة', 'auto.r3.out': 'سجل العميل يبقى محدّثاً',
  'loop.idx': 'التجربة / 009',
  'loop.title': 'بسيط بما يكفي للاستخدام اليومي.<br>قوي بما يكفي لينمو معك.',
  'loop.sub': 'الواجهة تبقى بعيدة حتى تحتاجها.',
  'loop.p1': 'اليوم', 'loop.p2': 'الطلبات', 'loop.p3': 'المنتجات', 'loop.p4': 'المخزون', 'loop.p5': 'AI', 'loop.p6': 'إجراء',
  'business.idx': 'مصمم حول عملك / 010',
  'business.sub': 'منصة واحدة تتكيّف مع طريقة عملك الفعلية.',
  'business.markets': 'تجزئة · أزياء · جمال · عطور · مقاهي · مطاعم · إلكترونيات · خدمات · جملة',
  'pricing.idx': 'الباقات / 011',
  'bill.save': 'شهران مجاناً',
};

function patchLocale(locale, patch) {
  for (const [key, val] of Object.entries(patch)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`('${escaped}': )'(?:\\\\'|[^'])*'`, 'g');
    const safe = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    if (!re.test(html)) {
      // insert before closing of locale block - skip if new key
      continue;
    }
    html = html.replace(re, `$1'${safe}'`);
  }
}

patchLocale('en', enPatch);
patchLocale('ar', arPatch);

// Insert missing keys into en copy before closing brace of en
const insertEn = `
    'commerce.t1': 'One customer',
    'commerce.t2': 'One order history',
    'commerce.t3': 'One inventory',
    'commerce.t4': 'One source of truth',
    'intel.old.k': 'Traditional analytics',
    'intel.old.v': 'What happened?',
    'intel.new.v': 'What happened?<br>Why?<br>What matters?<br>What next?',
    'ai.role.user': 'You',
    'ai.demo.answer': '3 products are generating volume but reducing overall margin. Two are high-discount items. One has rising supplier cost.',
    'trust.idx': 'Automation + control / 008',
    'trust.title': 'Intelligent enough to help.<br>Controlled enough to trust.',
    'trust.sub': 'OMINO can detect, recommend, prepare actions, and automate routine work. Important decisions stay yours.',
    'trust.1': 'Nothing important happens without your approval.',
    'trust.2': 'Refunds, inventory adjustments, and financial actions require confirmation.',
    'trust.3': 'You see what changed, who approved it, and why.',
    'auto.r1.k': 'Event', 'auto.r1.e': 'Low stock detected', 'auto.r1.a': 'OMINO action', 'auto.r1.act': 'Flag product', 'auto.r1.o': 'Outcome', 'auto.r1.out': 'Restock before lost sales',
    'auto.r2.k': 'Event', 'auto.r2.e': 'New customer', 'auto.r2.a': 'OMINO action', 'auto.r2.act': 'Organize segment', 'auto.r2.o': 'Outcome', 'auto.r2.out': 'Ready for follow-up',
    'auto.r3.k': 'Event', 'auto.r3.e': 'Order completed', 'auto.r3.a': 'OMINO action', 'auto.r3.act': 'Update history', 'auto.r3.o': 'Outcome', 'auto.r3.out': 'Customer record stays current',
    'loop.p1': 'Today', 'loop.p2': 'Orders', 'loop.p3': 'Products', 'loop.p4': 'Inventory', 'loop.p5': 'AI', 'loop.p6': 'Action',
    'business.markets': 'Retail · Fashion · Beauty · Perfume · Cafés · Restaurants · Electronics · Services · Wholesale',
    'bill.save': 'Save 2 mo',`;

if (!html.includes("'commerce.t1'")) {
  html = html.replace(/('fee\.title': 'Payments',)/, insertEn + '\n    $1');
}

const insertAr = `
    'commerce.t1': 'عميل واحد',
    'commerce.t2': 'سجل طلبات واحد',
    'commerce.t3': 'مخزون واحد',
    'commerce.t4': 'مصدر حقيقة واحد',
    'intel.old.k': 'التحليلات التقليدية',
    'intel.old.v': 'ماذا حدث؟',
    'intel.new.v': 'ماذا حدث؟<br>لماذا؟<br>ما يهم؟<br>ماذا بعد؟',
    'ai.role.user': 'أنت',
    'ai.demo.answer': '3 منتجات تولّد حجماً لكن تقلّل الهامش الإجمالي. اثنان عليهم خصومات عالية. واحد تكلفته من المورد ارتفعت.',
    'trust.idx': 'الأتمتة + التحكم / 008',
    'trust.title': 'ذكي بما يكفي للمساعدة.<br>ومضبوط بما يكفي للثقة.',
    'trust.sub': 'OMINO يكتشف، يوصي، يجهّز الإجراءات، ويؤتمت الروتين. القرارات المهمة تبقى لك.',
    'trust.1': 'لا شيء مهم يحدث بدون موافقتك.',
    'trust.2': 'المبالغ المستردة وتعديلات المخزون والإجراءات المالية تحتاج تأكيداً.',
    'trust.3': 'ترى ما تغيّر، ومن وافق، ولماذا.',
    'auto.r1.k': 'حدث', 'auto.r1.e': 'مخزون منخفض', 'auto.r1.a': 'إجراء OMINO', 'auto.r1.act': 'تنبيه المنتج', 'auto.r1.o': 'النتيجة', 'auto.r1.out': 'إعادة تخزين قبل خسارة مبيعات',
    'auto.r2.k': 'حدث', 'auto.r2.e': 'عميل جديد', 'auto.r2.a': 'إجراء OMINO', 'auto.r2.act': 'تنظيم الشريحة', 'auto.r2.o': 'النتيجة', 'auto.r2.out': 'جاهز للمتابعة',
    'auto.r3.k': 'حدث', 'auto.r3.e': 'طلب مكتمل', 'auto.r3.a': 'إجراء OMINO', 'auto.r3.act': 'تحديث السجل', 'auto.r3.o': 'النتيجة', 'auto.r3.out': 'سجل العميل يبقى محدّثاً',
    'loop.p1': 'اليوم', 'loop.p2': 'الطلبات', 'loop.p3': 'المنتجات', 'loop.p4': 'المخزون', 'loop.p5': 'AI', 'loop.p6': 'إجراء',
    'business.markets': 'تجزئة · أزياء · جمال · عطور · مقاهي · مطاعم · إلكترونيات · خدمات · جملة',
    'bill.save': 'شهران مجاناً',`;

if (!html.includes("'trust.idx'")) {
  html = html.replace(/(ar: \{[\s\S]*?'fee\.title': 'المدفوعات',)/, (m) => m.replace("'fee.title': 'المدفوعات',", insertAr + "\n    'fee.title': 'المدفوعات',"));
}

fs.writeFileSync(path, html);
console.log('[patch-landing-copy-polish] done');
