import { useState, useEffect, useCallback } from "react";
import { HERO_SLIDES } from "./landingData";
import { useTranslation } from "../../../shared/hooks/useTranslation";

const SLIDE_DURATION_MS = 5000;
const MIN_SWIPE_DISTANCE = 45;

export default function HeroSection() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Preload all slide images on mount to avoid white flashes or delays
  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  }, []);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Automatic slideshow: smoothly advances every 5 seconds and resets upon slide change
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timer);
  }, [currentSlide]);

  // Touch swipe handling for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > MIN_SWIPE_DISTANCE) {
      handleNext();
    } else if (distance < -MIN_SWIPE_DISTANCE) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleTouchCancel = () => {
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  const activeSlideData = HERO_SLIDES[currentSlide] || HERO_SLIDES[0];

  return (
    <section
      id="home"
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero Ethiopian Cuisine Carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="relative overflow-hidden min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] flex items-center justify-center text-white focus:outline-hidden"
    >
      {/* Full-Bleed Animated Horizontal Slide Track */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {HERO_SLIDES.map((slide, index) => {
          const offset = index - currentSlide;
          return (
            <div
              key={`${slide.src}-${index}`}
              className="absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out will-change-transform"
              style={{
                transform: `translateX(${offset * 100}%)`,
              }}
            >
              <img
                src={slide.src}
                alt={slide.title}
                className={`size-full object-cover object-center transition-transform duration-1000 ease-out ${
                  offset === 0 ? "scale-105" : "scale-100"
                }`}
                loading={index === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.src.endsWith("/LandingPage1.png")) {
                    target.src = "/LandingPage1.png";
                  }
                }}
              />
            </div>
          );
        })}

        {/* Balanced Dark Overlay: Keeps images clear & vibrant while ensuring text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/55 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      {/* Left Arrow Navigation Button */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous background slide"
        className="absolute left-3 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-30 flex size-12 sm:size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:bg-orange-500 hover:border-orange-500 hover:scale-110 active:scale-95 text-2xl font-bold cursor-pointer"
      >
        ‹
      </button>

      {/* Right Arrow Navigation Button */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next background slide"
        className="absolute right-3 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 flex size-12 sm:size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:bg-orange-500 hover:border-orange-500 hover:scale-110 active:scale-95 text-2xl font-bold cursor-pointer"
      >
        ›
      </button>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-8 sm:px-14 text-center py-20 lg:py-28 space-y-6">        

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

        {/* Slide Indicators with active title and progress indicator */}
        <div className="pt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full bg-black/60 px-4 py-2 backdrop-blur-md border border-white/10 shadow-lg">
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = currentSlide === idx;
              return (
                <button
                  key={`${slide.title}-${idx}`}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Slide ${idx + 1}: ${slide.title}`}
                  className={`relative h-2.5 rounded-full transition-all duration-500 overflow-hidden cursor-pointer ${
                    isActive
                      ? "w-10 bg-orange-500 shadow-md shadow-orange-500/50"
                      : "w-2.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              );
            })}
            
          </div>

          <p className="text-xs text-orange-200 font-medium drop-shadow transition-all duration-300 max-w-md">
            <span className="font-semibold text-white">{activeSlideData.title}</span> —{" "}
            {activeSlideData.description}
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
