import sql from './db';

// Ordre d'affichage : position la plus haute = en premier (puis le plus récent à égalité).
// Avant chaque déplacement on renumérote toute la liste pour éviter les égalités.
// dir : 'top' | 'up' | 'down'. Renvoie la sous-catégorie du bijou déplacé (ou null s'il n'existe pas).
export async function reorderJewelry(id, dir) {
  const rows = await sql`SELECT id, subcategory FROM jewelry_items ORDER BY position DESC, id DESC`;
  const ids = rows.map((r) => r.id);
  const idx = ids.indexOf(id);
  if (idx === -1) return null;
  if (dir === 'top') {
    ids.splice(idx, 1);
    ids.unshift(id);
  } else if (dir === 'up' && idx > 0) {
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
  } else if (dir === 'down' && idx < ids.length - 1) {
    [ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]];
  }
  const n = ids.length;
  for (let i = 0; i < n; i++) {
    await sql`UPDATE jewelry_items SET position = ${n - i} WHERE id = ${ids[i]}`;
  }
  return rows.find((r) => r.id === id).subcategory;
}
