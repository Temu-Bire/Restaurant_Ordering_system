import { useEffect, useState } from "react";
import { HOME_BY_ROLE } from "../app/paths";
import PublicFooter from "../components/layout/PublicFooter";
import PublicNavbar from "../components/layout/PublicNavbar";
import LinkButton from "../components/ui/LinkButton";
import { useAuth } from "../features/auth/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { listFoods, type ApiFood } from "../features/menu/menuApi";
import { formatCurrency } from "../utils/formatCurrency";

export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [foods, setFoods] = useState<ApiFood[]>([]);

  useEffect(() => {
    listFoods()
      .then(setFoods)
      .catch((err) => console.error("Failed to load foods on landing page", err));
  }, []);

  const steps = [
    {
      icon: "🥘",
      title: t("step1Title"),
      text: t("step1Desc"),
    },
    {
      icon: "🧾",
      title: t("step2Title"),
      text: t("step2Desc"),
    },
    {
      icon: "⏱️",
      title: t("step3Title"),
      text: t("step3Desc"),
    },
  ];

  const orderTypes = [
    {
      icon: "🍽️",
      title: t("dineIn"),
      text: t("dineInDesc"),
    },
    {
      icon: "🥡",
      title: t("takeaway"),
      text: t("takeawayDesc"),
    },
    {
      icon: "🛵",
      title: t("delivery"),
      text: t("deliveryDesc"),
    },
  ];

  // Where the "order" buttons lead, depending on who is looking
  const orderPath = !user
    ? "/register"
    : user.role === "customer"
      ? "/customer/menu"
      : HOME_BY_ROLE[user.role];

  const popular = foods.filter((f) => f.isAvailable).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <main>
        {/* Hero Section */}
        <section className="overflow-hidden bg-gradient-to-br from-orange-500 via-primary to-orange-900 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl tracking-tight">
                {t("heroTitle")}
              </h1>
              <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-white/90">
                {t("heroSubtitle")}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton to={orderPath} variant="light" size="lg" className="w-full sm:w-auto justify-center">
                  {user ? t("navDashboard") : t("orderNow")}
                </LinkButton>
                {!user && (
                  <LinkButton to="/login" variant="outlineLight" size="lg" className="w-full sm:w-auto justify-center">
                    {t("navLogin")}
                  </LinkButton>
                )}
              </div>
            </div>

            {/* Decorative visual on desktop */}
            <div
              aria-hidden="true"
              className="relative mx-auto hidden aspect-square w-full max-w-sm lg:block"
            >
              <div className="absolute inset-0 rounded-full bg-white/15" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-red-500 to-amber-300 shadow-2xl" />

              <div className="absolute -left-6 top-10 rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-xl">
                <p className="text-[13px] font-bold">Special Beef Tibs</p>
                <p className="text-xs text-muted">{formatCurrency(480)}</p>
              </div>

              <div className="absolute -right-4 bottom-12 rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-xl">
                <p className="text-[13px] font-bold">{t("yourCart")}</p>
                <p className="text-xs text-success">{t("statusPreparing")} · 15 min</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Dishes */}
        <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("popularDishes")}</h2>
              <p className="mt-1 text-[13px] text-muted">
                {t("popularSubtitle")}
              </p>
            </div>
            <LinkButton to={orderPath} variant="outline">
              {t("seeFullMenu")}
            </LinkButton>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((food) => (
              <article
                key={food.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-transform hover:-translate-y-1"
              >
                {food.imageUrl ? (
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-3xl text-white">
                    🍲
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground">{food.name}</h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    {food.description}
                  </p>
                  <p className="mt-2 text-sm font-bold text-primary">
                    {formatCurrency(food.price)}
                  </p>
                </div>
              </article>
            ))}
            {popular.length === 0 && (
              <p className="col-span-full py-8 text-center text-muted">
                {t("loading")}
              </p>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-y border-border bg-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">{t("howItWorks")}</h2>

            <ol className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-border bg-background p-6 text-center shadow-xs"
                >
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">
                    {step.icon}
                  </span>
                  <p className="mt-4 text-xs font-bold text-primary">STEP {i + 1}</p>
                  <h3 className="mt-1 text-base font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-[13px] text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Order Types */}
        <section
          id="order-types"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16"
        >
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">{t("eatWayYouLike")}</h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {orderTypes.map((type) => (
              <div
                key={type.title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-xs"
              >
                <span className="text-3xl">{type.icon}</span>
                <h3 className="mt-3 text-base font-bold text-foreground">{type.title}</h3>
                <p className="mt-1 text-[13px] text-muted">{type.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-primary to-orange-800 px-6 py-12 text-center text-white shadow-md">
            <h2 className="text-2xl font-extrabold sm:text-3xl tracking-tight">
              {t("readyToEat")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm sm:text-base text-white/90">
              {t("readyToEatDesc")}
            </p>
            <LinkButton to={orderPath} variant="light" size="lg" className="mt-6 w-full sm:w-auto justify-center">
              {user ? t("navDashboard") : t("createAccount")}
            </LinkButton>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
