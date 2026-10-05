import { getWhatsAppLink } from '@/lib/constants';

export function DeliveryCoordination({ ticketCode }: { ticketCode: string }) {
  return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Opciones de entrega</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400">Coordina el recojo o delivery por WhatsApp. Johan confirmará el punto, horario y costo si corresponde.</p>
    <div className="flex flex-wrap gap-2">
      {(['Recojo', 'Delivery'] as const).map(method => <a key={method}
        href={getWhatsAppLink(`Hola Johan, deseo coordinar ${method.toLowerCase()} para mi ticket #${ticketCode}. ${method === 'Delivery' ? 'Quiero confirmar la cobertura, el costo y el horario de entrega.' : '¿Dónde y en qué horario puedo recoger mi pedido?'}`)}
        target="_blank" rel="noopener noreferrer"
        className="rounded-xl px-4 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950">
        Coordinar {method.toLowerCase()}
      </a>)}
    </div>
  </div>;
}
