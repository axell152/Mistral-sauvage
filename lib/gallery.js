// Sous-catégories de la page Bijoux (filtres). Pour en ajouter ou renommer : modifier cette liste.
export const JEWELRY_SUBCATEGORIES = [
  { slug: 'bracelets', label: 'Bracelets' },
  { slug: 'bracelets-de-cheville', label: 'Bracelets de cheville' },
  { slug: 'boucles-d-oreilles', label: "Boucles d'oreilles" },
  { slug: 'colliers', label: 'Colliers' },
];

// Sections du site dont les photos se gèrent depuis l'admin.
// Chaque photo = une carte (image + légende + bandeau + bouton « Voir sur Etsy »), le tout optionnel sauf la photo.
// `subcategories` (optionnel) : filtres proposés sur la page de la section.
export const GALLERY_SECTIONS = [
  { slug: 'personnalisation', label: 'Personnalisation' },
  { slug: 'bijoux', label: 'Bijoux', subcategories: JEWELRY_SUBCATEGORIES },
  { slug: 'accueil', label: "Page d'accueil (à la une)" },
];

export function isGallerySection(slug) {
  return GALLERY_SECTIONS.some((s) => s.slug === slug);
}

export function getSubcategories(sectionSlug) {
  return GALLERY_SECTIONS.find((s) => s.slug === sectionSlug)?.subcategories || [];
}

export function isSubcategory(sectionSlug, subSlug) {
  return getSubcategories(sectionSlug).some((s) => s.slug === subSlug);
}

export function pathForSection(sectionSlug) {
  return sectionSlug === 'accueil' ? '/' : `/${sectionSlug}`;
}

// Mentions proposées pour le bandeau sur la photo (la saisie reste libre).
export const BADGE_SUGGESTIONS = ['Dernière création', 'Nouveauté', 'Pièce unique', 'Coup de cœur'];

export function cleanBadge(input) {
  const value = (input || '').toString().trim().slice(0, 30);
  return value || null;
}

// Nettoie un lien saisi dans l'admin : ajoute https:// si absent, refuse tout ce qui n'est pas http(s).
export function parseExternalUrl(input) {
  let value = (input || '').toString().trim();
  if (!value) return { url: null, invalid: false };
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { url: null, invalid: true };
    return { url: u.href, invalid: false };
  } catch {
    return { url: null, invalid: true };
  }
}
