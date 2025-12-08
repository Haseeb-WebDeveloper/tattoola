/** @type {import('tailwindcss').Config} */
module.exports = {
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
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#0A0101",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#AE0E0E", // Black background from SVG
          foreground: "#FFFFFF", // White text
          brand: "#AE0E0E",
          50: "#F8F9FA",
          100: "#E9ECEF",
          200: "#DEE2E6",
          300: "#CED4DA",
          400: "#ADB5BD",
          500: "#6C757D",
          600: "#495057",
          700: "#343A40",
          800: "#212529",
          900: "#000000",
        },
        secondary: {
          DEFAULT: "#6C757D",
          foreground: "#FFFFFF",
          50: "#F8F9FA",
          100: "#E9ECEF",
          200: "#DEE2E6",
          300: "#CED4DA",
          400: "#ADB5BD",
          500: "#6C757D",
          600: "#495057",
          700: "#343A40",
          800: "#212529",
          900: "#000000",
        },
        // Status colors from the circular indicators in the SVG
        success: {
          DEFAULT: "#11B95C", // Green circle
          foreground: "#FFFFFF",
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#11B95C",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        warning: {
          DEFAULT: "#F49E00", // Orange circle
          foreground: "#FFFFFF",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F49E00",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        error: {
          DEFAULT: "#AE0E0E", // Red circle
          foreground: "#FFFFFF",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#AE0E0E",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        info: {
          DEFAULT: "#FF7F56", // Coral/orange circle
          foreground: "#FFFFFF",
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#FF7F56",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        gray: {
          DEFAULT: "#A49A99", // Gray circle
          foreground: "#100C0C",
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#A49A99",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        tat: {
          DEFAULT: "#A49A99",
          darkMaroon: "#140404",
          foreground: "#100C0C",
          chat: "#262626",
        },
        // Base colors
        background: "#000000",
        foreground: "#FFFFFF",
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        border: "#E5E7EB",
        input: "#F3F4F6",
        ring: "#3B82F6",
        error: "#FF4C4C",
        destructive: {
          DEFAULT: "#AE0E0E",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#F3F4F6",
          foreground: "#374151",
        },
      },
      fontFamily: {
        // Base families
        montserrat: ["Montserrat-Regular", "Montserrat", "system-ui", "sans-serif"],
        neue: ["NeueHaasDisplay", "Montserrat", "system-ui", "sans-serif"],

        // Explicit weight-specific families for convenience utilities
        montserratLight: ["Montserrat-Light", "Montserrat", "system-ui", "sans-serif"],
        montserratMedium: ["Montserrat-Medium", "Montserrat", "system-ui", "sans-serif"],
        montserratSemibold: ["Montserrat-SemiBold", "Montserrat", "system-ui", "sans-serif"],
        montserratBold: ["Montserrat-Bold", "Montserrat", "system-ui", "sans-serif"],
        montserratBlack: ["Montserrat-Black", "Montserrat", "system-ui", "sans-serif"],
        // Italic convenience aliases
        montserratItalic: ["Montserrat-Italic", "Montserrat-Regular", "system-ui", "sans-serif"],
        montserratLightItalic: ["Montserrat-LightItalic", "Montserrat-Light", "system-ui", "sans-serif"],
        montserratMediumItalic: ["Montserrat-MediumItalic", "Montserrat-Medium", "system-ui", "sans-serif"],
        montserratSemiboldItalic: ["Montserrat-SemiBoldItalic", "Montserrat-SemiBold", "system-ui", "sans-serif"],
        montserratBoldItalic: ["Montserrat-BoldItalic", "Montserrat-Bold", "system-ui", "sans-serif"],
        montserratBlackItalic: ["Montserrat-BlackItalic", "Montserrat-Black", "system-ui", "sans-serif"],

        neueThin: ["NeueHaasDisplay-Thin", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueLight: ["NeueHaasDisplay-Light", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueMedium: ["NeueHaasDisplay-Medium", "NeueHaasDisplay", "system-ui", "sans-serif"],
        // Fallback mapping for missing Semibold asset -> use Bold
        neueSemibold: ["NeueHaasDisplay-Bold", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueBold: ["NeueHaasDisplay-Bold", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueBlack: ["NeueHaasDisplay-Black", "NeueHaasDisplay", "system-ui", "sans-serif"],

        neueThinItalic: ["NeueHaasDisplay-ThinItalic", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueLightItalic: ["NeueHaasDisplay-LightItalic", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueMediumItalic: ["NeueHaasDisplay-MediumItalic", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueSemiboldItalic: ["NeueHaasDisplay-BoldItalic", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueBoldItalic: ["NeueHaasDisplay-BoldItalic", "NeueHaasDisplay", "system-ui", "sans-serif"],
        neueBlackItalic: ["NeueHaasDisplay-BlackItalic", "NeueHaasDisplay", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Typography scale inspired by the SVG text hierarchy
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "zoom-in": {
          "0%": { transform: "scale(0.5)" },
          "100%": { transform: "scale(1)" },
        },
        "zoom-out": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(0.5)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "status-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-out": "fade-out 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "zoom-in": "zoom-in 0.3s ease-out",
        "zoom-out": "zoom-out 0.3s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "status-pulse": "status-pulse 2s ease-in-out infinite",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        none: "none",
        // Status-specific glows
        "success-glow": "0 0 20px rgba(17, 185, 92, 0.3)",
        "success-glow-lg": "0 0 40px rgba(17, 185, 92, 0.4)",
        "warning-glow": "0 0 20px rgba(244, 158, 0, 0.3)",
        "warning-glow-lg": "0 0 40px rgba(244, 158, 0, 0.4)",
        "error-glow": "0 0 20px rgba(174, 14, 14, 0.3)",
        "error-glow-lg": "0 0 40px rgba(174, 14, 14, 0.4)",
        "info-glow": "0 0 20px rgba(255, 127, 86, 0.3)",
        "info-glow-lg": "0 0 40px rgba(255, 127, 86, 0.4)",
      },
      spacing: {
        // Additional spacing values for better layout control
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        // More radius options
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};