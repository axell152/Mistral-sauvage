import BijouxCatalog from '../../components/BijouxCatalog';

export const revalidate = 0;
export const metadata = { title: 'Bijoux | Mistral sauvage' };

export default function BijouxPage() {
  return <BijouxCatalog activeSlug={null} />;
}
