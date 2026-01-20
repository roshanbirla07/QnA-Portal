/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          DEFAULT: "#8B5CF6",
        },
        accent: {
          pink: "#EC4899",
        },
        bg: {
          primary: "#0F172A", // Slate 900
          secondary: "#1E293B", // Slate 800
          card: "rgba(30, 41, 59, 0.7)",
        },
        text: {
          primary: "#F1F5F9", // Slate 100
          secondary: "#94A3B8", // Slate 400
          muted: "#64748B", // Slate 500
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.3)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
