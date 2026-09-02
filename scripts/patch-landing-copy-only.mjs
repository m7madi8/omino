import fs from 'fs';

const path = 'D:/projects/OMINO/main/index.html';
const patchPath = 'D:/projects/OMINO/scripts/patch-landing-copy.mjs';
const patchSrc = fs.readFileSync(patchPath, 'utf8');

// Extract en/ar objects from patch script via eval in isolated function
const enStart = patchSrc.indexOf('const en = {');
const arStart = patchSrc.indexOf('const ar = {');
const enEnd = patchSrc.indexOf('const ar = {');
const arEnd = patchSrc.indexOf('function serializeLocale');
const enFn = new Function(patchSrc.slice(enStart, enEnd) + 'return en;');
const arFn = new Function(patchSrc.slice(arStart, arEnd) + 'return ar;');
const en = enFn();
const ar = arFn();

function serializeLocale(obj) {
  return Object.entries(obj)
    .map(([key, value]) => {
      const k = /^[a-z]+$/.test(key) ? key : `'${key}'`;
      return `    ${k}: '${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    })
    .join(',\n');
}

const copyBlock = `const copy = {\n  en: {\n${serializeLocale(en)}\n  },\n  ar: {\n${serializeLocale(ar)}\n  }\n};`;

let html = fs.readFileSync(path, 'utf8');
const start = html.indexOf('const copy = {');
const end = html.indexOf('const cats =', start);
if (start === -1 || end === -1) throw new Error('copy block not found');
html = html.slice(0, start) + copyBlock + '\r\n\r\n' + html.slice(end);
fs.writeFileSync(path, html);
console.log('Copy block replaced.');
