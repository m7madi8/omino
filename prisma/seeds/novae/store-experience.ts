import type { StoreExperienceDocument } from '@/types/store-experience';
import { NOVAE_IMAGES } from './images';

export function buildNovaeStoreExperience(): StoreExperienceDocument {
  const config = {
    hero: {
      enabled: true,
      layout: 'split' as const,
      eyebrow: 'نوفاي · NOVAÉ',
      title: 'أشياء تحب أن تعيش معها.',
      description:
        'Contemporary essentials, curated for everyday life. اختيارات عصرية صُممت لترافق تفاصيل يومك.',
      primaryCta: { label: 'تسوق الآن', href: '/products' },
      secondaryCta: { label: 'اكتشف المجموعة', href: '/collections/new-season' },
      imageUrl: NOVAE_IMAGES.hero,
      mobileImageUrl: NOVAE_IMAGES.heroMobile,
      imagePosition: 'right' as const,
      imageFit: 'cover' as const,
      overlay: false,
      alignment: 'left' as const,
    },
    announcement: {
      enabled: true,
      message: 'شحن مجاني للطلبات فوق ₪250',
      link: '/products',
      linkLabel: 'تسوق الآن',
      dismissible: true,
      backgroundColor: '#1A1A1A',
      textColor: '#F7F3ED',
    },
    appearance: {
      themeId: 'noir' as const,
      themeVersion: '1.0.0',
      preset: 'editorial' as const,
      styleId: 'editorial' as const,
      layoutId: 'editorial' as const,
      typography: 'editorial' as const,
      radius: 'none' as const,
      spacing: 'balanced' as const,
    },
    sections: [
      { id: 'hero', type: 'hero' as const, enabled: true, config: {} },
      {
        id: 'featured-products',
        type: 'featured-products' as const,
        enabled: true,
        config: { title: 'مختارات نوفاي', subtitle: 'Featured edit' },
      },
      {
        id: 'category-showcase',
        type: 'category-showcase' as const,
        enabled: true,
        config: { title: 'تسوق حسب الفئة', subtitle: 'Shop by category' },
      },
      {
        id: 'featured-collection',
        type: 'featured-collection' as const,
        enabled: true,
        config: { collectionSlug: 'new-season', title: 'الموسم الجديد' },
      },
      {
        id: 'promo-banner',
        type: 'promotional-banner' as const,
        enabled: true,
        config: {
          title: 'مجموعة الهدايا',
          description: 'هدايا مدروسة لكل مناسبة — من ₪69',
          ctaLabel: 'اكتشف الهدايا',
          ctaHref: '/collections/gifts',
        },
      },
      {
        id: 'brand-story',
        type: 'brand-story' as const,
        enabled: true,
        config: {
          title: 'قصتنا',
          body: 'نوفاي ولدت من إيمان بأن الأشياء اليومية يمكن أن تكون جميلة وعملية في آن واحد. نختار كل قطعة بعناية — من الملابس إلى الجمال إلى أسلوب الحياة — لتبقى معك سنوات.',
        },
      },
      {
        id: 'editorial',
        type: 'rich-text' as const,
        enabled: true,
        config: {
          content:
            'NOVAÉ is a contemporary lifestyle brand for the Palestinian and MENA market — premium without pretense, editorial without excess.',
        },
      },
      {
        id: 'newsletter',
        type: 'newsletter' as const,
        enabled: true,
        config: {
          title: 'ابق على تواصل',
          description: 'كن أول من يعرف عن الوصول الجديد والعروض الحصرية.',
        },
      },
    ],
    seo: {
      title: 'NOVAÉ — Contemporary Essentials | نوفاي',
      description:
        'اكتشف اختيارات نوفاي العصرية من الملابس والإكسسوارات والجمال وأسلوب الحياة. Contemporary essentials, curated for everyday life.',
      ogImageUrl: NOVAE_IMAGES.og,
      indexable: true,
    },
    policies: {
      shipping:
        'نوصل لجميع مدن الضفة الغربية. الشحن المجاني للطلبات فوق ₪250. التوصيل خلال 1-3 أيام عمل.',
      returns: 'يمكنك إرجاع المنتجات خلال 14 يوماً من الاستلام بشرط أن تكون بحالتها الأصلية.',
      privacy: 'نحترم خصوصيتك. لا نشارك بياناتك مع أطراف ثالثة دون موافقتك.',
      terms: 'باستخدام متجر نوفاي، فإنك توافق على شروط الخدمة وسياسة الإرجاع.',
    },
  };

  const now = new Date().toISOString();
  return {
    version: 2,
    publishedAt: now,
    live: structuredClone(config),
    draft: structuredClone(config),
  };
}
