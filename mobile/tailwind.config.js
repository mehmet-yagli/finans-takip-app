/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind'in hangi klasörlerdeki dosyaları tarayacağını belirtiyoruz
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}