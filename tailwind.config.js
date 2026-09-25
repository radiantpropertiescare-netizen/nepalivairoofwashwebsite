/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./*.html",
    "./api/**/*.js"
  ],
  safelist: [
    "translate-x-full",
    "hidden",
    "text-red-300",
    "text-green-300",
    "text-red-600",
    "text-green-600",
    "ring-primary",
    "ring-2",
    "ring-transparent",
    "text-primary",
    "font-bold",
    "text-on-surface-variant"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#c00007",
        "primary-container": "#e52920",
        "on-primary": "#ffffff",
        "primary-fixed": "#ffdad5",
        "primary-fixed-dim": "#ffb4a9",
        "on-primary-fixed": "#410001",
        "on-primary-fixed-variant": "#930004",
        "on-primary-container": "#140000",
        "inverse-primary": "#ffb4a9",
        "secondary": "#3e5ca3",
        "secondary-container": "#95b1ff",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#dae2ff",
        "secondary-fixed-dim": "#b2c5ff",
        "on-secondary-fixed": "#001847",
        "on-secondary-fixed-variant": "#244389",
        "on-secondary-container": "#224288",
        "tertiary": "#336477",
        "tertiary-container": "#4d7d91",
        "on-tertiary": "#ffffff",
        "tertiary-fixed": "#bbeaff",
        "tertiary-fixed-dim": "#9dcee3",
        "on-tertiary-fixed": "#001f29",
        "on-tertiary-fixed-variant": "#174c5f",
        "on-tertiary-container": "#ffffff",
        "surface": "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f8f9fa",
        "surface-variant": "#e1e3e4",
        "surface-tint": "#c00007",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "on-surface": "#191c1d",
        "on-surface-variant": "#5d3f3b",
        "inverse-surface": "#2e3132",
        "inverse-on-surface": "#f0f1f2",
        "background": "#f8f9fa",
        "on-background": "#191c1d",
        "outline": "#926f6a",
        "outline-variant": "#e7bdb7",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a"
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      letterSpacing: {
        headline: "-0.02em",
        label: "0.05em"
      }
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ]
};
