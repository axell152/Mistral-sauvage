import { notFound } from 'next/navigation';
import { JEWELRY_SUBCATEGORIES } from '../../../lib/gallery';
import BijouxCatalog from '../../../components/BijouxCatalog';

export const revalidate = 0;

export function generateMetadata({ params }) {
  const sc = JEWELRY_SUBCATEGORIES.find((s) => s.slug === params.sub);
  return { title: `${sc ? sc.label : 'Bijoux'} | Mistral sauvage` };
}

export default function BijouxSubPage({ params }) {
  const sc = JEWELRY_SUBCATEGORIES.find((s) => s.slug === params.sub);
  if (!sc) notFound();
  return <BijouxCatalog activeSlug={sc.slug} />;
}
