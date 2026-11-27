import Link from 'next/link';
import sql, { initDb } from '../lib/db';
import { JEWELRY_SUBCATEGORIES, getJewelrySubcategory, parseImages, formatPrice } from '../lib/bijoux';
import { optimizeImage } from '../lib/images';
import { ETSY_SHOP_URL } from '../lib/site';

// Catalogue des bijoux : filtres par sous-catégorie + tous les bijoux, les plus récents en premier.
// activeSlug = null -> « Tous » ; sinon le slug de la sous-catégorie filtrée.
export default async function JewelryCatalog({ activeSlug = null }) {
  await initDb();
  const items = activeSlug
    ? await sql`SELECT * FROM jewelry_items WHERE subcategory = ${activeSlug} ORDER BY id DESC`
    : await sql`SELECT * FROM jewelry_items ORDER BY id DESC`;

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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => {
            const cover = parseImages(item.images)[0];
            const price = formatPrice(item.price);
            const category = getJewelrySubcategory(item.subcategory);
            return (
              <Link
                key={item.id}
                href={`/bijoux/${item.subcategory}/${item.id}`}
                className="bg-white rounded-3xl border border-[#EFECE6] overflow-hidden shadow-xs hover:shadow-md transition group"
              >
                <div className="aspect-square overflow-hidden bg-[#F7F4EE] relative">
                  {cover && (
                    <img
                      src={optimizeImage(cover, 800)}
                      alt={item.name || 'Création Mistral sauvage'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}
                  {item.badge && (
                    <span className="absolute top-0 inset-x-0 text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-[#BCAA7C]/95 text-[#244738] px-2 py-1.5 shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {!item.is_available && (
                    <span className="absolute bottom-3 left-3 text-xs font-semibold bg-white/90 text-[#5A3E36] px-3 py-1 rounded-full">
                      Indisponible
                    </span>
                  )}
                </div>
                <div className="px-4 py-3 space-y-0.5">
                  {!activeSlug && category && (
                    <p className="text-[11px] uppercase tracking-wide text-[#6B5B52]">{category.label}</p>
                  )}
                  {item.name && <p className="font-serif font-bold text-[#4A3B32]">{item.name}</p>}
                  {price && <p className="text-sm text-[#6B5B52]">{price}</p>}
                </div>
              </Link>
            );
          })}
        </div>
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
