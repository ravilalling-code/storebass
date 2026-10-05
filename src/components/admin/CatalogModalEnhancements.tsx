'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Photo={id?:string;url:string;storage_path?:string|null;sort_order:number;is_primary:boolean};
const BUCKET='storebass-media';

export function CatalogModalEnhancements(){
  const pathname=usePathname();
  const supabase=useMemo(()=>getSupabaseBrowserClient(),[]);
  const [host,setHost]=useState<HTMLElement|null>(null);
  const [productId,setProductId]=useState<string|null>(null);
  const [normal,setNormal]=useState('');
  const [offerActive,setOfferActive]=useState(false);
  const [offerPrice,setOfferPrice]=useState('');
  const [photos,setPhotos]=useState<Photo[]>([]);
  const [pending,setPending]=useState<Photo[]>([]);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');
  const admin=pathname?.startsWith('/admin');

  useEffect(()=>{
    if(!admin) return;
    const scan=()=>{
      const labels=Array.from(document.querySelectorAll('label')) as HTMLElement[];
      const urlLabel=labels.find(x=>x.textContent?.trim()==='URL de la Imagen');
      if(!urlLabel){setHost(null);return;}
      const input=urlLabel.nextElementSibling as HTMLElement|null;
      urlLabel.style.display='none'; if(input?.tagName==='INPUT') input.style.display='none';
      const form=urlLabel.closest('form');
      if(!form){setHost(null);return;}
      let slot=form.querySelector('[data-catalog-enhancements]') as HTMLElement|null;
      if(!slot){slot=document.createElement('div');slot.dataset.catalogEnhancements='true';urlLabel.parentElement?.insertBefore(slot,urlLabel);}
      setHost(slot);
      const nameInput=form.querySelector('input[placeholder*="producto" i], input[type="text"]') as HTMLInputElement|null;
      const name=nameInput?.value?.trim();
      if(name && supabase) void supabase.from('products').select('id,price,regular_price,offer_active,offer_price').eq('name',name).order('created_at',{ascending:false}).limit(1).maybeSingle().then(async({data})=>{
        if(!data){setProductId(null);setNormal('');setOfferActive(false);setOfferPrice('');setPhotos([]);return;}
        setProductId(data.id);setNormal(String(data.regular_price??data.price??''));setOfferActive(!!data.offer_active);setOfferPrice(String(data.offer_price??''));
        const {data:imgs}=await supabase.from('product_images').select('id,url,storage_path,sort_order,is_primary').eq('product_id',data.id).order('sort_order');setPhotos((imgs||[]) as Photo[]);
      });
    };
    scan(); const obs=new MutationObserver(scan);obs.observe(document.body,{childList:true,subtree:true});return()=>obs.disconnect();
  },[admin,supabase]);

  useEffect(()=>{
    if(!admin||!supabase) return;
    const capture=async(e:MouseEvent)=>{
      const button=(e.target as HTMLElement).closest('button[title="Eliminar"]') as HTMLButtonElement|null;const row=button?.closest('tr');if(!button||!row)return;
      const name=row.querySelector('td span.font-bold')?.textContent?.trim();if(!name)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const {data:p}=await supabase.from('products').select('id,name').eq('name',name).limit(1).maybeSingle();if(!p)return;
      if(!confirm(`¿Eliminar definitivamente ${p.name} y todas sus imágenes?`))return;
      const {data:imgs}=await supabase.from('product_images').select('storage_path').eq('product_id',p.id);const paths=(imgs||[]).map(x=>x.storage_path).filter(Boolean) as string[];if(paths.length)await supabase.storage.from(BUCKET).remove(paths);
      const {data,error}=await supabase.from('products').delete().eq('id',p.id).select('id').single();if(error||!data){alert(error?.message||'Supabase no confirmó la eliminación');return;}
      row.remove();window.dispatchEvent(new Event('storebass_products_updated'));
    };
    document.addEventListener('click',capture,true);return()=>document.removeEventListener('click',capture,true);
  },[admin,supabase]);

  async function upload(files:FileList|null){if(!supabase||!files?.length)return;setBusy(true);try{const next:Photo[]=[];for(const file of Array.from(files)){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Solo JPG, PNG o WEBP de hasta 5 MB.');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=`catalog/${productId||'new'}/${crypto.randomUUID()}.${ext}`;const {error}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type});if(error)throw error;const {data}=supabase.storage.from(BUCKET).getPublicUrl(path);next.push({url:data.publicUrl,storage_path:path,sort_order:photos.length+pending.length+next.length,is_primary:photos.length+pending.length+next.length===0});}setPending(v=>[...v,...next]);setStatus('Fotos listas. Guarda el producto.');}catch(e:any){setStatus(e.message||'Error al subir imágenes');}finally{setBusy(false);}}

  async function persist(){if(!supabase)return;const form=host?.closest('form');const nameInput=form?.querySelector('input[placeholder*="producto" i], input[type="text"]') as HTMLInputElement|null;const name=nameInput?.value?.trim();if(!name)return;setTimeout(async()=>{const {data:p}=await supabase.from('products').select('id').eq('name',name).order('created_at',{ascending:false}).limit(1).maybeSingle();if(!p)return;const n=Number(normal),o=Number(offerPrice);const patch:any={offer_active:offerActive,offer_price:offerActive&&o>0?o:null};if(n>0){patch.price=n;patch.regular_price=n;}await supabase.from('products').update(patch).eq('id',p.id);for(const [i,img] of pending.entries())await supabase.from('product_images').insert({product_id:p.id,url:img.url,storage_path:img.storage_path,sort_order:photos.length+i,is_primary:photos.length===0&&i===0});if(pending.length&&photos.length===0)await supabase.from('products').update({img:pending[0].url}).eq('id',p.id);setPending([]);window.dispatchEvent(new Event('storebass_products_updated'));},700);}

  useEffect(()=>{const form=host?.closest('form');if(!form)return;const handler=()=>void persist();form.addEventListener('submit',handler);return()=>form.removeEventListener('submit',handler);},[host,normal,offerActive,offerPrice,pending,photos]);

  if(!admin||!host)return null;
  return createPortal(<div className="mb-4 space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-400">Precio normal<input type="number" min="0.01" step="0.01" value={normal} onChange={e=>setNormal(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"/></label><label className="flex items-center gap-2 self-end rounded-lg border border-slate-700 p-2 text-xs font-bold text-slate-300"><input type="checkbox" checked={offerActive} onChange={e=>setOfferActive(e.target.checked)}/> Activar oferta</label></div>
    {offerActive&&<label className="block text-xs font-bold text-slate-400">Precio oferta<input type="number" min="0.01" step="0.01" value={offerPrice} onChange={e=>setOfferPrice(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"/></label>}
    <label className="block text-xs font-bold text-slate-400">Fotos del producto<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files);e.currentTarget.value='';}} className="mt-2 block w-full text-xs"/></label>
    <div className="flex gap-2 overflow-x-auto">{[...photos,...pending].map((x,i)=><img key={`${x.url}-${i}`} src={x.url} alt="" className="h-16 w-16 rounded-lg bg-white object-contain"/>)}</div>{status&&<p className="text-xs text-amber-400">{status}</p>}
  </div>,host);
}
