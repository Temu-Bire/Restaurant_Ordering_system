import { useEffect, useState, useRef, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { HOME_BY_ROLE } from "../app/paths";
import PublicFooter from "../components/layout/PublicFooter";
import PublicNavbar from "../components/layout/PublicNavbar";
import AuthModal, { type AuthMode } from "../components/auth/AuthModal";
import { useAuth } from "../features/auth/useAuth";
import { useCart } from "../features/cart/useCart";
import { useTranslation } from "../hooks/useTranslation";
import { formatCurrency } from "../utils/formatCurrency";
import { listFoods, type ApiFood } from "../features/menu/menuApi";
import type { FoodItem } from "../features/menu/types";

interface LandingPageProps {
  initialAuthMode?: AuthMode;
}

interface DishItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  ingredients: string[];
  price: number;
  imageUrl: string;
  category: string;
}

// 8 Signature Ethiopian Specialties
const SIGNATURE_ETHIOPIAN_DISHES: DishItem[] = [
  {
    id: "pop-beef-tibs",
    name: "Special Beef Tibs",
    subtitle: "ልዩ የበሬ ጥብስ",
    description: "Tender prime beef cubes sauteed with spiced butter (niter kibbeh), fresh rosemary, garlic, and jalapeños, served with warm 100% teff injera.",
    ingredients: ["Prime Beef", "Niter Kibbeh", "Rosemary", "Jalapeños", "Garlic & Ginger", "Teff Injera"],
    price: 480,
    imageUrl: "/images/beef-tibs.jpg",
    category: "tibs",
  },
  {
    id: "pop-shekla-tibs",
    name: "Shekla Tibs",
    subtitle: "የሸክላ ጥብስ",
    description: "Sizzling marinated beef served on a traditional clay pot over glowing hot charcoal, accompanied by fresh awaze and mitmita.",
    ingredients: ["Marinated Beef", "Awaze", "Mitmita", "Clay Pot Charcoal", "Spiced Butter", "Teff Injera"],
    price: 520,
    imageUrl: "/images/shekla-tibs.jpg",
    category: "tibs",
  },
  {
    id: "pop-doro-wat",
    name: "Doro Wat (Special Feast)",
    subtitle: "የበዓል ዶሮ ወጥ",
    description: "Celebratory slow-simmered chicken drumstick in a rich, velvety berbere sauce with caramelized onions, hard-boiled egg, and fresh ayib cottage cheese.",
    ingredients: ["Country Chicken", "Organic Berbere", "Niter Kibbeh", "Hard-Boiled Egg", "Ayib Cheese", "Teff Injera"],
    price: 580,
    imageUrl: "/images/doro-wot-feast.jpg",
    category: "stew",
  },
  {
    id: "pop-kitfo",
    name: "Special Kitfo",
    subtitle: "ልዩ ክትፎ",
    description: "Minced prime lean beef lightly warmed with purified spiced clarified butter and fiery mitmita, served with seasoned collard greens (gomen), ayib, and kocho.",
    ingredients: ["Prime Lean Beef", "Clarified Spiced Butter", "Mitmita", "Gomen Greens", "Fresh Ayib", "Kocho"],
    price: 550,
    imageUrl: "/images/special-kitfo.jpg",
    category: "beef",
  },
  {
    id: "pop-shiro",
    name: "Shiro Tegabino",
    subtitle: "ተጋቢኖ ሽሮ",
    description: "Richly spiced ground chickpea flour stew simmering hot in a handmade clay bowl with garlic and herbs. A comforting staple paired with soft injera.",
    ingredients: ["Spiced Chickpea Flour", "Garlic & Herbs", "Red Onions", "Berbere", "Teff Injera"],
    price: 260,
    imageUrl: "/images/shiro.jpg",
    category: "vegetarian",
  },
  {
    id: "pop-beyaynetu",
    name: "Beyaynetu (Fasting Platter)",
    subtitle: "የጾም በያይነቱ",
    description: "A colorful traditional feast platter presenting red lentil stew (misir wot), yellow split peas (kik alicha), collard greens, spiced cabbage, and beetroot salad.",
    ingredients: ["Misir Lentils", "Kik Split Peas", "Gomen Greens", "Atkilt Cabbage", "Beetroot", "Teff Injera"],
    price: 320,
    imageUrl: "/images/beyaynetu.jpg",
    category: "vegetarian",
  },
  {
    id: "pop-firfir",
    name: "Ethiopian Beef Firfir",
    subtitle: "ልዩ የበሬ ፍርፍር",
    description: "Shredded pieces of soft teff flatbread tossed in a robust spicy berbere sauce enriched with tender beef bits and fragrant niter kibbeh.",
    ingredients: ["Shredded Injera", "Tender Beef", "Berbere Sauce", "Spiced Butter", "Green Chili"],
    price: 290,
    imageUrl: "/images/tibs.png",
    category: "breakfast",
  },
  {
    id: "pop-buna",
    name: "Habesha Buna Ceremony",
    subtitle: "የሀበሻ ጀበና ቡና",
    description: "Authentic Ethiopian organic coffee roasted fresh on pan, traditionally brewed in a clay Jebena pot, served with popped corn and aromatic frankincense.",
    ingredients: ["Sidama Arabica Beans", "Clay Jebena Brew", "Fresh Popcorn", "Aromatic Frankincense"],
    price: 90,
    imageUrl: "/images/restaurant-interior.jpg",
    category: "coffee",
  },
];

// The Three Slide Images for the Full Hero Background Slideshow:
// 1. Authentic Ethiopian traditional food
// 2. Beautiful Ethiopian restaurant interior and dining area
// 3. Restaurant building with an outdoor patio
const HERO_SLIDES = [
  {
    src: "/LandingPage1.png",
    tag: "Authentic Cuisine",
    title: "Traditional Ethiopian Feast",
    description: "Communal platters with rich wots, tender sauteed meats, and pure teff injera.",
  },
  {
    src: "/images/restaurant-interior.jpg",
    tag: "Upscale Atmosphere",
    title: "Authentic Cultural Dining",
    description: "Intimate woven mesob tables, warm glowing lanterns, and hospitable Habesha service.",
  },
  {
    src: "/images/restaurant-patio.jpg",
    tag: "Outdoor Patio",
    title: "Breezy Al Fresco Dining",
    description: "Evening ambiance under bistro string lights with Addis Ababa's gentle night breeze.",
  },
];

export default function LandingPage({ initialAuthMode }: LandingPageProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(Boolean(initialAuthMode));
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuthMode || "login");
  const [authRedirect, setAuthRedirect] = useState<string | undefined>(undefined);

  // Track added items for quick UI feedback
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Dish details modal state
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  // 3-Image Automatic Background Slideshow state (5 seconds)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Redirect if logged-in user visits auth url directly
  useEffect(() => {
    if (user && initialAuthMode) {
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    }
  }, [user, initialAuthMode, navigate]);

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

  // Connect to live backend menu API with fallback
  const [dishes, setDishes] = useState<DishItem[]>(SIGNATURE_ETHIOPIAN_DISHES);
  useEffect(() => {
    listFoods()
      .then((apiItems: ApiFood[]) => {
        if (apiItems && apiItems.length > 0) {
          const mapped: DishItem[] = apiItems
            .filter((item) => item.isAvailable)
            .slice(0, 8)
            .map((item) => {
              const matched = SIGNATURE_ETHIOPIAN_DISHES.find(
                (d) => d.name.toLowerCase().includes(item.name.toLowerCase()) ||
                       item.name.toLowerCase().includes(d.name.toLowerCase())
              );
              return {
                id: item.id,
                name: item.name,
                subtitle: matched?.subtitle || item.category?.name || "Authentic Specialty",
                description: item.description || matched?.description || "Freshly cooked Ethiopian dish prepared with care.",
                ingredients: matched?.ingredients || ["Fresh Ingredients", "Spices", "Teff Injera"],
                price: Number(item.price) || matched?.price || 450,
                imageUrl: item.imageUrl || matched?.imageUrl || "/images/injera-special.png",
                category: item.category?.name || "specialty",
              };
            });
          if (mapped.length >= 4) {
            setDishes(mapped);
          }
        }
      })
      .catch((err) => console.log("Using signature Ethiopian menu fallback:", err));
  }, []);

  const openAuth = (mode: AuthMode, redirect?: string) => {
    setAuthMode(mode);
    setAuthRedirect(redirect);
    setAuthModalOpen(true);
  };

  const handleStartOrdering = () => {
    if (!user) {
      openAuth("register", "/customer/menu");
    } else {
      navigate(user.role === "customer" ? "/customer/menu" : HOME_BY_ROLE[user.role]);
    }
  };

  const handleAddToCart = (dish: DishItem, qty = 1) => {
    const item: FoodItem = {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      category: dish.category,
      imageUrl: dish.imageUrl,
      available: true,
      description: dish.description,
    };
    for (let i = 0; i < qty; i++) {
      addItem(item);
    }

    setAddedIds((prev) => ({ ...prev, [dish.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [dish.id]: false }));
    }, 1400);

    if (selectedDish) {
      setSelectedDish(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-orange-500 selection:text-white">
      {/* Centered Auth Modal for Login and Register (Wide, Eye Password Icons, Forgot Password, Confirm Password) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        redirectTo={authRedirect}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthRedirect(undefined);
          if (initialAuthMode) navigate("/", { replace: true });
        }}
        onSuccess={() => {
          setAuthModalOpen(false);
          const destination = authRedirect || "/customer/menu";
          setAuthRedirect(undefined);
          navigate(destination);
        }}
      />

      {/* Dish Details Modal */}
      {selectedDish && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDish(null);
          }}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedDish(null)}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-colors hover:bg-orange-500"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Dish Image */}
            <div className="relative h-60 w-full overflow-hidden bg-stone-900">
              <img
                src={selectedDish.imageUrl}
                alt={selectedDish.name}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="rounded-full bg-orange-500/90 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                  {selectedDish.subtitle}
                </span>
                <h3 className="mt-1 text-2xl font-black text-white">
                  {selectedDish.name}
                </h3>
              </div>
            </div>

            {/* Dish Details */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted leading-relaxed">
                {selectedDish.description}
              </p>

              {/* Ingredients List */}
              {selectedDish.ingredients && selectedDish.ingredients.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    {t("ingredients")}:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDish.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="rounded-lg border border-border bg-surface-secondary px-2.5 py-1 text-xs text-muted"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Quantity & Add to Cart */}
              <div className="pt-2 flex items-center justify-between border-t border-border">
                <div>
                  <span className="text-xs text-muted block">Price</span>
                  <span className="text-xl font-black text-orange-500">
                    {formatCurrency(selectedDish.price * detailQuantity)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center rounded-full border border-border bg-surface-secondary px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setDetailQuantity((q) => Math.max(1, q - 1))}
                      className="size-7 flex items-center justify-center rounded-full text-foreground hover:bg-border text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-foreground">
                      {detailQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailQuantity((q) => q + 1)}
                      className="size-7 flex items-center justify-center rounded-full text-foreground hover:bg-border text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(selectedDish, detailQuantity)}
                    className="rounded-full bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600 active:scale-95"
                  >
                    {t("addToCart")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <PublicNavbar onOpenAuth={openAuth} />

      <main>
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: 3-IMAGE BACKGROUND SLIDESHOW WITH < > ARROWS             */}
        {/* ========================================================================= */}
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

            {/* Premium Dark Gradient Overlays for optimal contrast and readability */}
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

          {/* Hero Content (Centered with max-w-4xl, right-side image section removed) */}
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

        {/* ========================================================================= */}
        {/* 2. POPULAR DISHES SECTION                                                 */}
        {/* ========================================================================= */}
        <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-0.5 w-10 sm:w-16 bg-orange-500/70 rounded-full" />
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {t("popularDishes")}
              </h2>
              <div className="h-0.5 w-10 sm:w-16 bg-orange-500/70 rounded-full" />
            </div>
            <p className="text-sm text-muted">
              {t("popularSubtitle")}
            </p>
          </div>

          {/* 8 Signature Dishes Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dishes.map((dish) => {
              const isAdded = addedIds[dish.id];

              return (
                <article
                  key={dish.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
                >
                  {/* Dish Image */}
                  <div
                    className="relative h-44 w-full overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer"
                    onClick={() => {
                      setSelectedDish(dish);
                      setDetailQuantity(1);
                    }}
                  >
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                    />
                    <div className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      {dish.subtitle}
                    </div>
                  </div>

                  {/* Dish Info & Actions (Description Removed, Wide Add to Cart, Price & View Details Below) */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3
                        onClick={() => {
                          setSelectedDish(dish);
                          setDetailQuantity(1);
                        }}
                        className="text-base font-bold text-foreground cursor-pointer hover:text-orange-500 transition-colors line-clamp-1"
                      >
                        {dish.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-orange-500/90 font-medium">
                        {dish.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 space-y-2.5 border-t border-border/60">
                      {/* Full-width Add to Cart button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(dish)}
                        className={`w-full flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold text-white transition-all active:scale-95 shadow-xs ${
                          isAdded
                            ? "bg-green-600 scale-[1.02]"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <span>✓</span>
                            <span>Added to Cart</span>
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

                      {/* Row below Add to Cart: Price on left, View Details on right */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-base font-black text-orange-500">
                          {formatCurrency(dish.price)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDish(dish);
                            setDetailQuantity(1);
                          }}
                          className="rounded-full border border-border bg-surface-secondary px-3.5 py-1 text-xs font-semibold text-foreground hover:border-orange-500 hover:text-orange-500 transition-colors"
                        >
                          {t("viewDetails")}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* View Full Menu Button */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={handleStartOrdering}
              className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-8 py-3 text-sm font-bold text-orange-500 transition-all hover:bg-orange-500 hover:text-white"
            >
              <span>{t("seeFullMenu")}</span>
              <span>→</span>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. ABOUT SECTION: Ethiopian Food Culture & Heritage                       */}
        {/* ========================================================================= */}
        <section id="about" className="scroll-mt-20 border-y border-border bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
              {/* Left Column: Story & Culture */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1 text-xs font-bold text-orange-500 uppercase tracking-wider">
                  Our Culinary Story
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {t("aboutTitle")}
                </h2>

                <p className="text-base text-muted leading-relaxed">
                  {t("aboutDesc")}
                </p>

                <p className="text-sm text-muted leading-relaxed">
                  In Ethiopia, food is never just sustenance—it is communion. Eating around a woven Mesob basket with friends and family represents warmth, unity, and the timeless tradition of <em>gursha</em>, the gesture of feeding one another as a sign of love and friendship.
                </p>

                {/* 4 Pillars Grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="rounded-2xl border border-border bg-background p-4 shadow-xs">
                    <span className="text-2xl">🌾</span>
                    <h4 className="mt-2 text-sm font-bold text-foreground">100% Pure Teff</h4>
                    <p className="mt-0.5 text-xs text-muted">Fermented naturally for soft, spongy injera.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4 shadow-xs">
                    <span className="text-2xl">🌶️</span>
                    <h4 className="mt-2 text-sm font-bold text-foreground">Artisanal Berbere</h4>
                    <p className="mt-0.5 text-xs text-muted">Sun-dried red peppers ground with traditional herbs.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4 shadow-xs">
                    <span className="text-2xl">🧈</span>
                    <h4 className="mt-2 text-sm font-bold text-foreground">Niter Kibbeh</h4>
                    <p className="mt-0.5 text-xs text-muted">Clarified butter infused with cardamom and ginger.</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4 shadow-xs">
                    <span className="text-2xl">☕</span>
                    <h4 className="mt-2 text-sm font-bold text-foreground">Buna Ceremony</h4>
                    <p className="mt-0.5 text-xs text-muted">Freshly roasted organic beans brewed in a clay pot.</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Imagery of Dining Interior & Exterior */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="col-span-2 overflow-hidden rounded-3xl border-4 border-white/90 shadow-xl">
                  <img
                    src="/images/restaurant-interior.jpg"
                    alt="Arif Food Interior"
                    className="h-60 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border-2 border-white/90 shadow-md">
                  <img
                    src="/images/restaurant-patio.jpg"
                    alt="Arif Food Patio"
                    className="h-36 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border-2 border-white/90 shadow-md">
                  <img
                    src="/images/shekla-tibs.jpg"
                    alt="Authentic Shekla Tibs"
                    className="h-36 w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. HOW IT WORKS SECTION                                                   */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20 bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="h-0.5 w-10 sm:w-16 bg-orange-500/70 rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {t("howItWorks")}
                </h2>
                <div className="h-0.5 w-10 sm:w-16 bg-orange-500/70 rounded-full" />
              </div>
            </div>

            {/* 3 Connected Steps with subtle flow arrows */}
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center rounded-2xl border border-border bg-surface p-6 shadow-xs">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 mb-4 shadow-xs">
                  <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="2" />
                    <line x1="8" y1="6" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="10" x2="16" y2="10" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="14" x2="12" y2="14" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("step1Title")}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {t("step1Desc")}
                </p>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex items-center justify-center text-orange-500/60">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center rounded-2xl border border-border bg-surface p-6 shadow-xs">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 mb-4 shadow-xs">
                  <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("step2Title")}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {t("step2Desc")}
                </p>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex items-center justify-center text-orange-500/60">
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center rounded-2xl border border-border bg-surface p-6 shadow-xs">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 mb-4 shadow-xs">
                  <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="7" cy="17" r="3" strokeWidth="2" />
                    <circle cx="17" cy="17" r="3" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 17h-2v-4l3-6h7l3 6h3v4h-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("step3Title")}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {t("step3Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. ORDER TYPES SECTION                                                    */}
        {/* ========================================================================= */}
        <section id="order-types" className="scroll-mt-20 border-t border-border bg-surface/50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t("eatWayYouLike")}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {/* Dine-in */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10 text-2xl mb-4">
                    🍽️
                  </span>
                  <h3 className="text-base font-bold text-foreground">{t("dineIn")}</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{t("dineInDesc")}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-semibold text-orange-500">
                  ✓ Table-side mesob service
                </div>
              </div>

              {/* Takeaway */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10 text-2xl mb-4">
                    🥡
                  </span>
                  <h3 className="text-base font-bold text-foreground">{t("takeaway")}</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{t("takeawayDesc")}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-semibold text-orange-500">
                  ✓ Hot & insulated packaging
                </div>
              </div>

              {/* Delivery */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10 text-2xl mb-4">
                    🛵
                  </span>
                  <h3 className="text-base font-bold text-foreground">{t("delivery")}</h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{t("deliveryDesc")}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-semibold text-orange-500">
                  ✓ Doorstep delivery in Addis Ababa
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. CALL TO ACTION SECTION                                                 */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-6 py-12 sm:px-12 sm:py-16 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Cloche Watermark */}
            <div className="absolute -left-6 -bottom-6 opacity-15 pointer-events-none">
              <svg className="size-56 text-white" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="32" cy="18" r="3" />
                <path d="M12 44C12 28 20 22 32 22C44 22 52 28 52 44" strokeLinecap="round" />
                <path d="M8 46H56" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 50H48" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Left Content */}
            <div className="relative z-10 text-center md:text-left space-y-2 max-w-xl">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
                {t("readyToEat")}
              </h2>
              <p className="text-sm sm:text-base text-white/95 leading-relaxed">
                {t("readyToEatDesc")}
              </p>
            </div>

            {/* Right Button */}
            <div className="relative z-10 shrink-0">
              <button
                type="button"
                onClick={handleStartOrdering}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-9 py-4 text-sm font-black text-stone-900 shadow-xl hover:bg-stone-100 hover:scale-105 active:scale-95 transition-all"
              >
                <span>{t("startOrdering")}</span>
                <span className="text-base">→</span>
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
