import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://omino.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/main',
    '/main/about.html',
    '/main/faq.html',
    '/main/contact.html',
    '/main/terms.html',
    '/main/privacy.html',
    '/signup',
    '/login',
  ];

  return staticPages.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/main' || path === '' ? 'weekly' : 'monthly',
    priority: path === '/main' || path === '' ? 1 : 0.6,
  }));
}
