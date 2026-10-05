'use client';

import { OrderPreferences } from '@/lib/order-preferences';

export function OrderPreferencesFields({ value, onChange, dark = false, disabled = false }: {
  value: OrderPreferences;
  onChange: (value: OrderPreferences) => void;
  dark?: boolean;
  disabled?: boolean;
}) {
  const inputClass = `mt-1 w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`;
  return <fieldset disabled={disabled} className={`space-y-3 text-xs ${dark ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
    <legend className="font-bold mb-2">Entrega y observaciones</legend>
    <label className="block font-semibold">¿Cómo deseas recibir tu pedido?
      <select required value={value.deliveryMethod} onChange={e => onChange({ ...value, deliveryMethod: e.target.value as OrderPreferences['deliveryMethod'] })} className={inputClass}>
        <option value="" disabled>Selecciona una opción</option>
        <option value="recojo">Recojo</option>
        <option value="delivery">Delivery</option>
      </select>
    </label>
    {value.deliveryMethod === 'delivery' && <label className="block font-semibold">Dirección y distrito
      <input required maxLength={300} autoComplete="street-address" value={value.address} onChange={e => onChange({ ...value, address: e.target.value })} placeholder="Calle, número, distrito y referencia" className={inputClass} />
    </label>}
    {value.deliveryMethod && <p className="text-[11px]">{value.deliveryMethod === 'delivery' ? 'El costo y horario del delivery se confirman por WhatsApp antes del pago.' : 'Coordinaremos el punto y horario de recojo por WhatsApp.'}</p>}
    <label className="block font-semibold">Observaciones (opcional)
      <textarea rows={3} maxLength={1000} value={value.observations} onChange={e => onChange({ ...value, observations: e.target.value })} placeholder="Indica detalles adicionales de tu encargo o entrega" className={inputClass} />
    </label>
  </fieldset>;
}
