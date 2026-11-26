'use client';
import Link from 'next/link';

// Choix de la couleur (optionnel) + boutons : fiche Etsy, question, devis.
// Couleur contrôlée par le parent (ProductShowcase) pour synchroniser la photo affichée.
export default function ProductOrder({ name, categoryLabel, colors, available, whatsappNumber, etsyUrl, color, onColorChange }) {
  const needsColor = colors.length > 0;

  const message =
    `Bonjour, j'ai une question sur ce bijou${name ? ` « ${name} »` : ''} (${categoryLabel})` +
    (color ? ` en couleur : ${color}.` : '.');
  const questionHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-5">
      {needsColor && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B5B52] mb-2">
            Couleur{color ? ` : ${color}` : ''}
          </h2>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                aria-pressed={color === c}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  color === c
                    ? 'bg-[#5A3E36] text-white border-[#5A3E36]'
                    : 'bg-white text-[#4A3B32] border-[#EFECE6] hover:border-[#5A3E36]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-1">
        {etsyUrl && available && (
          <a
            href={etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-[#244738] hover:bg-[#1B352A] text-white font-bold px-8 py-3.5 rounded-2xl transition"
          >
            Voir sur Etsy
          </a>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={questionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-white border border-[#EFECE6] hover:border-[#244738] text-[#4A3B32] font-semibold px-6 py-3 rounded-2xl transition"
          >
            Poser une question
          </a>
          <Link
            href="/contact"
            className="flex-1 text-center bg-white border border-[#EFECE6] hover:border-[#244738] text-[#4A3B32] font-semibold px-6 py-3 rounded-2xl transition"
          >
            Demander un devis
          </Link>
        </div>
      </div>
    </div>
  );
}
