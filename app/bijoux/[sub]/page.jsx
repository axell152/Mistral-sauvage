import { notFound } from 'next/navigation';
import { getJewelrySubcategory } from '../../../lib/bijoux';
import JewelryCatalog from '../../../components/JewelryCatalog';

export const revalidate = 0;

export function generateMetadata({ params }) {
  const sc = getJewelrySubcategory(params.sub);
  return { title: `${sc ? sc.label : 'Bijoux'} | Mistral sauvage` };
}

export default function BijouxSubPage({ params }) {
  const sc = getJewelrySubcategory(params.sub);
  if (!sc) notFound();
  return <JewelryCatalog activeSlug={sc.slug} />;
}
