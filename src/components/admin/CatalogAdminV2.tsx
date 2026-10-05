'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Product = { id:string; name:string; price:number|null; regular_price:number|null; offer_active:boolean|null; offer_price:number|null; img:string|null };
type Photo = { id:string; product_id:string; url:string; storage_path:string|null; sort_order:number; is_primary:boolean };

const BUCKET = 'storebass-media';

function storagePath(url:string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length).split('?')[0]) : null;
}

export function CatalogAdminV2() {
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [ready,setReady] = useState(false);
  const [products,setProducts] = useState<Product[]>([]);
  const [photos,setPhotos] = useState<Record<string,Photo[]>>({});
  const [normal,setNormal] = useState<Record<string,string>>({});
  const [offer,setOffer] = useState<Record<string,string>>({});
  const [busy,setBusy] = useState<string|null>(null);
  const [status,setStatus] = useState('');

  const admin = pathname?.startsWith('/admin');

  async function reload() {
    if (!supabase) return;
    const { data,error } = await supabase.from('products').select('id,name,price,regular_price,offer_active,offer_price,img').order('created_at',{ascending:false});
    if (error) { setStatus(error.message); return; }
    const rows = (data || []) as Product[];
    setProducts(rows);
    setNormal(Object.fromEntries(rows.map(p => [p.id,String(p.price ?? 0)])));
    setOffer(Object.fromEntries(rows.map(p => [p.id,String(p.offer_price ?? '')])));
    if (!rows.length) { setPhotos({}); return; }
    const { data:imageRows,error:imageError } = await supabase.from('product_images').select('id,product_id,url,storage_path,sort_order,is_primary').in('product_id',rows.map(p=>p.id)).order('sort_order');
    if (imageError) { setStatus(imageError.message); return; }
    const grouped:Record<string,Photo[]> = {};
    for (const image of (imageRows || []) as Photo[]) (grouped[image.product_id] ||= []).push(image);
    setPhotos(grouped);
  }

  useEffect(() => {
    if (!admin || !supabase) return;
    let live = true;
    void supabase.auth.getSession().then(({data}) => { if (!live) return; setReady(!!data.session?.user); if (data.session?.user) void reload(); });
    const {data:auth} = supabase.auth.onAuthStateChange((_e,s) => { setReady(!!s?.user); if (s?.user) void reload(); });
    return () => { live=false; auth.subscription.unsubscribe(); };
  },[admin,supabase]);

  useEffect(() => {
    if (!admin || !ready || !supabase) return;
    const channel = supabase.channel('catalog-admin-v2')
      .on('postgres_changes',{event:'*',schema:'public',table:'products'},()=>void reload())
      .on('postgres_changes',{event:'*',schema:'public',table:'product_images'},()=>void reload()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  },[admin,ready,supabase]);

  // El CRM antiguo ya no debe mostrar ni aceptar URLs manuales.
  useEffect(() => {
    if (!admin) return;
    const removeLegacyUrlField = () => document.querySelectorAll('label').forEach(label => {
      if (label.textContent?.trim() === 'URL de la Imagen') {
        const input = label.nextElementSibling;
        label.remove();
        if (input?.tagName === 'INPUT') input.remove();
      }
    });
    removeLegacyUrlField();
    const observer = new MutationObserver(removeLegacyUrlField);
    observer.observe(document.body,{childList:true,subtree:true});
    return () => observer.disconnect();
  },[admin]);

  async function saveNormal(p:Product) {
    if (!supabase) return;
    const value = Number(normal[p.id]);
    if (!Number.isFinite(value) || value <= 0) { setStatus('Ingresa un precio normal válido.'); return; }
    setBusy(p.id);
    const {error} = await supabase.from('products').update({price:value,regular_price:value,updated_at:new Date().toISOString()}).eq('id',p.id);
    setBusy(null);
    if (error) { setStatus(error.message); return; }
    setStatus('Precio normal actualizado.'); window.dispatchEvent(new Event('storebass_products_updated')); await reload();
  }

  async function setOfferState(p:Product,active:boolean) {
    if (!supabase) return;
    const value = Number(offer[p.id]);
    if (active && (!Number.isFinite(value) || value <= 0)) { setStatus('Ingresa un precio de oferta válido.'); return; }
    const normalPrice = Number(normal[p.id] || p.price || 0);
    if (active && value >= normalPrice) { setStatus('El precio oferta debe ser menor que el precio normal.'); return; }
    setBusy(p.id);
    const {error} = await supabase.from('products').update({offer_active:active,offer_price:active?value:null,updated_at:new Date().toISOString()}).eq('id',p.id);
    setBusy(null);
    if (error) { setStatus(error.message); return; }
    setStatus(active?'Oferta activada y publicada en “Ofertas de este viaje”.':'Oferta desactivada.'); window.dispatchEvent(new Event('storebass_products_updated')); await reload();
  }

  async function upload(p:Product,files:FileList|null) {
    if (!supabase || !files?.length) return;
    setBusy(p.id);
    try {
      const existing = photos[p.id] || [];
      let order = existing.length;
      for (const file of Array.from(files)) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) throw new Error('Solo JPG, PNG o WEBP de hasta 5 MB.');
        const ext = file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
        const path = `catalog/${p.id}/${crypto.randomUUID()}.${ext}`;
        const {error:upError} = await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
        if (upError) throw upError;
        const {data:publicUrl} = supabase.storage.from(BUCKET).getPublicUrl(path);
        const primary = existing.length===0 && order===0;
        const {error:dbError} = await supabase.from('product_images').insert({product_id:p.id,url:publicUrl.publicUrl,storage_path:path,sort_order:order++,is_primary:primary});
        if (dbError) { await supabase.storage.from(BUCKET).remove([path]); throw dbError; }
        if (primary) await supabase.from('products').update({img:publicUrl.publicUrl}).eq('id',p.id);
      }
      setStatus(`${files.length} imagen(es) agregadas.`); window.dispatchEvent(new Event('storebass_products_updated')); await reload();
    } catch(e:any) { setStatus(e?.message || 'No se pudieron subir las imágenes.'); }
    finally { setBusy(null); }
  }

  async function deletePhoto(p:Product,image:Photo) {
    if (!supabase) return;
    setBusy(p.id);
    const path = image.storage_path || storagePath(image.url);
    if (path) { const {error} = await supabase.storage.from(BUCKET).remove([path]); if (error) { setBusy(null); setStatus(`No se pudo borrar el archivo: ${error.message}`); return; } }
    const {error} = await supabase.from('product_images').delete().eq('id',image.id);
    if (error) { setBusy(null); setStatus(error.message); return; }
    const remaining = (photos[p.id]||[]).filter(x=>x.id!==image.id);
    if (image.is_primary) {
      if (remaining[0]) { await supabase.from('product_images').update({is_primary:true,sort_order:0}).eq('id',remaining[0].id); await supabase.from('products').update({img:remaining[0].url}).eq('id',p.id); }
      else await supabase.from('products').update({img:''}).eq('id',p.id);
    }
    setBusy(null); setStatus('Imagen eliminada de Storage y base de datos.'); window.dispatchEvent(new Event('storebass_products_updated')); await reload();
  }

  async function deleteProduct(p:Product) {
    if (!supabase || !window.confirm(`¿Eliminar definitivamente ${p.name} y todas sus imágenes?`)) return;
    setBusy(p.id);
    const paths = (photos[p.id]||[]).map(x=>x.storage_path || storagePath(x.url)).filter((x):x is string=>!!x);
    if (paths.length) { const {error} = await supabase.storage.from(BUCKET).remove(paths); if (error) { setBusy(null); setStatus(`No se eliminaron los archivos: ${error.message}`); return; } }
    const {data,error} = await supabase.from('products').delete().eq('id',p.id).select('id').single();
    setBusy(null);
    if (error || !data) { setStatus(error?.message || 'Supabase no confirmó la eliminación.'); return; }
    setProducts(prev=>prev.filter(x=>x.id!==p.id));
    localStorage.setItem('storebass_products',JSON.stringify(products.filter(x=>x.id!==p.id)));
    setStatus('Producto e imágenes eliminados definitivamente.'); window.dispatchEvent(new Event('storebass_products_updated'));
  }

  if (!admin || !ready || !supabase) return null;

  return <section className="fixed bottom-4 right-4 z-[75] w-[min(94vw,430px)] max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white shadow-2xl">
    <div className="mb-3"><h2 className="font-black">Catálogo · precios · ofertas · fotos</h2><p className="text-[11px] text-slate-400">Datos guardados directamente en Supabase.</p></div>
    {status && <p className="mb-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300">{status}</p>}
    <div className="space-y-3">{products.map(p=><article key={p.id} className="rounded-xl border border-slate-800 p-3">
      <div className="flex justify-between gap-2"><strong className="text-sm">{p.name}</strong><button disabled={busy===p.id} onClick={()=>void deleteProduct(p)} className="rounded-lg bg-rose-950 px-2 py-1 text-[11px] text-rose-300">Eliminar</button></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate-400">Precio normal<input type="number" step="0.01" value={normal[p.id]??''} onChange={e=>setNormal(v=>({...v,[p.id]:e.target.value}))} className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-white" /></label>
        <div className="flex items-end"><button disabled={busy===p.id} onClick={()=>void saveNormal(p)} className="w-full rounded-lg bg-slate-800 p-2 text-xs font-bold">Guardar normal</button></div>
        <label className="text-[11px] text-slate-400">Precio oferta<input type="number" step="0.01" value={offer[p.id]??''} onChange={e=>setOffer(v=>({...v,[p.id]:e.target.value}))} className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-white" /></label>
        <div className="flex items-end">{p.offer_active?<button disabled={busy===p.id} onClick={()=>void setOfferState(p,false)} className="w-full rounded-lg bg-slate-700 p-2 text-xs font-bold">Desactivar oferta</button>:<button disabled={busy===p.id} onClick={()=>void setOfferState(p,true)} className="w-full rounded-lg bg-emerald-500 p-2 text-xs font-black text-slate-950">Activar oferta</button>}</div>
      </div>
      <label className="mt-3 block text-[11px] font-bold text-slate-400">Agregar varias fotos<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy===p.id} onChange={e=>{void upload(p,e.target.files);e.currentTarget.value='';}} className="mt-1 block w-full text-[11px]" /></label>
      <div className="mt-2 flex gap-2 overflow-x-auto">{(photos[p.id]||[]).map(image=><div key={image.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white"><img src={image.url} alt="" className="h-full w-full object-contain"/><button onClick={()=>void deletePhoto(p,image)} className="absolute right-0 top-0 h-5 w-5 bg-rose-600 text-xs">×</button></div>)}</div>
    </article>)}</div>
  </section>;
}
