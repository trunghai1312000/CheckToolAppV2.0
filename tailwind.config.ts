/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Màu nền tối theo phong cách DinoFocus
        background: "#0f0f11", // Đen sâu, không đen kịt
        surface: "#18181b",    // Panel nổi
        primary: "#e4e4e7",    // Chữ chính (trắng đục)
        secondary: "#a1a1aa",  // Chữ phụ (xám)
        accent: "#3f3f46",     // Viền, đường kẻ
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Font hiện đại, dễ đọc
      },
    },
  },
  plugins: [],
}