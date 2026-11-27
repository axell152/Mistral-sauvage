// Sous-catégories de la section Bijoux (chaque bijou a sa fiche produit).
export const JEWELRY_SUBCATEGORIES = [
  { slug: 'bracelets', label: 'Bracelets' },
  { slug: 'bracelets-de-cheville', label: 'Bracelets de cheville' },
  { slug: 'boucles-d-oreilles', label: "Boucles d'oreilles" },
  { slug: 'colliers', label: 'Colliers' },
];

export function getJewelrySubcategory(slug) {
  return JEWELRY_SUBCATEGORIES.find((s) => s.slug === slug);
}

export function parseImages(value) {
  try {
    const list = JSON.parse(value || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function formatPrice(price) {
  if (price === null || price === undefined || price === '') return null;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(price));
}

export function parseColors(value) {
  return parseImages(value).filter((c) => typeof c === 'string' && c.trim() !== '');
}

// "Doré, Argenté, Rose" -> ["Doré", "Argenté", "Rose"] (sans doublons, 20 max)
export function splitColors(input) {
  const list = (input || '')
    .toString()
    .split(/[,;\n]/)
    .map((c) => c.trim())
    .filter(Boolean);
  return [...new Set(list)].slice(0, 20);
}

export function parseImageColors(value) {
  try {
    const obj = JSON.parse(value || '{}');
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
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

// Mentions proposées dans l'admin pour le bandeau sur la photo (la saisie reste libre).
export const BADGE_SUGGESTIONS = ['Dernière création', 'Nouveauté', 'Pièce unique', 'Coup de cœur'];

export function cleanBadge(input) {
  const value = (input || '').toString().trim().slice(0, 30);
  return value || null;
}
