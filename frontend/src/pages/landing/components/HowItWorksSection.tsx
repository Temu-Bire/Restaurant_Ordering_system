import { useTranslation } from "../../../shared/hooks/useTranslation";

export default function HowItWorksSection() {
  const { t } = useTranslation();

  return (
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

        {/* 3 Connected Steps */}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
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
  );
}
