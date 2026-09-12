/**
 * Renders a 1440×1800 premium OMINO campaign poster.
 * The mobile screenshot is composited pixel-perfect — UI is never regenerated.
 *
 * Usage: node scripts/render-omino-s26-poster.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCREENSHOT = join(ROOT, 'main/img/marketing/omino-mobile-hero-screenshot.png');
const OUT = join(ROOT, 'main/img/marketing/omino-s26-ultra-poster-1440x1800.png');

const W = 1440;
const H = 1800;

const screenH = 1220;
const screenW = Math.round(screenH * (333 / 720));
const bezelTop = 18;
const bezelSide = 15;
const bezelBottom = 20;
const frameW = screenW + bezelSide * 2;
const frameH = screenH + bezelTop + bezelBottom;
const phoneX = Math.round((W - frameW) / 2);
const phoneY = Math.round(H * 0.11);
const screenX = phoneX + bezelSide;
const screenY = phoneY + bezelTop;
const screenRadius = 48;
const outerR = 60;

function backgroundSvg() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#121316"/>
      <stop offset="45%" stop-color="#0A0B0D"/>
      <stop offset="100%" stop-color="#050607"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="32%" r="48%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="floor" cx="50%" cy="100%" r="65%">
      <stop offset="0%" stop-color="#1A1C20" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#050607" stop-opacity="0"/>
    </radialGradient>
    <filter id="softBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="36"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#floor)"/>
  <rect width="${W}" height="${H}" fill="url(#spot)"/>
  <ellipse cx="${W * 0.5}" cy="${phoneY + frameH * 0.42}" rx="340" ry="480" fill="#FFFFFF" opacity="0.04" filter="url(#softBlur)"/>
  <path d="M -60 ${H * 0.68} Q ${W * 0.38} ${H * 0.52} ${W + 100} ${H * 0.62}" fill="none" stroke="#FFFFFF" stroke-opacity="0.045" stroke-width="1"/>
  <path d="M ${W * 0.1} ${H * 0.06} C ${W * 0.35} ${H * 0.18}, ${W * 0.62} ${H * 0.04}, ${W * 0.82} ${H * 0.1}" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1.2"/>
  <rect x="${W * 0.07}" y="${H * 0.07}" width="1.5" height="96" fill="#FFFFFF" opacity="0.06"/>
</svg>`;
}

function shadowSvg() {
  const sw = frameW + 160;
  const sh = 110;
  return `<svg width="${sw}" height="${sh}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>
  <ellipse cx="${sw / 2}" cy="${sh / 2}" rx="${sw * 0.36}" ry="32" fill="#000000" opacity="0.42" filter="url(#blur)"/>
</svg>`;
}

/** Titanium shell with transparent screen cutout */
function phoneBodySvg() {
  const ix = bezelSide;
  const iy = bezelTop;
  const iw = screenW;
  const ih = screenH;
  const ir = screenRadius;
  return `<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="titanium" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FAFAFB"/>
      <stop offset="22%" stop-color="#D5D8DD"/>
      <stop offset="50%" stop-color="#F0F1F4"/>
      <stop offset="78%" stop-color="#B4B9C0"/>
      <stop offset="100%" stop-color="#E8EAED"/>
    </linearGradient>
    <filter id="bodyShadow" x="-15%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <path fill-rule="evenodd" filter="url(#bodyShadow)" fill="url(#titanium)" stroke="#A3A8AF" stroke-width="1.15"
    d="M ${outerR} 0 H ${frameW - outerR} Q ${frameW} 0 ${frameW} ${outerR}
       V ${frameH - outerR} Q ${frameW} ${frameH} ${frameW - outerR} ${frameH}
       H ${outerR} Q 0 ${frameH} 0 ${frameH - outerR}
       V ${outerR} Q 0 0 ${outerR} 0 Z
       M ${ix + ir} ${iy}
       H ${ix + iw - ir}
       Q ${ix + iw} ${iy} ${ix + iw} ${iy + ir}
       V ${iy + ih - ir}
       Q ${ix + iw} ${iy + ih} ${ix + iw - ir} ${iy + ih}
       H ${ix + ir}
       Q ${ix} ${iy + ih} ${ix} ${iy + ih - ir}
       V ${iy + ir}
       Q ${ix} ${iy} ${ix + ir} ${iy} Z"/>
</svg>`;
}

/** Bezel ring, punch-hole, keys, glass — drawn over the screenshot */
function phoneOverlaySvg() {
  const cx = frameW / 2;
  const holeY = bezelTop * 0.52;
  const ix = bezelSide;
  const iy = bezelTop;
  return `<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="edgeHi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
      <stop offset="10%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="90%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.07"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.18"/>
      <stop offset="28%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="screenClip">
      <rect x="${ix}" y="${iy}" width="${screenW}" height="${screenH}" rx="${screenRadius}" ry="${screenRadius}"/>
    </clipPath>
  </defs>
  <!-- inner bezel ring -->
  <rect x="${ix - 1}" y="${iy - 1}" width="${screenW + 2}" height="${screenH + 2}" rx="${screenRadius + 1}" ry="${screenRadius + 1}" fill="none" stroke="#050607" stroke-width="2.5"/>
  <!-- glass sheen on screen -->
  <rect x="${ix}" y="${iy}" width="${screenW}" height="${screenH}" rx="${screenRadius}" ry="${screenRadius}" fill="url(#glass)" clip-path="url(#screenClip)"/>
  <!-- body edge highlight -->
  <rect x="0" y="0" width="${frameW}" height="${frameH}" rx="${outerR}" ry="${outerR}" fill="url(#edgeHi)"/>
  <!-- punch-hole -->
  <circle cx="${cx}" cy="${holeY}" r="8" fill="#040506"/>
  <circle cx="${cx}" cy="${holeY}" r="5.5" fill="#0E1012"/>
  <circle cx="${cx - 1.3}" cy="${holeY - 1.3}" r="1.5" fill="#40464D" opacity="0.5"/>
  <!-- hardware keys -->
  <rect x="${frameW - 1.8}" y="${frameH * 0.23}" width="3" height="48" rx="1.4" fill="#C2C7CD"/>
  <rect x="${frameW - 1.8}" y="${frameH * 0.35}" width="3" height="76" rx="1.4" fill="#C2C7CD"/>
  <rect x="-1.2" y="${frameH * 0.29}" width="3" height="62" rx="1.4" fill="#C2C7CD"/>
</svg>`;
}

function brandingSvg() {
  return `<svg width="460" height="84" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="36" fill="#F4F5F6" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="7">OMINO</text>
  <text x="1" y="66" fill="#8B9096" font-family="Arial, Helvetica, sans-serif" font-size="15.5" letter-spacing="0.15">Your business. One intelligence.</text>
  </svg>`;
}

async function prepareScreen() {
  const mask = Buffer.from(
    `<svg width="${screenW}" height="${screenH}"><rect width="${screenW}" height="${screenH}" rx="${screenRadius}" ry="${screenRadius}" fill="#fff"/></svg>`
  );
  return sharp(readFileSync(SCREENSHOT))
    .resize(screenW, screenH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .png()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function floorReflection(screenBuffer, bodyBuffer) {
  const refH = Math.round(frameH * 0.22);
  const refW = frameW;
  const phoneGroup = await sharp({
    create: { width: frameW, height: frameH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: bodyBuffer, left: 0, top: 0 },
      { input: screenBuffer, left: bezelSide, top: bezelTop },
    ])
    .png()
    .toBuffer();

  const fade = Buffer.from(
    `<svg width="${refW}" height="${refH}"><defs>
      <linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0.09"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </linearGradient></defs>
      <rect width="${refW}" height="${refH}" fill="url(#f)"/></svg>`
  );

  return sharp(phoneGroup)
    .extract({ left: 0, top: frameH - refH - 40, width: refW, height: refH })
    .flip()
    .resize(refW, refH, { fit: 'fill' })
    .png()
    .composite([{ input: fade, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function main() {
  const [bg, shadow, body, overlay, brand, screenBuffer] = await Promise.all([
    sharp(Buffer.from(backgroundSvg())).png().toBuffer(),
    sharp(Buffer.from(shadowSvg())).png().toBuffer(),
    sharp(Buffer.from(phoneBodySvg())).png().toBuffer(),
    sharp(Buffer.from(phoneOverlaySvg())).png().toBuffer(),
    sharp(Buffer.from(brandingSvg())).png().toBuffer(),
    prepareScreen(),
  ]);

  const reflection = await floorReflection(screenBuffer, body);
  const shadowLeft = phoneX + Math.round((frameW - (frameW + 160)) / 2);
  const shadowTop = phoneY + frameH + 4;
  const refTop = phoneY + frameH + 18;

  await sharp(bg)
    .composite([
      { input: shadow, left: shadowLeft, top: shadowTop },
      { input: reflection, left: phoneX, top: refTop, blend: 'over' },
      { input: body, left: phoneX, top: phoneY },
      { input: screenBuffer, left: screenX, top: screenY },
      { input: overlay, left: phoneX, top: phoneY },
      { input: brand, left: 92, top: H - 152 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  console.log(`Poster saved: ${OUT}`);
  console.log(`${W}×${H}px · UI preserved at ${screenW}×${screenH}px`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
