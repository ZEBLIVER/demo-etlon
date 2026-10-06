/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter Variable', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'] },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        accent: 'hsl(var(--accent))',
        destructive: 'hsl(var(--destructive))',
      },
      borderRadius: { xl: '14px', '2xl': '18px' },
      boxShadow: { soft: '0 1px 2px rgba(60,35,15,.05), 0 6px 20px -6px rgba(60,35,15,.10)' },
    },
  },
  plugins: [],
};
