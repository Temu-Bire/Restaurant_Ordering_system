export interface DishItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  ingredients: string[];
  price: number;
  imageUrl: string;
  category: string;
}

export interface HeroSlide {
  src: string;
  tag: string;
  title: string;
  description: string;
}

export const SIGNATURE_ETHIOPIAN_DISHES: DishItem[] = [
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

export const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/LandingPage1.png",
    tag: "Authentic Cuisine",
    title: "Traditional Ethiopian Feast",
    description: "Communal platters with rich wots, tender sauteed meats, and pure teff injera.",
  },
  {
    src: "/LandingPage3.png",
    tag: "Signature Specialties",
    title: "Handcrafted Culinary Excellence",
    description: "Savor sizzling tibs, velvety slow-cooked wots, and warm fresh teff injera.",
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
