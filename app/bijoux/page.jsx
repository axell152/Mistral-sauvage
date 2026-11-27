import JewelryCatalog from '../../components/JewelryCatalog';

export const revalidate = 0;
export const metadata = { title: 'Bijoux | Mistral sauvage' };

export default function BijouxPage() {
  return <JewelryCatalog activeSlug={null} />;
}
