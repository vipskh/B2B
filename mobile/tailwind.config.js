/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6A00", // 1688 orange
          light: "#FF8C33",
          dark: "#E15A00",
        },
        background: {
          DEFAULT: "#121212", // dark background
          light: "#181818",
          lighter: "#282828",
        },
        surface: {
          DEFAULT: "#282828",
          light: "#3E3E3E",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          tertiary: "#6A6A6A",
        },
        accent: {
          DEFAULT: "#FF6A00",
          red: "#E1251B",
          yellow: "#FFC107",
        },
      },
    },
  },
  plugins: [],
};
