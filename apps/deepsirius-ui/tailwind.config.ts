/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        "light-ocean":
          "linear-gradient(130deg,hsl(0deg 0% 100%)51%,hsl(249deg 48% 94%)78%,hsl(248deg 47% 87%)86%,hsl(247deg 47% 81%)90%,hsl(246deg 46% 75%)92%,hsl(245deg 50% 70%)94%,hsl(248deg 62% 67%)95%,hsl(250deg 70% 64%)95%,hsl(254deg 75% 59%)96%,hsl(259deg 78% 52%)97%,hsl(259deg 81% 45%)97%,hsl(254deg 77% 40%)98%,hsl(249deg 74% 34%)99%,hsl(243deg 73% 28%)99%,hsl(237deg 79% 21%)100%)",
        "dark-ocean":
          "linear-gradient(310deg,hsl(0deg 0% 100%)0%,hsl(249deg 48% 94%)1%,hsl(248deg 47% 87%)2%,hsl(247deg 47% 81%)3%,hsl(246deg 46% 75%)3%,hsl(245deg 50% 70%)4%,hsl(248deg 62% 67%)5%,hsl(250deg 70% 64%)6%,hsl(254deg 75% 59%)7%,hsl(259deg 78% 52%)9%,hsl(252deg 72% 46%)11%,hsl(236deg 70% 36%)15%,hsl(225deg 91% 23%)21%,hsl(225deg 75% 15%)32%,hsl(236deg 42% 7%)67%)",
        "light-ocean-remapped":
          "linear-gradient(310deg,hsl(0deg 0% 100%)0%,hsl(249deg 48% 94%)10%,hsl(248deg 47% 87%)20%,hsl(247deg 47% 81%)30%,hsl(246deg 46% 75%)40%,hsl(245deg 50% 70%)45%,hsl(248deg 62% 67%)50%,hsl(250deg 70% 64%)55%,hsl(254deg 75% 59%)60%,hsl(259deg 78% 52%)65%,hsl(259deg 81% 45%)70%,hsl(254deg 77% 40%)75%,hsl(249deg 74% 34%)80%,hsl(243deg 73% 28%)85%,hsl(237deg 79% 21%)100%)",
        "dark-ocean-remapped":
          "linear-gradient(130deg,hsl(0deg 0% 100%)0%,hsl(249deg 48% 94%)10%,hsl(248deg 47% 87%)20%,hsl(247deg 47% 81%)30%,hsl(246deg 46% 75%)40%,hsl(245deg 50% 70%)45%,hsl(248deg 62% 67%)50%,hsl(250deg 70% 64%)55%,hsl(254deg 75% 59%)60%,hsl(259deg 78% 52%)65%,hsl(252deg 72% 46%)70%,hsl(236deg 70% 36%)75%,hsl(225deg 91% 23%)80%,hsl(225deg 75% 15%)85%,hsl(236deg 42% 7%)100%)",
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "bounce-x": {
          "0%, 100%": {
            transform: "translateX(-25%)",
          },
          "50%": {
            transform: "translateX(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        wiggle: "wiggle 0.2s ease-in-out infinite",
        "bounce-x": "bounce-x 1.2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
