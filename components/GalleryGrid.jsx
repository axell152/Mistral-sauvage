import { optimizeImage } from '../lib/images';

// Grille de photos : image, bandeau optionnel, légende optionnelle, bouton « Voir sur Etsy » optionnel.
export default function GalleryGrid({ items, altFallback = 'Création Mistral sauvage' }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-3xl border border-[#EFECE6] overflow-hidden shadow-xs group"
        >
          <div className="aspect-square overflow-hidden bg-[#F7F4EE] relative">
            <img
              src={optimizeImage(item.image_url)}
              alt={item.caption || altFallback}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            {item.badge && (
              <span className="absolute top-0 inset-x-0 text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-[#BCAA7C]/95 text-[#244738] px-2 py-1.5 shadow-sm">
                {item.badge}
              </span>
            )}
          </div>
          {item.caption && (
            <p className="text-sm text-[#6B5B52] px-3 py-2 text-center">{item.caption}</p>
          )}
          {item.etsy_url && (
            <div className="px-3 pb-3 pt-1 text-center">
              <a
                href={item.etsy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-semibold bg-[#244738] hover:bg-[#1B352A] text-white px-4 py-2 rounded-xl transition"
              >
                Voir sur Etsy
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
