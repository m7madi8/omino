import { notFound } from 'next/navigation';
import {
  resolveStoreByPublicSlug,
  toStorefrontStore,
} from '@/server/services/storefront-service';

const POLICY_LABELS: Record<string, string> = {
  shipping: 'Shipping policy',
  returns: 'Returns & refunds',
  privacy: 'Privacy policy',
  terms: 'Terms of service',
};

export default async function StorePolicyPage({
  params,
}: {
  params: Promise<{ storeSlug: string; policy: string }>;
}) {
  const { storeSlug, policy } = await params;

  if (!POLICY_LABELS[policy]) notFound();

  let raw;
  try {
    raw = await resolveStoreByPublicSlug(storeSlug);
  } catch {
    notFound();
  }

  const store = toStorefrontStore(raw);
  const content = store.experience.policies[policy as keyof typeof store.experience.policies];

  if (!content?.trim()) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="font-display text-2xl sf-ink">{POLICY_LABELS[policy]}</h1>
        <p className="mt-4 sf-muted">This policy has not been published yet.</p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] sf-muted mb-2">
          {store.name}
        </p>
        <h1 className="font-display text-3xl sf-ink">{POLICY_LABELS[policy]}</h1>
      </header>
      <div className="prose prose-sm max-w-none sf-ink whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </article>
  );
}
