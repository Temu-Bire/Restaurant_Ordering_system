import { useTranslation } from "../../../shared/hooks/useTranslation";

const PILLARS = [
  { title: "100% Pure Teff", desc: "Fermented naturally for soft, spongy injera." },
  { title: "Artisanal Berbere", desc: "Sun-dried red peppers ground with traditional herbs." },
  { title: "Niter Kibbeh", desc: "Clarified butter infused with cardamom and ginger." },
  { title: "Buna Ceremony", desc: "Freshly roasted beans brewed in a clay pot." },
];

export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="scroll-mt-20 border-y border-border bg-surface py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* Story */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400">
            Our Culinary Story
          </p>

          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            {t("aboutTitle")}
          </h2>

          <p className="mt-5 text-base leading-relaxed text-muted">{t("aboutDesc")}</p>

          <p className="mt-4 text-base leading-relaxed text-muted">
            In Ethiopia, food is communion. Eating around a woven Mesob with family and friends
            means warmth, unity, and <em>gursha</em>: feeding one another as a sign of love.
          </p>

          <ul className="mt-8 grid gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-2">
            {PILLARS.map(({ title, desc }) => (
              <li key={title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 size-2 shrink-0 rounded-full bg-orange-600"
                />
                <div>
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Image */}
        <figure className="relative">
          <img
            src="/images/restaurant-interior.jpg"
            alt="Inside the Arif Food dining room"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg"
          />
          <figcaption className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            Addis Ababa, Ethiopia
          </figcaption>
        </figure>
      </div>
    </section>
  );
}