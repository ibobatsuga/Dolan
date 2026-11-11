import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PROVINCES, getProvinceBySlug } from '@/lib/data/provinces';
import { MarketplaceHome } from '@/components/MarketplaceHome';

export function generateStaticParams() {
  return PROVINCES.map((p) => ({ province: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ province: string }>;
}): Promise<Metadata> {
  const { province: slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) return { title: 'Muvo — Region Not Found' };

  return {
    title: `${province.seoHeadlineEn} | Muvo`,
    description: `Book verified car rentals in ${province.name} (${province.popularCorridors.join(', ')}) with fixed final pricing, 6/12/24h flexible pickup times, and English-friendly drivers.`,
  };
}

export default async function EnglishProvinceSeoPage({
  params,
}: {
  params: Promise<{ province: string }>;
}) {
  const { province: slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();

  return <MarketplaceHome initialProvince={province.slug} initialLang="en" />;
}
