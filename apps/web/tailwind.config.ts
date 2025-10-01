import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Momentum Color Palette from PROJECT.md
        amaranth: '#e7265e',
        'red-ribbon': '#eb0146',
        'green-haze': '#08b358',
        'tory-blue': '#1253b2',
        saffron: '#f8be29',
        spindle: '#c7d7ed',
        danube: '#729ad2',
        froly: '#f57da0',
        padua: '#b0e7c9',
        
        primary: {
          DEFAULT: '#1253b2',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#729ad2',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#08b358',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f8be29',
          foreground: '#000000',
        },
        error: {
          DEFAULT: '#eb0146',
          foreground: '#ffffff',
        },
        background: '#ffffff',
        foreground: '#1a1a1a',
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#737373',
        },
        border: '#e5e5e5',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'h1': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'h2': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
