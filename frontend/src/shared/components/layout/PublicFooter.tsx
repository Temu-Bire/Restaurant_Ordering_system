import ArifLogo from "../ui/ArifLogo";
import { useTranslation } from "../../hooks/useTranslation";

export default function PublicFooter() {
  const { t } = useTranslation();

  return (
    <footer id="contact" className="border-t border-orange-950/40 bg-[#16120e] text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        {/* Brand Column */}
        <div className="space-y-4">
          <ArifLogo size="md" variant="light" />
          <p className="max-w-xs text-xs leading-relaxed text-stone-400">
            {t("brandTagline")}
          </p>
        </div>

        {/* Quick Links */}
        <div className="text-xs">
          <h3 className="mb-3.5 text-sm font-bold text-white tracking-wide">
            Quick Links
          </h3>
          <ul className="space-y-2.5">
            <li>
              <a href="#" className="transition-colors hover:text-orange-400">
                {t("navHome")}
              </a>
            </li>
            <li>
              <a href="#menu" className="transition-colors hover:text-orange-400">
                {t("navMenu")}
              </a>
            </li>
            <li>
              <a href="#about" className="transition-colors hover:text-orange-400">
                About
              </a>
            </li>
            <li>
              <a href="#contact" className="transition-colors hover:text-orange-400">
                {t("contact")}
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Us */}
        <div className="text-xs">
          <h3 className="mb-3.5 text-sm font-bold text-white tracking-wide">
            Contact Us
          </h3>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2.5">
              <svg className="size-4 shrink-0 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>+251 9 123 4567</span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="size-4 shrink-0 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <a href="mailto:info@ariffood.com" className="hover:text-orange-400 transition-colors">
                info@ariffood.com
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="size-4 shrink-0 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Addis Ababa, Ethiopia</span>
            </li>
          </ul>
        </div>

        {/* Follow Us */}
        <div className="text-xs">
          <h3 className="mb-3.5 text-sm font-bold text-white tracking-wide">
            Follow Us
          </h3>
          <div className="flex items-center gap-3">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-all hover:bg-orange-500 hover:text-white hover:scale-110"
            >
              <svg className="size-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-all hover:bg-orange-500 hover:text-white hover:scale-110"
            >
              <svg className="size-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-all hover:bg-orange-500 hover:text-white hover:scale-110"
            >
              <svg className="size-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-stone-400 sm:flex-row">
          <p>© 2026 Arif Food. {t("rightsReserved")}</p>
          <p className="flex items-center gap-1.5 font-medium text-stone-300">
            Good Food • Good Mood <span className="text-red-500">❤️</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
