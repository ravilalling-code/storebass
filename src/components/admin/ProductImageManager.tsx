'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export type ProductImageDraft = { id?: string; url: string; sort_order: number; is_primary: boolean };

export function ProductImageManager({ images, onChange, onBusy }: { images: ProductImageDraft[]; onChange: (images: ProductImageDraft[]) => void; onBusy: (busy: boolean) => void }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setStatus('Usa JPG, PNG o WEBP de hasta 5 MB por imagen.'); return;
    }
    setBusy(true); onBusy(true); setStatus(`Subiendo ${selected.length} imagen(es)…`);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Sin conexión');
      const uploaded: ProductImageDraft[] = [];
      for (const file of selected) {
        const bitmap = await createImageBitmap(file); bitmap.close();
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `catalog/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('storebass-media').upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from('storebass-media').getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, sort_order: images.length + uploaded.length, is_primary: images.length === 0 && uploaded.length === 0 });
      }
      onChange([...images, ...uploaded].map((item, index) => ({ ...item, sort_order: index, is_primary: index === 0 })));
      setStatus('Fotos listas. Guarda el producto para publicar los cambios.');
    } catch (error) {
      console.error(error); setStatus('No se pudieron subir todas las imágenes. Revisa conexión y permisos.');
    } finally { setBusy(false); onBusy(false); }
  };

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i, is_primary: i === 0 })));
  const makePrimary = (index: number) => {
    const reordered = [images[index], ...images.filter((_, i) => i !== index)].map((item, i) => ({ ...item, sort_order: i, is_primary: i === 0 }));
    onChange(reordered);
  };

  return <div className="space-y-3">
    <label className="block text-slate-400 font-bold">Fotos del producto
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { void upload(e.target.files); e.target.value = ''; }} className="block w-full mt-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:font-bold file:text-slate-950" />
    </label>
    <p role="status" className="text-xs text-slate-400">{status || 'Puedes seleccionar varias fotos. La primera será la portada del catálogo.'}</p>
    {images.length > 0 && <div className="grid grid-cols-3 gap-2">
      {images.map((image, index) => <div key={`${image.url}-${index}`} className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800 aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={image.url} alt="" className="w-full h-full object-cover" />
        {index === 0 && <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-slate-950">PORTADA</span>}
        <div className="absolute inset-x-1 bottom-1 flex gap-1">
          {index !== 0 && <button type="button" onClick={() => makePrimary(index)} className="flex-1 rounded bg-slate-950/80 px-1 py-1 text-[9px] font-bold text-white">Portada</button>}
          <button type="button" onClick={() => remove(index)} className="rounded bg-rose-600 px-2 py-1 text-[9px] font-bold text-white">Quitar</button>
        </div>
      </div>)}
    </div>}
  </div>;
}
