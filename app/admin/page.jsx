import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import sql, { initDb } from '../../lib/db';
import { revalidatePath } from 'next/cache';
import { del } from '@vercel/blob';
import { uploadImage, deleteImage, isCloudinaryUrl } from '../../lib/cloudinary';
import PricingTableEditor from '../../components/PricingTableEditor';
import PricingTableRow from '../../components/PricingTableRow';
import AddPortfolioForm from '../../components/AddPortfolioForm';
import {
  GALLERY_SECTIONS,
  BADGE_SUGGESTIONS,
  isGallerySection,
  getSubcategories,
  isSubcategory,
  pathForSection,
  cleanBadge,
  parseExternalUrl,
} from '../../lib/gallery';
import { reorderGalleryItem } from '../../lib/galleryOrder';
import { optimizeImage } from '../../lib/images';

export const revalidate = 0;

function refreshGallery(section) {
  revalidatePath(pathForSection(section));
  revalidatePath('/');
  revalidatePath('/admin');
}

export default async function AdminPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get('admin_auth');

  if (!isAuthenticated || isAuthenticated.value !== 'true') {
    redirect('/admin/login');
  }

  await initDb();

  async function addPricingTable(formData) {
    'use server';
    const category = formData.get('category');
    const title = formData.get('title') || null;
    const description = formData.get('description') || null;
    const wrapLabels = formData.get('wrap_labels') === 'on';
    const columns = formData.get('columns') || '[]';
    const rows = formData.get('rows') || '[]';

    const existingCategory = await sql`
      SELECT MIN(position) AS position
      FROM pricing_tables
      WHERE category = ${category}
    `;

    let position = existingCategory[0]?.position;

    if (position === null || position === undefined) {
      const lastPosition = await sql`
        SELECT COALESCE(MAX(position), -1) AS position
        FROM pricing_tables
      `;
      position = Number(lastPosition[0]?.position ?? -1) + 1;
    }

    await sql`
      INSERT INTO pricing_tables (category, title, description, columns, rows, position, wrap_labels)
      VALUES (${category}, ${title}, ${description}, ${columns}, ${rows}, ${position}, ${wrapLabels})
    `;

    revalidatePath('/personnalisation/tarifs');
    revalidatePath('/admin');
  }

  async function updatePricingTable(formData) {
    'use server';
    const id = formData.get('id');
    const category = formData.get('category');
    const title = formData.get('title') || null;
    const description = formData.get('description') || null;
    const wrapLabels = formData.get('wrap_labels') === 'on';
    const columns = formData.get('columns') || '[]';
    const rows = formData.get('rows') || '[]';

    await sql`
      UPDATE pricing_tables
      SET category = ${category}, title = ${title}, description = ${description}, columns = ${columns}, rows = ${rows}, wrap_labels = ${wrapLabels}
      WHERE id = ${id}
    `;

    revalidatePath('/personnalisation/tarifs');
    revalidatePath('/admin');
  }

  async function movePricingCategory(formData) {
    'use server';
    const category = (formData.get('category') || '').toString();
    const direction = (formData.get('direction') || '').toString();

    if (!category || !['up', 'down'].includes(direction)) return;

    // On récupère les catégories dans leur ordre actuel.
    const rows = await sql`
      SELECT category, MIN(position) AS position
      FROM pricing_tables
      GROUP BY category
      ORDER BY MIN(position), category
    `;

    const categories = rows.map((row) => row.category);
    const currentIndex = categories.indexOf(category);

    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= categories.length) return;

    // On échange les deux catégories.
    [categories[currentIndex], categories[targetIndex]] = [
      categories[targetIndex],
      categories[currentIndex],
    ];

    // On renumérote proprement toutes les catégories. Cela fonctionne même
    // si les anciennes positions étaient toutes à 0.
    for (let index = 0; index < categories.length; index++) {
      await sql`
        UPDATE pricing_tables
        SET position = ${index}
        WHERE category = ${categories[index]}
      `;
    }

    revalidatePath('/personnalisation/tarifs');
    revalidatePath('/admin');
  }

  async function deletePricingTable(formData) {
    'use server';
    const id = formData.get('id');
    await sql`DELETE FROM pricing_tables WHERE id = ${id}`;
    revalidatePath('/personnalisation/tarifs');
    revalidatePath('/admin');
  }

  async function addPortfolioItem(formData) {
    'use server';
    const caption = (formData.get('caption') || '').toString().trim() || null;
    const badge = cleanBadge(formData.get('badge'));
    const etsy = parseExternalUrl(formData.get('etsy_url'));
    if (etsy.invalid) return { error: "Le lien Etsy n'est pas valide." };
    const sectionInput = (formData.get('section') || '').toString();
    const section = isGallerySection(sectionInput) ? sectionInput : 'personnalisation';
    const subInput = (formData.get('subcategory') || '').toString();
    const subcategory = isSubcategory(section, subInput) ? subInput : null;
    let imageUrl = '';

    try {
      const file = formData.get('image');
      if (file && file.size > 0) {
        imageUrl = await uploadImage(file, 'portfolio');
      }
    } catch (e) {
      console.log('Erreur upload portfolio:', e);
      return { error: e.message || "L'envoi de la photo a échoué." };
    }

    if (!imageUrl) return { error: 'Aucune photo reçue.' };

    // Une nouvelle photo se place automatiquement en premier de sa section.
    await sql`
      INSERT INTO portfolio_items (image_url, caption, section, subcategory, etsy_url, badge, position)
      VALUES (${imageUrl}, ${caption}, ${section}, ${subcategory}, ${etsy.url}, ${badge},
              (SELECT COALESCE(MAX(position), 0) + 1 FROM portfolio_items WHERE section = ${section}))
    `;
    refreshGallery(section);
    return { ok: true };
  }

  async function updatePortfolioItem(formData) {
    'use server';
    const id = Number(formData.get('id'));
    if (!id) return;
    const [item] = await sql`SELECT section, etsy_url FROM portfolio_items WHERE id = ${id}`;
    if (!item) return;
    const section = isGallerySection(item.section) ? item.section : 'personnalisation';

    const caption = (formData.get('caption') || '').toString().trim() || null;
    const badge = cleanBadge(formData.get('badge'));
    // Lien invalide : on garde l'ancien plutôt que d'effacer ou d'enregistrer n'importe quoi
    const etsy = parseExternalUrl(formData.get('etsy_url'));
    const etsyUrl = etsy.invalid ? item.etsy_url ?? null : etsy.url;
    const subInput = (formData.get('subcategory') || '').toString();
    const subcategory = isSubcategory(section, subInput) ? subInput : null;

    await sql`
      UPDATE portfolio_items
      SET caption = ${caption}, badge = ${badge}, etsy_url = ${etsyUrl}, subcategory = ${subcategory}
      WHERE id = ${id}
    `;
    if (formData.get('bump') === 'on') await reorderGalleryItem(id, 'top');
    refreshGallery(section);
  }

  async function movePortfolioItem(formData) {
    'use server';
    const id = Number(formData.get('id'));
    const dir = (formData.get('dir') || '').toString();
    if (!id || !['top', 'up', 'down'].includes(dir)) return;
    const section = await reorderGalleryItem(id, dir);
    if (section) refreshGallery(section);
  }

  async function deletePortfolioItem(formData) {
    'use server';
    const id = Number(formData.get('id'));
    let section = 'personnalisation';

    try {
      const [item] = await sql`SELECT image_url, section FROM portfolio_items WHERE id = ${id}`;
      if (isGallerySection(item?.section)) section = item.section;
      if (isCloudinaryUrl(item?.image_url)) {
        await deleteImage(item.image_url).catch(() => {});
      } else if (item?.image_url && item.image_url.startsWith('http')) {
        await del(item.image_url).catch(() => {});
      }
    } catch (e) {
      console.log('Erreur suppression image portfolio:', e);
    }

    await sql`DELETE FROM portfolio_items WHERE id = ${id}`;
    refreshGallery(section);
  }

  const pricingTableRows = await sql`
    SELECT * FROM pricing_tables
    ORDER BY position, category, id
  `;

  const pricingTables = pricingTableRows.map((t) => {
    let columns = [];
    let rows = [];
    try {
      columns = JSON.parse(t.columns || '[]');
    } catch {
      columns = [];
    }
    try {
      rows = JSON.parse(t.rows || '[]');
    } catch {
      rows = [];
    }
    return { ...t, columns, rows };
  });

  const categoryIndexes = new Map();
  pricingTables.forEach((table) => {
    if (!categoryIndexes.has(table.category)) {
      categoryIndexes.set(table.category, categoryIndexes.size);
    }
  });

  const portfolioItems = await sql`SELECT * FROM portfolio_items ORDER BY position DESC, id DESC`;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#4A3B32] mb-2">Espace Administration</h1>
        <p className="text-[#6B5B52]">Gérez vos tarifs et les photos de chaque page (Personnalisation, Bijoux, accueil).</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#EFECE6] shadow-xs">
        <h2 className="text-xl font-serif font-bold text-[#4A3B32] mb-4">Créer un tableau de tarifs</h2>
        <PricingTableEditor action={addPricingTable} />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#EFECE6] shadow-xs">
        <h2 className="text-xl font-serif font-bold text-[#4A3B32] mb-4">Mes tableaux de tarifs ({pricingTables.length})</h2>
        {pricingTables.length === 0 ? (
          <p className="text-sm text-[#6B5B52]">Aucun tableau créé pour le moment.</p>
        ) : (
          <div className="divide-y divide-[#F7F4EE]">
            {pricingTables.map((table) => {
              const categoryIndex = categoryIndexes.get(table.category);
              const isFirstInCategory =
                pricingTables.findIndex((item) => item.category === table.category) ===
                pricingTables.indexOf(table);

              return (
                <PricingTableRow
                  key={table.id}
                  table={table}
                  updateAction={updatePricingTable}
                  deleteAction={deletePricingTable}
                  moveCategoryAction={movePricingCategory}
                  categoryIndex={categoryIndex}
                  categoryCount={categoryIndexes.size}
                  showCategoryControls={isFirstInCategory}
                />
              );
            })}
          </div>
        )}
      </div>

      <datalist id="badge-suggestions">
        {BADGE_SUGGESTIONS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <div className="bg-white p-6 rounded-3xl border border-[#EFECE6] shadow-xs">
        <h2 className="text-xl font-serif font-bold text-[#4A3B32] mb-4">Ajouter des photos</h2>
        <AddPortfolioForm action={addPortfolioItem} sections={GALLERY_SECTIONS} />
      </div>

      {GALLERY_SECTIONS.map((section) => {
        const sectionItems = portfolioItems.filter(
          (item) => (item.section || 'personnalisation') === section.slug
        );
        const subs = section.subcategories || [];
        const input = 'w-full border border-[#EFECE6] rounded-xl bg-white px-3 py-2 text-sm';

        return (
          <div key={section.slug} className="bg-white p-6 rounded-3xl border border-[#EFECE6] shadow-xs">
            <h2 className="text-xl font-serif font-bold text-[#4A3B32] mb-1">
              {section.label} ({sectionItems.length})
            </h2>
            <p className="text-sm text-[#6B5B52] mb-4">
              C'est l'ordre du site : la première photo de la liste s'affiche en premier. Une nouvelle photo se place en haut.
            </p>
            {sectionItems.length === 0 ? (
              <p className="text-sm text-[#6B5B52]">Aucune photo ajoutée pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {sectionItems.map((item, i) => {
                  const subLabel = subs.find((sc) => sc.slug === item.subcategory)?.label;
                  return (
                    <div key={item.id} className="border border-[#EFECE6] rounded-2xl p-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs text-[#6B5B52] shrink-0">{i + 1}</span>
                        <img src={optimizeImage(item.image_url, 150)} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#4A3B32] break-words">{item.caption || '(sans légende)'}</p>
                          <p className="text-xs text-[#6B5B52] break-words">
                            {[
                              subLabel,
                              item.badge ? `Bandeau « ${item.badge} »` : null,
                              item.etsy_url ? 'Lien Etsy' : null,
                            ].filter(Boolean).join(' · ') || 'Photo seule'}
                          </p>
                        </div>
                        <form action={movePortfolioItem} className="flex gap-1 shrink-0">
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" name="dir" value="top" disabled={i === 0} title="Tout en haut" className="px-2.5 py-1.5 text-xs rounded-lg bg-[#F7F4EE] hover:bg-[#EFECE6] text-[#4A3B32] disabled:opacity-30">⤒</button>
                          <button type="submit" name="dir" value="up" disabled={i === 0} title="Monter" className="px-2.5 py-1.5 text-xs rounded-lg bg-[#F7F4EE] hover:bg-[#EFECE6] text-[#4A3B32] disabled:opacity-30">↑</button>
                          <button type="submit" name="dir" value="down" disabled={i === sectionItems.length - 1} title="Descendre" className="px-2.5 py-1.5 text-xs rounded-lg bg-[#F7F4EE] hover:bg-[#EFECE6] text-[#4A3B32] disabled:opacity-30">↓</button>
                        </form>
                      </div>

                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-[#5A3E36]">Modifier / supprimer</summary>
                        <div className="mt-3 space-y-3">
                          <form action={updatePortfolioItem} className="space-y-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input name="caption" defaultValue={item.caption ?? ''} placeholder="Légende (optionnel)" className={input} />
                            <input name="badge" list="badge-suggestions" maxLength={30} defaultValue={item.badge ?? ''} placeholder="Bandeau sur la photo, ex. Dernière création (vide = aucun)" className={input} />
                            <input type="url" name="etsy_url" defaultValue={item.etsy_url ?? ''} placeholder="Lien Etsy (optionnel)" className={input} />
                            {subs.length > 0 && (
                              <select name="subcategory" defaultValue={item.subcategory ?? ''} className={input}>
                                <option value="">Sans sous-catégorie (visible dans « Tous »)</option>
                                {subs.map((sc) => (
                                  <option key={sc.slug} value={sc.slug}>{sc.label}</option>
                                ))}
                              </select>
                            )}
                            <label className="flex items-center gap-2 text-sm text-[#4A3B32]">
                              <input type="checkbox" name="bump" className="w-4 h-4 accent-[#5A3E36]" />
                              Remettre en haut de la liste en enregistrant
                            </label>
                            <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#244738] text-white hover:bg-[#1B352A]">
                              Enregistrer
                            </button>
                          </form>
                          <form action={deletePortfolioItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <button type="submit" className="px-3 py-1.5 text-xs font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
                              Supprimer cette photo
                            </button>
                          </form>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
