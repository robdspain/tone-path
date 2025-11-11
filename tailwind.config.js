/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - Vibrant and modern
        primary: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#0066ff', // Main brand blue
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
        },
        // Secondary accent - Electric purple
        secondary: {
          50: '#f5e6ff',
          100: '#e0b3ff',
          200: '#cc80ff',
          300: '#b84dff',
          400: '#a31aff',
          500: '#8f00ff', // Electric purple
          600: '#7200cc',
          700: '#560099',
          800: '#390066',
          900: '#1d0033',
        },
        // Tertiary accent - Neon cyan
        accent: {
          50: '#e6ffff',
          100: '#b3ffff',
          200: '#80ffff',
          300: '#4dffff',
          400: '#1affff',
          500: '#00e6e6', // Neon cyan
          600: '#00b8b8',
          700: '#008a8a',
          800: '#005c5c',
          900: '#002e2e',
        },
        // Success - Vibrant green
        success: {
          DEFAULT: '#00ff88',
          dark: '#00cc6d',
        },
        // Warning - Amber
        warning: {
          DEFAULT: '#ffaa00',
          dark: '#cc8800',
        },
        // Gold - Bright yellow/gold for highlights
        gold: {
          DEFAULT: '#ffd700', // Bright gold
          light: '#ffed4e', // Lighter gold
          dark: '#ccaa00', // Darker gold for dark mode
        },
        // Teal - Cyan-teal for accents
        teal: {
          DEFAULT: '#14b8a6', // Standard teal
          light: '#5eead4', // Light teal
          dark: '#0d9488', // Dark teal
          deep: '#0f766e', // Deep teal
        },
        // Error - Bright red
        error: {
          DEFAULT: '#ff3366',
          dark: '#cc2952',
        },
        // Dark theme colors
        dark: {
          50: '#f7f7f8',
          100: '#e3e4e6',
          200: '#c7c9ce',
          300: '#a4a8b0',
          400: '#6b7280',
          500: '#4b5563',
          600: '#374151',
          700: '#1f2937',
          800: '#111827', // Main background
          900: '#0a0e1a', // Deeper background
          950: '#050711', // Darkest
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #0066ff 0%, #8f00ff 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00e6e6 0%, #0066ff 100%)',
        'gradient-mesh': 'linear-gradient(135deg, #0066ff 0%, #8f00ff 50%, #00e6e6 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 102, 255, 0.5)',
        'glow-secondary': '0 0 20px rgba(143, 0, 255, 0.5)',
        'glow-accent': '0 0 20px rgba(0, 230, 230, 0.5)',
        'glow-success': '0 0 20px rgba(0, 255, 136, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(0, 102, 255, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 10px rgba(0, 102, 255, 0.3)' },
          'to': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.6)' },
        },
        slideUp: {
          'from': { transform: 'translateY(10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          'from': { transform: 'translateY(-10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

