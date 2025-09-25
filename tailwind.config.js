/** @type {import('tailwindcss').Config} */
module.exports = {
  // Updated content paths to ensure Nativewind classes are picked up in all relevant files,
  // including src/app/(tabs)/index.tsx and other nested folders.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
