import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.join(path.resolve(import.meta.dirname, '..'), 'main/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

function patchLocaleBlock(locale, endMarker, fixes) {
  const start = html.indexOf(`${locale}: {`);
  const end = html.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`block ${locale} not found`);
  let block = html.slice(start, end);
  for (const [key, value] of Object.entries(fixes)) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const re = new RegExp(`('${key.replace(/\./g, '\\.')}':\\s*)'(?:[^'\\\\]|\\\\.)*'`);
    if (re.test(block)) {
      block = block.replace(re, `$1'${escaped}'`);
    } else if (key === 'flow.0') {
      block = block.replace(
        "'connected.close': '',\n",
        `'connected.close': '',\n    'flow.0': '${escaped}',\n`
      );
    } else {
      throw new Error(`[${locale}] missing key ${key}`);
    }
  }
  html = html.slice(0, start) + block + html.slice(end);
}

patchLocaleBlock('en', '  ar: {', {
  'hero.line1': 'Your business has data.',
  'hero.line2': 'OMINO turns it into decisions.',
  'hero.sub': 'One intelligent system for store, sales, inventory, customers, payments, and AI — so you see what matters and know what to do next.',
  'pricing.title': 'Start simple.<br>Grow without rebuilding your business.',
  'pricing.note': 'Shopify Basic is ~$39/mo before apps and POS add-ons. OMINO Run includes store, POS, inventory, and intelligence from $9.',
  'bill.save': 'Save 2 mo',
  'business.markets': 'Retail · Fashion · Beauty · Perfume · Cafés · Restaurants · Electronics · Services · Wholesale',
});

patchLocaleBlock('ar', '\nlet lang =', {
  'problem.shift': 'البيانات لا تتحدث. عمل يدوي أكثر. تخمين أكثر.',
  'connected.sub': 'العميل يشتري — والعمل كله يستجيب.',
  'flow.0': 'العميل يشتري',
  'flow.1': 'يُنشأ الطلب',
  'flow.2': 'تُسجَّل الدفعة',
  'flow.3': 'يُحدَّث المخزون',
  'flow.4': 'يُحدَّث سجل العميل',
  'flow.5': 'تُحدَّث التحليلات',
  'flow.7': 'OMINO يُبرز ما يهم',
  'business.idx': 'مصمم حول عملك / 010',
  'business.sub': 'منصة واحدة تتكيّف مع طريقة عملك الفعلية.',
  'intel.idx': 'ذكاء الأعمال / 006',
  'ai.title': 'الأرقام تقول لك ما حدث.<br>OMINO يساعدك تفهم السبب.',
  'ai.sub': 'اربط الإشارات وراء عملك — من ما حدث إلى لماذا حدث، وما يهم، وماذا تفعل.',
  'chat.ai': 'التكاليف ارتفعت.<br>الهوامش انخفضت على منتجات أساسية.<br>الخصومات زادت.',
  'chat.1': 'بعض المنتجات تحمل حجماً أكبر بهامش أقل.',
  'chat.rk': 'إليك ما أنصحك تراجعه.',
  'chat.rec': 'راجع هامش أكثر منتجاتك مبيعاً وقلّل الخصومات حيث تآكل الربح.',
  'loop.idx': 'التجربة / 009',
  'loop.title': 'بسيط بما يكفي للاستخدام اليومي.<br>قوي بما يكفي لينمو معك.',
  'loop.sub': 'الواجهة تبقى بعيدة حتى تحتاجها.',
  'ai.idx': 'الذكاء الاصطناعي لعملك / 007',
  'ai.agent.title': 'ذكاء يعرف عملك —<br>لا سؤالك فقط.',
  'ai.agent.sub': 'اسأل عن المنتجات، الطلبات، العملاء، المخزون، والأداء — بسياق عملك الحقيقي.',
  'commerce.idx': 'عمل واحد. في كل مكان. / 005',
  'commerce.sub': 'متجر أونلاين، موقع فعلي، وفريق مبيعات — عميل واحد، سجل طلبات واحد، مخزون واحد.',
});

// Add flow.0 to en if missing
if (!html.includes("'flow.0':")) {
  html = html.replace(
    /(en:[\s\S]*?'connected\.close': '',\n)/,
    "$1    'flow.0': 'Customer buys',\n"
  );
  html = html.replace(
    /(ar:[\s\S]*?'connected\.close': '',\n)/,
    "$1    'flow.0': 'العميل يشتري',\n"
  );
}

// Remove duplicate bill.save in en block
html = html.replace(
  /(en:[\s\S]*?'loop\.p6': 'Action',\n)\s*'business\.markets':[^']*',\n\s*'bill\.save': '[^']*',\n/,
  "$1    'business.markets': 'Retail · Fashion · Beauty · Perfume · Cafés · Restaurants · Electronics · Services · Wholesale',\n"
);

if (!html.includes('data-i18n="flow.0"')) {
  html = html.replace(
    '<div class="sys-flow reveal" aria-label="Sale flow">\n        <div class="sys-flow-step" data-i18n="flow.1">',
    '<div class="sys-flow reveal" aria-label="Sale flow">\n        <div class="sys-flow-step" data-i18n="flow.0">Customer buys</div>\n        <div class="sys-flow-arrow" aria-hidden="true">↓</div>\n        <div class="sys-flow-step" data-i18n="flow.1">'
  );
}

// Ensure flow.0 exists in en block after connected.close
if (!/en:[\s\S]*'flow\.0':/.test(html)) {
  html = html.replace(
    "'connected.close': '',\n    'flow.1': 'Order created',",
    "'connected.close': '',\n    'flow.0': 'Customer buys',\n    'flow.1': 'Order created',"
  );
}
if (!/ar:[\s\S]*'flow\.0':/.test(html)) {
  html = html.replace(
    /('connected\.close': '',\n    'flow\.1': 'يُنشأ الطلب',)/,
    "'connected.close': '',\n    'flow.0': 'العميل يشتري',\n    'flow.1': 'يُنشأ الطلب',"
  );
}

fs.writeFileSync(indexPath, html);
console.log('Locale blocks patched');
