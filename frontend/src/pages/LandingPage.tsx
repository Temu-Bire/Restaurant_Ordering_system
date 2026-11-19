import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HOME_BY_ROLE } from "../app/paths";
import PublicFooter from "../shared/components/layout/PublicFooter";
import PublicNavbar from "../shared/components/layout/PublicNavbar";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useCart } from "../features/cart/hooks/useCart";
import { listFoods, type ApiFood } from "../features/menu/api/menuApi";
import type { FoodItem } from "../features/menu/types";
import {
  SIGNATURE_ETHIOPIAN_DISHES,
  type DishItem,
} from "./landing/components/landingData";
import HeroSection from "./landing/components/HeroSection";
import PopularDishesSection from "./landing/components/PopularDishesSection";
import AboutSection from "./landing/components/AboutSection";
import HowItWorksSection from "./landing/components/HowItWorksSection";
import DishDetailModal from "./landing/components/DishDetailModal";

export default function LandingPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  // Track added items for visual feedback animation
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Dish details modal state
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);

  // Live backend menu dishes with fallback
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
                (d) =>
                  d.name.toLowerCase().includes(item.name.toLowerCase()) ||
                  item.name.toLowerCase().includes(d.name.toLowerCase())
              );
              return {
                id: item.id,
                name: item.name,
                subtitle: matched?.subtitle || item.category?.name || "Authentic Specialty",
                description:
                  item.description ||
                  matched?.description ||
                  "Freshly cooked Ethiopian dish prepared with care.",
                ingredients: matched?.ingredients || [
                  "Fresh Ingredients",
                  "Spices",
                  "Teff Injera",
                ],
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

  const handleStartOrdering = () => {
    if (!user) {
      navigate("/register", { state: { from: "/customer/menu" } });
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
      {/* Top Navbar with direct full-page links to /login & /register */}
      <PublicNavbar />

      <main>
        {/* 1. Hero Section with 3-Slide Background and CTA */}
        <HeroSection />

        {/* 2. Popular Dishes Grid */}
        <PopularDishesSection
          dishes={dishes}
          addedIds={addedIds}
          onSelectDish={setSelectedDish}
          onAddToCart={handleAddToCart}
          onSeeFullMenu={handleStartOrdering}
        />

        {/* 3. About Section: Culinary Story & 4 Pillars */}
        <AboutSection />

        {/* 4. How It Works Section */}
        <HowItWorksSection />
      </main>

      {/* Dish Details Modal */}
      <DishDetailModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
