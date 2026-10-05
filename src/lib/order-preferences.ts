export interface OrderPreferences {
  deliveryMethod: '' | 'recojo' | 'delivery';
  address: string;
  observations: string;
}

export const EMPTY_ORDER_PREFERENCES: OrderPreferences = {
  deliveryMethod: '', address: '', observations: '',
};

export function formatOrderPreferences(preferences: OrderPreferences): string {
  if (!['recojo', 'delivery'].includes(preferences.deliveryMethod)) {
    throw new Error('Selecciona recojo o delivery para tu pedido.');
  }
  const address = preferences.address.trim();
  const observations = preferences.observations.trim();
  if (preferences.deliveryMethod === 'delivery' && !address) {
    throw new Error('Ingresa la dirección y el distrito para el delivery.');
  }
  if (address.length > 300 || observations.length > 1000) {
    throw new Error('La dirección admite 300 caracteres y las observaciones 1000.');
  }
  return [
    `Modalidad de entrega: ${preferences.deliveryMethod === 'recojo' ? 'Recojo (punto y horario por coordinar)' : 'Delivery (costo y horario por coordinar)'}`,
    ...(preferences.deliveryMethod === 'delivery' ? [`Dirección y distrito: ${address}`] : []),
    ...(observations ? [`Observaciones del cliente: ${observations}`] : []),
  ].join('\n');
}
