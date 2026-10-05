'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AdBanner } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { INITIAL_TRENDS } from './TrendsCarousel';

interface HeroBannerProps {
  onSelectCategory?: (category: string) => void;
}

export function HeroBanner({ onSelectCategory: _onSelectCategory }: HeroBannerProps) {
  const [trends, setTrends] = useState<AdBanner[]>(INITIAL_TRENDS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadTrendsData = async () => {
    try {
      const stored = localStorage.getItem('storebass_ads');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeOnly = parsed.filter((item: AdBanner) => item.active !== false);
          if (activeOnly.length > 0) setTrends(activeOnly);
        }
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setTrends(data);
        localStorage.setItem('storebass_ads', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('[HeroBanner] Error al cargar tendencias desde Supabase:', err);
    }
  };

  useEffect(() => {
    loadTrendsData();
    const handleUpdate = () => loadTrendsData();
    window.addEventListener('storebass_ads_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('storebass_ads_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (trends.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trends.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trends.length]);

  useEffect(() => {
    if (currentSlide >= trends.length) setCurrentSlide(0);
  }, [currentSlide, trends.length]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl aspect-[16/9] sm:aspect-[16/7] lg:aspect-[16/6]">
        {trends.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className="absolute inset-0"
            aria-hidden={idx !== currentSlide}
            style={{
              opacity: idx === currentSlide ? 1 : 0,
              transition: 'opacity 900ms cubic-bezier(0.23, 1, 0.32, 1)',
              zIndex: idx === currentSlide ? 1 : 0,
            }}
          >
            {/* Las imágenes del CRM se muestran limpias, sin textos, badges, flechas ni degradados superpuestos. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.img}
              alt={slide.title || `Imagen ${idx + 1}`}
              className="h-full w-full object-cover object-center"
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
