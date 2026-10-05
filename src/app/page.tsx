'use client';

import React, { useState } from 'react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { CategoryPills } from '@/components/layout/CategoryPills';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TrustBanner } from '@/components/home/TrustBanner';
import { FeaturedOffers } from '@/components/home/FeaturedOffers';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { CatalogSection } from '@/components/home/CatalogSection';
import { HowToBuy } from '@/components/home/HowToBuy';
import { QuoteLinkSection } from '@/components/home/QuoteLinkSection';
import { TrackingPreview } from '@/components/home/TrackingPreview';
import { FaqSection } from '@/components/home/FaqSection';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TicketModal } from '@/components/cart/TicketModal';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      {/* 1. Barra de Anuncios Rotativa */}
      <AnnouncementBar />

      {/* 2. Header Oficial con Logo, Buscador, Dark Mode, Carrito y Acceso a Login */}
      <Header onSearch={setSearchQuery} />

      {/* 3. Accesos Rápidos por Categoría sincronizados con el Catálogo */}
      <CategoryPills
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Main Content Sections */}
      <main className="flex-1 space-y-6 sm:space-y-10">
        {/* 4. Hero Banner & Tarjeta del Próximo Viaje */}
        <HeroBanner onSelectCategory={setActiveCategory} />

        {/* 5. 4 Pilares de Confianza & Ticker Tiendas USA */}
        <TrustBanner />

        {/* 6. Ofertas Destacadas */}
        <FeaturedOffers />

        {/* 7. Publicidad y Banners Oficiales del CRM */}
        <CampaignBanner />

        {/* 8. Catálogo Completo Unificado (Cero Duplicidad de Encabezados) */}
        <CatalogSection
          activeCategoryFilter={activeCategory}
          onSelectCategory={setActiveCategory}
          searchFilter={searchQuery}
        />

        {/* 9. Tres Formas de Comprar */}
        <HowToBuy />

        {/* 10. Pedir por Link (CTA Principal Comprador Personal) */}
        <QuoteLinkSection />

        {/* 11. Línea de Tiempo de 6 Pasos & Consulta Rápida */}
        <TrackingPreview />

        {/* 12. Preguntas Frecuentes y Asistente de IA */}
        <FaqSection />

        {/* 13. Testimonios Reales de Clientes */}
        <ReviewsSection />
      </main>

      {/* 14. Footer */}
      <Footer />

      {/* 15. Elementos Flotantes & Modales */}
      <CartDrawer />
      <TicketModal />
      <MobileBottomNav />

      {/* Botón Flotante de WhatsApp para Desktop */}
      <a
        href="https://wa.me/51960759244?text=Hola,%20deseo%20hacerte%20una%20consulta%20sobre%20el%20pr%C3%B3ximo%20viaje"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Habla conmigo por WhatsApp"
        className="hidden sm:flex fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-4 py-3 rounded-full shadow-2xl items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-2xl">chat</span>
        <span className="text-xs">Habla conmigo</span>
      </a>
    </div>
  );
}
