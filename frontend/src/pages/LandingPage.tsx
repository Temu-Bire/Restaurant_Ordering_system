import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HOME_BY_ROLE } from "../app/paths";
import PublicFooter from "../components/layout/PublicFooter";
import PublicNavbar from "../components/layout/PublicNavbar";
import AuthModal, { type AuthMode } from "../components/auth/AuthModal";
import { useAuth } from "../features/auth/useAuth";
import { useCart } from "../features/cart/useCart";
import { useTranslation } from "../hooks/useTranslation";
import type { FoodItem } from "../features/menu/types";

interface LandingPageProps {
  initialAuthMode?: AuthMode;
}

interface PopularDish {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  imageUrl: string;
  category: string;
}

const DEFAULT_POPULAR_DISHES: PopularDish[] = [
  {
    id: "pop-injera-special",
    name: "Injera Special",
    subtitle: "Traditional Ethiopian platter",
    price: 12.99,
    imageUrl: "/images/injera-special.png",
    category: "platter",
  },
  {
    id: "pop-doro-wot",
    name: "Doro Wot",
    subtitle: "Spicy chicken stew",
    price: 14.99,
    imageUrl: "/images/doro-wot.png",
    category: "stew",
  },
  {
    id: "pop-tibs",
    name: "Tibs",
    subtitle: "Tender beef with spices",
    price: 15.99,
    imageUrl: "/images/tibs.png",
    category: "beef",
  },
  {
    id: "pop-kitfo",
    name: "Kitfo",
    subtitle: "Minced raw beef",
    price: 13.99,
    imageUrl: "/images/kitfo.png",
    category: "beef",
  },
];

// The 3 Landing Page Images specified by user
const HERO_IMAGES = [
  {
    src: "/LandingPage1.png",
    title: "Injera Special Platter",
    desc: "A colorful feast of rich wots and spiced greens",
  },
  {
    src: "/LandingPage2.png",
    title: "Doro Wot Celebration",
    desc: "Authentic slow-simmered chicken with berbere",
  },
  {
    src: "/LandingPage3.png",
    title: "Special Sizzling Tibs",
    desc: "Tender beef sauteed with rosemary and niter kibbeh",
  },
];

export default function LandingPage({ initialAuthMode }: LandingPageProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(Boolean(initialAuthMode));
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuthMode || "login");

  // Track recently added item IDs for button animation
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Self-changing active image in the hero section
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // If user is already logged in and tried to visit /login or /register, redirect them
  useEffect(() => {
    if (user && initialAuthMode) {
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    }
  }, [user, initialAuthMode, navigate]);

  // Auto-cycle (self change) the hero background / featured images every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = window.setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOrderClick = () => {
    if (!user) {
      openAuth("login");
    } else {
      navigate(user.role === "customer" ? "/customer/menu" : HOME_BY_ROLE[user.role]);
    }
  };

  const handleAddToCart = (dish: PopularDish) => {
    const item: FoodItem = {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      category: dish.category,
      imageUrl: dish.imageUrl,
      available: true,
      description: dish.subtitle,
    };
    addItem(item);

    // Visual feedback on the button
    setAddedIds((prev) => ({ ...prev, [dish.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [dish.id]: false }));
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-orange-500 selection:text-white">
      {/* Centered Auth Modal for Login and Register */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => {
          setAuthModalOpen(false);
          // If we were at /login or /register, clean up URL to /
          if (initialAuthMode) {
            navigate("/", { replace: true });
          }
        }}
        onSuccess={() => {
          setAuthModalOpen(false);
          if (initialAuthMode) {
            navigate("/", { replace: true });
          }
        }}
      />

      {/* Top Navbar */}
      <PublicNavbar onOpenAuth={openAuth} />

      <main>
        {/* ========================================================================= */}
        {/* HERO SECTION: Orange & Dark Brown Background with 3 Animated Images       */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#16120e] via-[#2a170d] to-[#e65100] text-white pt-6 pb-20 lg:pt-12 lg:pb-32">
          {/* Subtle Ambient Radial Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-orange-600/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -right-24 size-[32rem] rounded-full bg-amber-500/20 blur-3xl"
          />

          <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Heading, Subtitle, and CTA Buttons */}
              <div className="lg:col-span-6 space-y-6">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.12]">
                  Taste Ethiopia.
                  <br />
                  Enjoy with{" "}
                  <span className="text-orange-400 drop-shadow-sm">
                    Arif Food!
                  </span>
                </h1>

                <p className="max-w-lg text-base sm:text-lg leading-relaxed text-stone-200 font-normal">
                  Delicious Ethiopian meals, fresh ingredients, and great taste.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleOrderClick}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-600 hover:scale-105 active:scale-95"
                  >
                    <span>{t("orderNow")}</span>
                  </button>

                  <a
                    href="#menu"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/30 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-xs transition-all hover:border-white hover:bg-black/50"
                  >
                    {t("viewMenu")}
                  </a>
                </div>

                {/* Decorative Cloche Outline at Bottom Left */}
                <div className="pt-4 flex items-center gap-3 opacity-30 pointer-events-none">
                  <svg className="size-16 text-orange-400" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="32" cy="18" r="3" />
                    <path d="M12 44C12 28 20 22 32 22C44 22 52 28 52 44" strokeLinecap="round" />
                    <path d="M8 46H56" strokeWidth="3" strokeLinecap="round" />
                    <path d="M16 50H48" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Right Column: Three Animated & Self-Changing Images */}
              <div
                className="lg:col-span-6 relative flex flex-col items-center justify-center"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Yellow decorative spark rays above the main card (\ | /) */}
                <div className="absolute -top-6 left-12 sm:left-20 z-20 animate-spark pointer-events-none">
                  <svg className="w-12 h-8 text-amber-300" viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="8" y1="28" x2="16" y2="10" />
                    <line x1="24" y1="28" x2="24" y2="4" />
                    <line x1="40" y1="28" x2="32" y2="10" />
                  </svg>
                </div>

                {/* Cards Container with 3 Floating Cards */}
                <div className="relative w-full max-w-md sm:max-w-lg aspect-[4/3] sm:aspect-[1.15/1]">
                  {/* CARD 1: Main featured card (Center/Left, tilted -6deg, animated float) */}
                  <div
                    onClick={() => setActiveHeroIndex(0)}
                    className="absolute left-2 sm:left-4 top-4 z-10 w-[68%] sm:w-[65%] cursor-pointer transition-all duration-500 hover:scale-105 animate-float-main"
                  >
                    <div className="overflow-hidden rounded-3xl border-4 border-white bg-stone-900 shadow-2xl ring-1 ring-black/20">
                      <img
                        src={HERO_IMAGES[activeHeroIndex].src}
                        alt={HERO_IMAGES[activeHeroIndex].title}
                        className="h-44 sm:h-56 w-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* CARD 2: Top-Right card (tilted 8deg, animated float) */}
                  <div
                    onClick={() => setActiveHeroIndex(1)}
                    className="absolute right-0 sm:right-2 top-0 z-0 w-[46%] sm:w-[44%] cursor-pointer transition-all duration-500 hover:scale-105 hover:z-20 animate-float-tr"
                  >
                    <div className="overflow-hidden rounded-2xl border-4 border-white bg-stone-900 shadow-xl ring-1 ring-black/20">
                      <img
                        src={HERO_IMAGES[1].src}
                        alt="Doro Wot"
                        className="h-28 sm:h-36 w-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* CARD 3: Bottom-Right card (tilted 6deg, animated float) */}
                  <div
                    onClick={() => setActiveHeroIndex(2)}
                    className="absolute right-2 sm:right-4 bottom-2 z-10 w-[52%] sm:w-[50%] cursor-pointer transition-all duration-500 hover:scale-105 hover:z-20 animate-float-br"
                  >
                    <div className="overflow-hidden rounded-2xl border-4 border-white bg-stone-900 shadow-xl ring-1 ring-black/20">
                      <img
                        src={HERO_IMAGES[2].src}
                        alt="Tibs"
                        className="h-32 sm:h-40 w-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                    </div>
                  </div>
                </div>

                {/* Self-Change Slide Indicators & Dish Name */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-xs">
                    {HERO_IMAGES.map((img, idx) => (
                      <button
                        key={img.title}
                        type="button"
                        onClick={() => setActiveHeroIndex(idx)}
                        aria-label={`Show ${img.title}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeHeroIndex === idx
                            ? "w-7 bg-orange-400"
                            : "w-2 bg-white/40 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-orange-200 font-medium">
                    {HERO_IMAGES[activeHeroIndex].title}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Smooth Bottom Wave Transition */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none z-10 pointer-events-none">
            <svg
              className="relative block w-full h-8 sm:h-12 lg:h-16 text-background fill-current"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path d="M0,0 C300,70 600,10 900,60 C1050,85 1150,40 1200,20 L1200,120 L0,120 Z" />
            </svg>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* POPULAR DISHES SECTION                                                    */}
        {/* ========================================================================= */}
        <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          {/* Centered Heading with dash lines on sides */}
          <div className="mb-12 flex items-center justify-center gap-4 text-center">
            <div className="h-0.5 w-12 sm:w-20 bg-orange-500 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t("popularDishes")}
            </h2>
            <div className="h-0.5 w-12 sm:w-20 bg-orange-500 rounded-full" />
          </div>

          {/* 4 Responsive Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DEFAULT_POPULAR_DISHES.map((dish) => {
              const isAdded = addedIds[dish.id];

              return (
                <article
                  key={dish.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
                >
                  {/* Dish Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                    />
                  </div>

                  {/* Dish Info & Action */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {dish.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        {dish.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2">
                      <span className="text-lg font-extrabold text-orange-500">
                        ${dish.price.toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(dish)}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-white transition-all active:scale-95 shadow-xs ${
                          isAdded
                            ? "bg-green-600 scale-105"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <span>✓</span>
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW IT WORKS SECTION                                                      */}
        {/* ========================================================================= */}
        <section id="about" className="scroll-mt-20 border-y border-border bg-surface/50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {/* Centered Heading */}
            <div className="mb-12 flex items-center justify-center gap-4 text-center">
              <div className="h-0.5 w-12 sm:w-20 bg-orange-500 rounded-full" />
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t("howItWorks")}
              </h2>
              <div className="h-0.5 w-12 sm:w-20 bg-orange-500 rounded-full" />
            </div>

            {/* 3 Steps with Connecting Arrows */}
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-5">
              {/* STEP 1 */}
              <div className="flex flex-col items-center text-center md:col-span-1">
                <div className="flex size-18 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-500 shadow-sm transition-transform duration-300 hover:scale-110">
                  <svg className="size-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="2" />
                    <line x1="7" y1="8" x2="17" y2="8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="7" y1="12" x2="13" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <line x1="7" y1="16" x2="11" y2="16" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  1. Browse Menu
                </h3>
                <p className="mt-1 text-xs text-muted max-w-xs">
                  Explore our delicious dishes
                </p>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex items-center justify-center md:col-span-1 text-orange-400">
                <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* STEP 2 */}
              <div className="flex flex-col items-center text-center md:col-span-1">
                <div className="flex size-18 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-500 shadow-sm transition-transform duration-300 hover:scale-110">
                  <svg className="size-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  2. Place Order
                </h3>
                <p className="mt-1 text-xs text-muted max-w-xs">
                  Add your favorite food to cart
                </p>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex items-center justify-center md:col-span-1 text-orange-400">
                <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* STEP 3 */}
              <div className="flex flex-col items-center text-center md:col-span-1">
                <div className="flex size-18 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-500 shadow-sm transition-transform duration-300 hover:scale-110">
                  <svg className="size-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="6" cy="18" r="3" strokeWidth="2" />
                    <circle cx="18" cy="18" r="3" strokeWidth="2" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 18h6m-3-12h4l3 6M10 6H6a2 2 0 00-2 2v4h4"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  3. Enjoy Your Food
                </h3>
                <p className="mt-1 text-xs text-muted max-w-xs">
                  We'll deliver or prepare for you
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CTA BANNER: Hungry? Order Now!                                            */}
        {/* ========================================================================= */}
        <section id="reviews" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-6 py-10 sm:px-12 sm:py-14 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Cloche Watermark on left */}
            <div className="absolute -left-6 -bottom-6 opacity-15 pointer-events-none">
              <svg className="size-48 text-white" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="32" cy="18" r="3" />
                <path d="M12 44C12 28 20 22 32 22C44 22 52 28 52 44" strokeLinecap="round" />
                <path d="M8 46H56" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 50H48" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Left Content */}
            <div className="relative z-10 text-center md:text-left space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                {t("readyToEat")}
              </h2>
              <p className="text-sm sm:text-base text-white/95 max-w-md">
                {t("readyToEatDesc")}
              </p>
            </div>

            {/* Right Button */}
            <div className="relative z-10 shrink-0">
              <button
                type="button"
                onClick={handleOrderClick}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-extrabold text-stone-900 shadow-lg hover:bg-stone-100 hover:scale-105 active:scale-95 transition-all"
              >
                <span>{t("orderNow")}</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
