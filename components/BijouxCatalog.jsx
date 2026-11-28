import Link from 'next/link';
import sql, { initDb } from '../lib/db';
import { JEWELRY_SUBCATEGORIES } from '../lib/gallery';
import { ETSY_SHOP_URL } from '../lib/site';
import GalleryGrid from './GalleryGrid';

// Page Bijoux : filtres par sous-catégorie + grille de photos (même présentation que Personnalisation).
// activeSlug = null -> « Tous » ; sinon le slug de la sous-catégorie filtrée.
export default async function BijouxCatalog({ activeSlug = null }) {
  await initDb();
  const items = activeSlug
    ? await sql`SELECT * FROM portfolio_items WHERE section = 'bijoux' AND subcategory = ${activeSlug} ORDER BY position DESC, id DESC`
    : await sql`SELECT * FROM portfolio_items WHERE section = 'bijoux' ORDER BY position DESC, id DESC`;

  const filters = [{ slug: null, label: 'Tous', href: '/bijoux' }].concat(
    JEWELRY_SUBCATEGORIES.map((sc) => ({ slug: sc.slug, label: sc.label, href: `/bijoux/${sc.slug}` }))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4">
      <h1 className="sr-only">Bijoux</h1>

      <nav aria-label="Filtrer les bijoux" className="flex flex-wrap items-center justify-center gap-2">
        {filters.map((f) => {
          const active = f.slug === activeSlug;
          return (
            <Link
              key={f.label}
              href={f.href}
              aria-current={active ? 'page' : undefined}
              className={`text-sm font-medium px-4 py-1.5 rounded-full border transition ${
                active
                  ? 'bg-[#5A3E36] text-white border-[#5A3E36]'
                  : 'bg-white text-[#4A3B32] border-[#EFECE6] hover:border-[#5A3E36]'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EFECE6] text-[#6B5B52]">
          <p className="text-lg">Les créations arrivent bientôt.</p>
        </div>
      ) : (
        <GalleryGrid items={items} />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        {ETSY_SHOP_URL && (
          <a
            href={ETSY_SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#244738] hover:bg-[#1B352A] text-white font-bold px-8 py-3.5 rounded-2xl transition"
          >
            Voir toute la boutique sur Etsy
          </a>
        )}
        <Link
          href="/contact"
          className="inline-block bg-[#5A3E36] hover:bg-[#4A3B32] text-white font-bold px-8 py-3.5 rounded-2xl transition"
        >
          Me contacter
        </Link>
      </div>
    </div>
  );
}
