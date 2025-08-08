/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // 确保产品环境不移除必要的类
  safelist: [
    'hover:scale-105',
    'hover:scale-110',
    'hover:shadow-xl',
    'animate-pulse',
    'pointer-events-none',
    'scroll-mt-16',
    'backdrop-blur-sm',
    'bg-white/10',
    'border-white/50',
    'from-blue-600',
    'to-purple-600',
    'text-white',
    'border-white',
    'hover:bg-white',
    'hover:text-blue-600',
    'hover:border-primary',
    'transition-all',
    'duration-300',
    'z-10',
    'relative',
    {
      pattern: /^(from|to|via)-(blue|purple|white|gray|primary)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    {
      pattern: /^bg-(gradient-to|white|black|transparent|current)$/,
    }
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
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
        // 行业主题色彩
        lawyer: {
          DEFAULT: "#1e3a8a", // 深蓝色 - 专业、权威
          light: "#3b82f6",
          dark: "#1e40af",
        },
        realtor: {
          DEFAULT: "#059669", // 绿色 - 成长、稳定  
          light: "#10b981",
          dark: "#047857",
        },
        insurance: {
          DEFAULT: "#7c3aed", // 紫色 - 信任、保障
          light: "#8b5cf6", 
          dark: "#6d28d9",
        },
        teacher: {
          DEFAULT: "#ea580c", // 橙色 - 活力、启发
          light: "#f97316",
          dark: "#c2410c",
        },
        accountant: {
          DEFAULT: "#dc2626", // 红色 - 准确、财务
          light: "#ef4444",
          dark: "#b91c1c",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
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
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(0)" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(139, 92, 246, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out", 
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "bounce-slow": "bounce-slow 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}