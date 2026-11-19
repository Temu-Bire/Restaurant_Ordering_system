import { Link } from "react-router-dom";

interface ArifLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "auto";
  asLink?: boolean;
}

export default function ArifLogo({
  className = "",
  size = "md",
  variant = "auto",
  asLink = true,
}: ArifLogoProps) {
  const iconSizes = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const arifColor =
    variant === "light"
      ? "text-white"
      : variant === "dark"
      ? "text-stone-900"
      : "text-foreground";

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Custom Arif Food Chef Hat & Utensils Icon */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center shrink-0 rounded-full border-2 border-orange-500/90 bg-orange-500/10 p-1 shadow-sm transition-transform duration-300 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 40 40"
          className="size-full fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Chef Hat Puffs */}
          <path
            d="M13 18C11.5 18 10 16.5 10 14.5C10 12.2 12 10.5 14.5 11C15.8 8.5 18.5 7 20 7C21.5 7 24.2 8.5 25.5 11C28 10.5 30 12.2 30 14.5C30 16.5 28.5 18 27 18"
            stroke="#f97316"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Hat band */}
          <path
            d="M13 18H27V20.5C27 21.3 26.3 22 25.5 22H14.5C13.7 22 13 21.3 13 20.5V18Z"
            fill="#f97316"
          />
          {/* Fork on Left */}
          <path
            d="M16 25V33M14 25V28C14 28.6 14.4 29 15 29H17C17.6 29 18 28.6 18 28V25"
            stroke="#f97316"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Spoon on Right */}
          <path
            d="M24 28.5V33M22.5 26.5C22.5 25 23.3 24 24 24C24.7 24 25.5 25 25.5 26.5C25.5 28 24.7 28.5 24 28.5C23.3 28.5 22.5 28 22.5 26.5Z"
            stroke="#f97316"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Name Typography */}
      <div className={`font-extrabold tracking-tight ${textSizes[size]} flex items-center gap-1.5`}>
        <span className={arifColor} style={{ fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif", letterSpacing: "-0.02em" }}>
          Arif
        </span>
        <span
          className="text-orange-500 font-bold italic"
          style={{
            fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
            textShadow: "0 1px 2px rgba(249, 115, 22, 0.2)",
          }}
        >
          Food
        </span>
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" className="group flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
