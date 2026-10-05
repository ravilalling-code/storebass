'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function ImageUpload({ onUpload, onBusy }: { onUpload: (url: string) => void; onBusy: (busy: boolean) => void }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setStatus('Selecciona un archivo JPG o PNG de hasta 5 MB.'); return;
    }
    setBusy(true); onBusy(true); setStatus('Subiendo imagen…');
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Sin conexión');
      // Decode first: reject corrupt images and files with a spoofed MIME type.
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      const path = `catalog/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`;
      const { error } = await supabase.storage.from('storebass-media').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('storebass-media').getPublicUrl(path);
      onUpload(data.publicUrl);
      setStatus('Imagen subida. Guarda el formulario para publicarla.');
    } catch { setStatus('No se pudo subir. Revisa el archivo, tu conexión y permisos.'); }
    finally { setBusy(false); onBusy(false); }
  }
  return <div className="space-y-2">
    <label className="block text-slate-400 font-bold">Subir imagen JPG o PNG
      <input type="file" accept="image/jpeg,image/png" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} className="block w-full mt-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:font-bold file:text-slate-950" />
    </label>
    <p role="status" className="text-xs text-slate-400">{status || 'Máximo 5 MB. También puedes usar una URL.'}</p>
  </div>;
}
