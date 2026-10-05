'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type ProductRow = {
  id: string;
  name: string;
  img?: string | null;
  regular_price?: number | null;
  price?: number | null;
  offer_active?: boolean | null;
  offer_price?: number | null;
  active?: boolean | null;
};

type ProductImage = { id: string; product_id: string; url: string; sort_order: number; is_primary: boolean };

export function AdminCatalogManager() {
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [images, setImages] = useState<Record<string, ProductImage[]>>({});
  const [offerDraft, setOfferDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const isAdmin = pathname?.startsWith('/admin');
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  async function loadProducts() {
    if (!supabase) return;
    const { data, error } = await supabase.from('products').select('id,name,img,regular_price,price,offer_active,offer_price,active').order('created_at', { ascending: false });
    if (error) { setMessage('No se pudo cargar el catálogo.'); return; }
    const rows = (data || []) as ProductRow[];
    setProducts(rows);
    setOfferDraft(Object.fromEntries(rows.map(p => [p.id, String(p.offer_price ?? '')])));
    if (rows.length) {
      const { data: imageRows } = await supabase.from('product_images').select('id,product_id,url,sort_order,is_primary').in('product_id', rows.map(p => p.id)).order('sort_order');
      const grouped: Record<string, ProductImage[]> = {};
      for (const image of (imageRows || []) as ProductImage[]) (grouped[image.product_id] ||= []).push(image);
      setImages(grouped);
    } else setImages({});
  }

  useEffect(() => {
    if (!isAdmin || !supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const ok = !!data.session?.user;
      setAuthorized(ok);
      if (ok) void loadProducts();
    });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthorized(!!session?.user);
      if (session?.user) void loadProducts();
    });
    return () => { mounted = false; auth.subscription.unsubscribe(); };
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (!isAdmin || !authorized || !supabase) return;
    const channel = supabase.channel('admin-catalog-manager')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => void loadProducts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, () => void loadProducts())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [isAdmin, authorized, supabase]);

  useEffect(() => {
    if (!isAdmin || !authorized || !supabase) return;
    const hideLegacyUrl = () => {
      document.querySelectorAll('label').forEach(label => {
        if (label.textContent?.trim() === 'URL de la Imagen') {
          (label as HTMLElement).style.display = 'none';
          const input = label.nextElementSibling as HTMLElement | null;
          if (input?.tagName === 'INPUT') input.style.display = 'none';
        }
      });
    };
    hideLegacyUrl();
    const observer = new MutationObserver(hideLegacyUrl);
    observer.observe(document.body, { childList: true, subtree: true });

    const captureDelete = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button[title="Eliminar"]') as HTMLButtonElement | null;
      const row = button?.closest('tr');
      if (!button || !row) return;
      const name = row.querySelector('td span.font-bold')?.textContent?.trim();
      const product = products.find(p => p.name === name);
      if (!product) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (!window.confirm(`¿Eliminar ${product.name} del catálogo y de la base de datos?`)) return;
      setBusy(product.id);
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      setBusy(null);
      if (error) { setMessage(`No se pudo eliminar: ${error.message}`); return; }
      row.remove();
      setProducts(prev => prev.filter(p => p.id !== product.id));
      localStorage.setItem('storebass_products', JSON.stringify(products.filter(p => p.id !== product.id)));
      window.dispatchEvent(new Event('storebass_products_updated'));
      setMessage('Producto eliminado en tiempo real y en Supabase.');
    };
    document.addEventListener('click', captureDelete, true);
    return () => { observer.disconnect(); document.removeEventListener('click', captureDelete, true); };
  }, [isAdmin, authorized, products, supabase]);

  if (!isAdmin || !authorized || !supabase) return null;

  async function saveOffer(product: ProductRow, activate: boolean) {
    if (!supabase) return;
    const value = Number(offerDraft[product.id]);
    if (activate && (!Number.isFinite(value) || value <= 0)) { setMessage('Ingresa un precio de oferta válido.'); return; }
    setBusy(product.id);
    const { error } = await supabase.from('products').update({ offer_active: activate, offer_price: activate ? value : null, updated_at: new Date().toISOString() }).eq('id', product.id);
    setBusy(null);
    if (error) { setMessage(`No se pudo actualizar la oferta: ${error.message}`); return; }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, offer_active: activate, offer_price: activate ? value : null } : p));
    window.dispatchEvent(new Event('storebass_products_updated'));
    setMessage(activate ? 'Oferta activada. Ya puede aparecer en “Ofertas de este viaje”.' : 'Oferta desactivada.');
  }

  async function uploadImages(product: ProductRow, files: FileList | null) {
    if (!supabase || !files?.length) return;
    setBusy(product.id);
    try {
      const current = images[product.id] || [];
      let order = current.length;
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Solo JPG, PNG o WEBP de hasta 5 MB.');
        const bitmap = await createImageBitmap(file); bitmap.close();
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `catalog/${product.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('storebass-media').upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('storebass-media').getPublicUrl(path);
        const primary = current.length === 0 && order === 0;
        const { error: insertError } = await supabase.from('product_images').insert({ product_id: product.id, url: publicData.publicUrl, sort_order: order++, is_primary: primary });
        if (insertError) throw insertError;
        if (primary) await supabase.from('products').update({ img: publicData.publicUrl, updated_at: new Date().toISOString() }).eq('id', product.id);
      }
      await loadProducts();
      window.dispatchEvent(new Event('storebass_products_updated'));
      setMessage(`${files.length} imagen(es) guardadas para ${product.name}.`);
    } catch (error: any) { setMessage(error?.message || 'No se pudieron subir las imágenes.'); }
    finally { setBusy(null); }
  }

  async function deleteImage(product: ProductRow, image: ProductImage) {
    if (!supabase) return;
    setBusy(product.id);
    const { error } = await supabase.from('product_images').delete().eq('id', image.id);
    if (!error) {
      const remaining = (images[product.id] || []).filter(i => i.id !== image.id);
      if (image.is_primary && remaining[0]) {
        await supabase.from('product_images').update({ is_primary: true }).eq('id', remaining[0].id);
        await supabase.from('products').update({ img: remaining[0].url, updated_at: new Date().toISOString() }).eq('id', product.id);
      }
      await loadProducts();
      window.dispatchEvent(new Event('storebass_products_updated'));
    }
    setBusy(null);
    setMessage(error ? error.message : 'Imagen eliminada.');
  }

  async function deleteProduct(product: ProductRow) {
    if (!supabase || !window.confirm(`¿Eliminar definitivamente ${product.name}?`)) return;
    setBusy(product.id);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    setBusy(null);
    if (error) { setMessage(error.message); return; }
    setProducts(prev => prev.filter(p => p.id !== product.id));
    window.dispatchEvent(new Event('storebass_products_updated'));
    setMessage('Producto eliminado de la web y de Supabase.');
  }

  return <>
    <button type="button" onClick={() => { setOpen(true); void loadProducts(); }} className="fixed bottom-5 right-5 z-[70] rounded-2xl bg-amber-500 px-4 py-3 text-xs font-black text-slate-950 shadow-2xl hover:bg-amber-400">
      Catálogo · Ofertas · Fotos
    </button>
    {open && <div className="fixed inset-0 z-[80] bg-slate-950/85 p-3 sm:p-6 overflow-y-auto">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-700 bg-slate-900 p-4 sm:p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-700 pb-4">
          <div><h2 className="text-xl font-black">Catálogo, precios, ofertas y galería</h2><p className="mt-1 text-xs text-slate-400">Cambios directos en Supabase y sincronizados en tiempo real.</p></div>
          <button onClick={() => setOpen(false)} className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold">Cerrar</button>
        </div>
        {message && <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">{message}</div>}
        <div className="mt-4 space-y-4">
          {products.map(product => <article key={product.id} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0"><h3 className="font-black">{product.name}</h3><p className="text-xs text-slate-400">Precio regular: S/ {Number(product.regular_price ?? product.price ?? 0).toFixed(2)}</p></div>
              <button disabled={busy === product.id} onClick={() => void deleteProduct(product)} className="rounded-xl bg-rose-950 px-3 py-2 text-xs font-bold text-rose-300 disabled:opacity-50">Eliminar producto</button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-700 p-3">
                <p className="mb-2 text-xs font-black uppercase text-slate-400">Oferta de este viaje</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input aria-label={`Precio oferta ${product.name}`} type="number" min="0.01" step="0.01" value={offerDraft[product.id] ?? ''} onChange={e => setOfferDraft(prev => ({ ...prev, [product.id]: e.target.value }))} placeholder="Precio oferta" className="w-36 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
                  {product.offer_active ? <button disabled={busy === product.id} onClick={() => void saveOffer(product, false)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold">Desactivar oferta</button> : <button disabled={busy === product.id} onClick={() => void saveOffer(product, true)} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950">Activar oferta</button>}
                  <span className={`text-xs font-bold ${product.offer_active ? 'text-emerald-400' : 'text-slate-500'}`}>{product.offer_active ? '● Oferta activa' : '○ Sin oferta'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-700 p-3">
                <p className="mb-2 text-xs font-black uppercase text-slate-400">Galería del producto</p>
                <input aria-label={`Agregar fotos a ${product.name}`} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy === product.id} onChange={e => { void uploadImages(product, e.target.files); e.currentTarget.value = ''; }} className="block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:font-bold file:text-slate-950" />
                <p className="mt-1 text-[11px] text-slate-500">Puedes seleccionar varias fotos a la vez. Máximo 5 MB por imagen.</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {(images[product.id] || []).map(image => <div key={image.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-white">
                <img src={image.url} alt="" className="h-full w-full object-contain" />
                <button aria-label="Eliminar imagen" onClick={() => void deleteImage(product, image)} className="absolute right-1 top-1 h-6 w-6 rounded-full bg-rose-600 text-xs font-black text-white">×</button>
                {image.is_primary && <span className="absolute bottom-1 left-1 rounded bg-slate-950/80 px-1 text-[9px] text-white">Principal</span>}
              </div>)}
            </div>
          </article>)}
        </div>
      </div>
    </div>}
  </>;
}
