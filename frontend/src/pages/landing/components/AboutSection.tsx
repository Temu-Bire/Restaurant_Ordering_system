import { useTranslation } from "../../../shared/hooks/useTranslation";

export default function AboutSection() {
  const { t } = useTranslation();

  return (
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

          {/* Right Column: Imagery */}
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
  );
}
