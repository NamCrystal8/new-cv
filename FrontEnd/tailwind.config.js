/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom breakpoints for mobile-first responsive design
      screens: {
        'xs': '320px',   // Extra small mobile devices
        'sm': '480px',   // Small mobile devices
        'md': '768px',   // Tablets
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Large desktop
        '2xl': '1536px', // Extra large desktop
      },
      // Touch-friendly sizing
      spacing: {
        'touch': '44px', // Minimum touch target size
        'touch-lg': '48px', // Large touch target
      },
      // Mobile-optimized font sizes
      fontSize: {
        'xs-mobile': ['0.75rem', { lineHeight: '1.2' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.3' }],
        'base-mobile': ['1rem', { lineHeight: '1.4' }],
        'lg-mobile': ['1.125rem', { lineHeight: '1.4' }],
        'xl-mobile': ['1.25rem', { lineHeight: '1.4' }],
      },
      // Container max-widths for different breakpoints
      maxWidth: {
        'mobile': '100%',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1800px', // For admin panels as preferred
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "corporate"],
  },
}