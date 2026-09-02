/** Optional social handles/URLs stored in Store.socialLinks JSON */
export type StoreSocialLinks = {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  whatsapp?: string | null;
};

export type ResolvedContactLink = {
  id: string;
  label: string;
  href: string;
};
