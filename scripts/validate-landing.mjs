import fs from 'node:fs';

const html = fs.readFileSync('main/index.html', 'utf8');
const start = html.indexOf('const copy = {');
const end = html.indexOf('\nlet lang =', start);
const copy = Function('return ' + html.slice(start + 'const copy = '.length, html.lastIndexOf('};', end) + 1))();

const sectionIds = ['hero', 'problem', 'system', 'connected', 'commerce', 'intelligence', 'ai', 'trust', 'loop', 'business', 'pricing', 'founding', 'final'];
for (const id of sectionIds) {
  if (!html.includes(`id="${id}"`)) console.error('MISSING section:', id);
}

const enMustBeEnglish = ['hero.line1', 'hero.line2', 'problem.shift', 'pricing.title', 'business.markets', 'bill.save'];
const arMustBeArabic = ['hero.line1', 'problem.shift', 'connected.sub', 'flow.1', 'loop.title', 'business.markets'];

for (const key of enMustBeEnglish) {
  const v = copy.en[key] || '';
  if (/[\u0600-\u06FF]/.test(v)) console.error('EN has Arabic:', key, v.slice(0, 40));
}

for (const key of arMustBeArabic) {
  const v = copy.ar[key] || '';
  if (!/[\u0600-\u06FF]/.test(v) && key !== 'flow.1') console.error('AR missing Arabic:', key, v.slice(0, 40));
}

const prices = [...html.matchAll(/data-monthly="(\d+(?:\.\d+)?)"/g)].map((m) => m[1]);
console.log('Sections:', sectionIds.length);
console.log('Prices monthly:', prices.join(', '));
console.log('flow.0 en:', copy.en['flow.0']);
console.log('flow.0 ar:', copy.ar['flow.0']);
console.log('Has flow.0 HTML:', html.includes('data-i18n="flow.0"'));
console.log('Commerce br literal escaped:', html.includes('\\<br>'));
console.log('OK');
