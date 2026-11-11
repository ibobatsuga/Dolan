import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PROVINCES, getProvinceBySlug } from '@/lib/data/provinces';
import { SEED_VEHICLES } from '@/lib/data/seed';
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
  if (!province) return { title: 'Dolan — Wilayah Tidak Ditemukan' };

  return {
    title: `${province.seoHeadlineId} | Dolan`,
    description: `Sewa mobil di ${province.name} (${province.popularCorridors.join(', ')}) dengan harga final transparan 6/12/24 jam, lepas kunci atau dengan sopir + full BBM.`,
  };
}

export default async function ProvinceSeoPage({
  params,
}: {
  params: Promise<{ province: string }>;
}) {
  const { province: slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();

  const provinceVehicles = SEED_VEHICLES.filter((v) => v.provinceId === province.id);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: province.seoHeadlineId,
    areaServed: province.name,
    itemListElement: provinceVehicles.map((v, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: v.brandModel,
        description: `${v.transmission}, ${v.seats} kursi, ${v.year}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketplaceHome initialProvince={province.slug} initialLang="id" />
    </>
  );
}
