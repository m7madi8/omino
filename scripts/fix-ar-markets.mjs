import fs from 'fs';
const p = 'main/index.html';
let h = fs.readFileSync(p, 'utf8');
const keys = ['تجزئة', 'أزياء', 'جمال', 'عطور', 'مقاهi', 'مطاعm', 'إلكترونيات', 'خدمات', 'جملة'];
// Pull exact labels from ar cats block
const arCats = h.match(/ar: \{([\s\S]*?)\n  \}/);
if (arCats) {
  const found = [...arCats[1].matchAll(/^\s+'([^']+)':\[/gm)].map((x) => x[1]);
  if (found.length === 9) {
    keys.splice(0, found.length, ...found);
  }
}
const markets = keys.join(' · ');
h = h.replace(/    'business\.markets': ''\r?\n    'bill\.save':/, `    'business.markets': '${markets}',\n    'bill.save':`);
fs.writeFileSync(p, h);
console.log(markets);
