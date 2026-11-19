import { useState, useEffect, useRef, useTransition } from "react";
import { HERO_SLIDES } from "./landingData";
import { useTranslation } from "../../../shared/hooks/useTranslation";

export default function HeroSection() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  // Slideshow automatic 5-second interval
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || isPaused) return;

    timerRef.current = window.setInterval(() => {
      startTransition(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      });
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  return (
    <section
      id="home"
      className="relative overflow-hidden min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center justify-center text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Full-Bleed 3-Image Slideshow Background */}
      <div className="absolute inset-0 z-0">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = currentSlide === index;
          return (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <img
                src={slide.src}
                alt={slide.title}
                className="size-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Premium Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/60" />
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-[#111318]/70" />
      </div>

      {/* Left Arrow Navigation Button */}
      <button
        type="button"
        onClick={() =>
          setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
        }
        aria-label="Previous slide"
        className="absolute left-3 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-30 flex size-12 sm:size-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:bg-orange-500 hover:border-orange-500 hover:scale-110 active:scale-95 text-2xl font-bold"
      >
        ‹
      </button>

      {/* Right Arrow Navigation Button */}
      <button
        type="button"
        onClick={() =>
          setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
        }
        aria-label="Next slide"
        className="absolute right-3 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 flex size-12 sm:size-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:bg-orange-500 hover:border-orange-500 hover:scale-110 active:scale-95 text-2xl font-bold"
      >
        ›
      </button>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-8 sm:px-14 text-center py-20 lg:py-28 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/20 px-4 py-1.5 text-xs font-semibold text-orange-300 backdrop-blur-sm">
          <span>✨</span>
          <span>Authentic Ethiopian Cuisine · {HERO_SLIDES[currentSlide].tag}</span>
        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] text-white drop-shadow-md">
          Experience the{" "}
          <span className="text-orange-400 drop-shadow-lg">
            Authentic Taste
          </span>{" "}
          of Ethiopia
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg lg:text-xl text-stone-200 font-normal leading-relaxed drop-shadow">
          Discover traditional Ethiopian flavors, freshly prepared with love and served with care.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href="#menu"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-600/30 transition-all hover:bg-orange-600 hover:scale-105 active:scale-95"
          >
            <span>{t("exploreMenu")}</span>
            <span className="text-base">→</span>
          </a>

          <a
            href="#about"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/40 px-8 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:border-orange-400 hover:bg-black/60 hover:text-orange-300"
          >
            {t("discoverStory")}
          </a>
        </div>

        {/* Slide Indicators with active title */}
        <div className="pt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-full bg-black/50 px-4 py-2 backdrop-blur-md border border-white/10">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}: ${slide.title}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? "w-8 bg-orange-500 shadow-sm"
                    : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-orange-200 font-medium drop-shadow">
            {HERO_SLIDES[currentSlide].title} — {HERO_SLIDES[currentSlide].description}
          </p>
        </div>

        {/* Trust stats row */}
        <div className="pt-4 grid grid-cols-3 gap-6 max-w-lg mx-auto border-t border-white/15">
          <div>
            <span className="text-2xl font-black text-orange-400">100%</span>
            <p className="text-xs text-stone-300 mt-0.5">Teff Injera</p>
          </div>
          <div>
            <span className="text-2xl font-black text-orange-400">Fresh</span>
            <p className="text-xs text-stone-300 mt-0.5">Berbere Spices</p>
          </div>
          <div>
            <span className="text-2xl font-black text-orange-400">4.9 ★</span>
            <p className="text-xs text-stone-300 mt-0.5">Customer Rating</p>
          </div>
        </div>
      </div>

      {/* Smooth Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none z-10 pointer-events-none">
        <svg
          className="relative block w-full h-8 sm:h-12 text-background fill-current"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C300,70 600,10 900,60 C1050,85 1150,40 1200,20 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
