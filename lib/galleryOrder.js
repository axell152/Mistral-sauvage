import sql from './db';

// Ordre d'affichage dans une section : position la plus haute = en premier (puis le plus récent à égalité).
// Avant chaque déplacement on renumérote toute la section pour éviter les égalités.
// dir : 'top' | 'up' | 'down'. Renvoie la section de la photo déplacée (ou null si elle n'existe pas).
export async function reorderGalleryItem(id, dir) {
  const [item] = await sql`SELECT section FROM portfolio_items WHERE id = ${id}`;
  if (!item) return null;
  const rows = await sql`
    SELECT id FROM portfolio_items WHERE section = ${item.section} ORDER BY position DESC, id DESC
  `;
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
    await sql`UPDATE portfolio_items SET position = ${n - i} WHERE id = ${ids[i]}`;
  }
  return item.section;
}
