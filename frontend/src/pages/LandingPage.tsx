import { HOME_BY_ROLE } from "../app/paths";
import PublicFooter from "../components/layout/PublicFooter";
import PublicNavbar from "../components/layout/PublicNavbar";
import LinkButton from "../components/ui/LinkButton";
import { useAuth } from "../features/auth/useAuth";
import { cn } from "../lib/cn";
import { menuItems } from "../mocks/menu";
import { formatCurrency } from "../utils/formatCurrency";

const steps = [
  {
    icon: "🍕",
    title: "Browse the menu",
    text: "Pick from pizza, burgers, salads, drinks and desserts.",
  },
  {
    icon: "🧾",
    title: "Place your order",
    text: "Choose dine-in, takeaway or delivery and select how you want to pay.",
  },
  {
    icon: "⏱️",
    title: "Track it live",
    text: "Follow your order from the kitchen to your table or your door.",
  },
];

const orderTypes = [
  {
    icon: "🍽️",
    title: "Dine-in",
    text: "Order from your table and we bring it to you.",
  },
  {
    icon: "🥡",
    title: "Takeaway",
    text: "Order ahead and pick it up when it's ready.",
  },
  {
    icon: "🛵",
    title: "Delivery",
    text: "Hot food at your door. The delivery fee is shown before you pay.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  // Where the "order" buttons lead, depending on who is looking
  const orderPath = !user
    ? "/register"
    : user.role === "customer"
      ? "/customer/menu"
      : HOME_BY_ROLE[user.role];

  const popular = menuItems.filter((f) => f.available).slice(0, 4);

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="overflow-hidden bg-gradient-to-br from-orange-400 via-primary to-orange-800 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                Delicious Food,
                <br />
                Great Experience!
              </h1>
              <p className="mt-4 max-w-md text-base text-white/90">
                Order your favorite meals easily. Browse the menu, pick how you
                want to eat, and track your order in real time.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton to={orderPath} variant="light" size="lg">
                  {user ? "Go to my dashboard" : "Order Now →"}
                </LinkButton>
                {!user && (
                  <LinkButton to="/login" variant="outlineLight" size="lg">
                    Log in
                  </LinkButton>
                )}
              </div>
            </div>

            {/* Decorative visual */}
            <div
              aria-hidden="true"
              className="relative mx-auto hidden aspect-square w-full max-w-sm lg:block"
            >
              <div className="absolute inset-0 rounded-full bg-white/15" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-red-500 to-amber-300 shadow-2xl" />

              <div className="absolute -left-6 top-10 rounded-xl bg-surface px-4 py-3 text-foreground shadow-xl">
                <p className="text-[13px] font-bold">Margherita Pizza</p>
                <p className="text-xs text-muted">{formatCurrency(12.99)}</p>
              </div>

              <div className="absolute -right-4 bottom-12 rounded-xl bg-surface px-4 py-3 text-foreground shadow-xl">
                <p className="text-[13px] font-bold">Your order</p>
                <p className="text-xs text-success">Preparing · 15 min</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular dishes */}
        <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Popular Dishes</h2>
              <p className="mt-1 text-[13px] text-muted">
                A taste of what's on the menu.
              </p>
            </div>
            <LinkButton to={orderPath} variant="outline">
              {user ? "Open" : "See full menu"} →
            </LinkButton>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {popular.map((food) => (
              <article
                key={food.id}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className={cn("h-32 bg-gradient-to-br", food.gradient)} />
                <div className="p-3">
                  <h3 className="text-[13px] font-bold">{food.name}</h3>
                  <p className="mt-0.5 text-[13px] font-bold text-primary">
                    {formatCurrency(food.price)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-y border-border bg-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-2xl font-bold">How it works</h2>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-border bg-background p-6 text-center"
                >
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-xl">
                    {step.icon}
                  </span>
                  <p className="mt-4 text-xs font-bold text-primary">STEP {i + 1}</p>
                  <h3 className="mt-1 text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-[13px] text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Order types */}
        <section
          id="order-types"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
        >
          <h2 className="text-center text-2xl font-bold">Eat the way you like</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {orderTypes.map((type) => (
              <div
                key={type.title}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <span className="text-3xl">{type.icon}</span>
                <h3 className="mt-3 text-base font-bold">{type.title}</h3>
                <p className="mt-1 text-[13px] text-muted">{type.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-primary to-orange-700 px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Hungry? Your table is ready.
            </h2>
            <p className="mt-2 text-white/90">
              {user
                ? "Jump back in and keep going."
                : "Create a free account and place your first order in minutes."}
            </p>
            <LinkButton to={orderPath} variant="light" size="lg" className="mt-6">
              {user ? "Go to my dashboard" : "Create an account →"}
            </LinkButton>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}