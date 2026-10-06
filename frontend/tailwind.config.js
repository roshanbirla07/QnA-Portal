/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { purple: "#6655d5", blue: "rgb(var(--brand-rgb) / <alpha-value>)", DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)" },
        accent: { pink: "#d04d8b" },
        bg: { primary: "var(--bg-primary)", secondary: "var(--bg-secondary)", card: "var(--bg-card)" },
        text: { primary: "var(--text-primary)", secondary: "var(--text-secondary)", muted: "var(--text-muted)" },
      },
      fontFamily: { sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"] },
      boxShadow: { glow: "0 8px 24px rgba(36, 99, 235, 0.16)" },
      animation: { "fade-in": "fadeIn 0.35s ease-out", "slide-up": "slideUp 0.35s ease-out" },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(12px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};
