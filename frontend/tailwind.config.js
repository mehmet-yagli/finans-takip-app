/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 👈 YENİ: Karanlık modu manuel kontrol etmek için bu satırı ekledik
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 👇 EKLENEN KISIM: Kayan yazı animasyonu için gerekli ayarlar
      animation: {
        marquee: 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}