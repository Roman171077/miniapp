/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /* --- анимации для тоста ------------------------------------ */
      keyframes: {
        toastFadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        toastFadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
      },
      animation: {
        "toast-in":  "toastFadeIn 0.3s forwards",
        "toast-out": "toastFadeOut 0.3s forwards",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
