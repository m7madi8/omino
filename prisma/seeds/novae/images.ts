/** Curated Unsplash URLs — optimized width, consistent premium direction. */
const q = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const NOVAE_IMAGES = {
  logo: q('1617137968427-85924c800a22', 200),
  favicon: q('1617137968427-85924c800a22', 64),
  hero: q('1490481651871-ab68de25d43d', 1600),
  heroMobile: q('1469334031218-e382a71b716b', 800),
  og: q('1441986300917-64674bd600d8', 1200),
  editorial: q('1445205170230-053b83016050', 1400),
  clothing: [
    q('1594938298603-c8148c4dae35'),
    q('1434389677669-e08b4cac3105'),
    q('1509639273698-1b4d0d44d334'),
    q('1515372039744-b8f02a3ae446'),
    q('1551028719-00167b16eac5'),
    q('1576561605611-3554d7a56fa7'),
    q('1583743814969-8936f5b7be1a'),
    q('1591045898141-c348ac4b3d67'),
    q('1603252109305-0a4b6918d1a8'),
    q('1618354691373-d851c5c3d990'),
  ],
  bags: [
    q('1548039186-4007f3782163'),
    q('1584917865442-89e455e77392'),
    q('1590874103328-eac38a683ce7'),
    q('1622560480601-d63c85430357'),
    q('1591561954557-26941169b49e'),
  ],
  accessories: [
    q('1611595431783-76cc7d2beaff'),
    q('1605100804763-247f67b3557e'),
    q('1523275335684-37898b6baf30'),
    q('1573408301185-9146fe634ad0'),
    q('1572635196237-14b487f03b9c'),
    q('1511499767158-a356aedda4fc'),
  ],
  beauty: [
    q('1556228578-0d85b1a4d571'),
    q('1571781926291-c477ebfd024b'),
    q('1620916566396-39f1143ab7be'),
    q('1608248543801-ba7f8c70b08c'),
    q('1556228720-195a672e8a03'),
    q('1596755094514-f87e34085b2c'),
  ],
  home: [
    q('1514228742584-6b1558fcca3d'),
    q('1602143407151-7111542de6e8'),
    q('1615529328331-f8917597711f'),
    q('1616047006789-d29e68e59b8e'),
    q('1585421514223-223bb299ea3f'),
    q('1616486338812-3fadaa4b325d'),
  ],
  lifestyle: [
    q('1544716278-e513776f20b5'),
    q('1526170375885-4d8ecf77b99f'),
    q('1602143407151-7111542de6e8'),
    q('1553062407-98eeb64c6a62'),
    q('1503602642458-232111445ffd'),
  ],
} as const;

export function pickImages(
  category: keyof typeof NOVAE_IMAGES,
  index: number,
  count = 2
): string[] {
  const pool = NOVAE_IMAGES[category];
  if (!Array.isArray(pool)) return [NOVAE_IMAGES.hero];
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    urls.push(pool[(index + i) % pool.length]!);
  }
  return urls;
}
