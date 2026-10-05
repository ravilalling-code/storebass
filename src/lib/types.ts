export interface Category {
  id?: string | number;
  name: string;
  icon?: string;
  description?: string;
  active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string | number;
  name: string;
  category: string;
  regular_price?: number;
  regularPrice?: number;
  price: number;
  delivery: string;
  img: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TicketItem {
  id?: string | number;
  title: string;
  price: number;
  quantity?: number;
}

export type TicketStatus =
  | 'Pendiente'
  | 'Cotizado'
  | 'Confirmado y pagado'
  | 'Comprado en USA'
  | 'En camino a Perú'
  | 'Listo para entrega'
  | 'Entregado'
  | 'Cancelado';

export interface Ticket {
  id?: string;
  ticket_code: string;
  ticketId?: string;
  correlativo: number;
  origen: 'Web' | 'WhatsApp';
  cliente: string;
  telefono: string;
  detalle: string;
  total: number;
  estado: TicketStatus;
  tipo?: 'compra_lista' | 'cotizacion_links' | 'whatsapp_manual';
  items?: TicketItem[];
  notas_admin?: string;
  created_at?: string;
  fecha?: string;
}

export interface AdBanner {
  id?: string | number;
  title: string;
  subtitle?: string;
  tag?: string;
  btn_text?: string;
  btnText?: string;
  link?: string;
  img: string;
  active?: boolean;
  display_order?: number;
  created_at?: string;
}

export interface TripConfig {
  id?: number;
  brand_name: string;
  brandName?: string;
  admin_name: string;
  adminName?: string;
  phone: string;
  phone_digits: string;
  phoneDigits?: string;
  date_ida: string;
  dateIda?: string;
  date_regreso: string;
  dateRegreso?: string;
  status: string;
  announcements: string[];
}

export interface ShippingTracking {
  id?: string;
  code: string;
  client: string;
  item: string;
  route: string;
  status: string;
  created_at?: string;
}
