import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#070809',
          2: '#101214',
        },
        paper: {
          DEFAULT: '#F4F5F6',
          2: '#E8EAEC',
        },
        stone: {
          DEFAULT: '#85898D',
          2: '#5D6267',
        },
        hairline: {
          DEFAULT: '#D7DADD',
          dark: '#292D31',
        },
        accent: {
          DEFAULT: '#5B7CFF',
          soft: '#CBD3FF',
        },
        good: '#63D6A0',
        danger: '#C45B5B',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        ar: ['var(--font-ar)', 'sans-serif'],
      },
      borderRadius: {
        xs: '10px',
        sm: '14px',
        md: '20px',
        lg: '28px',
      },
      boxShadow: {
        soft: '0 18px 40px -28px rgba(7, 8, 9, 0.16)',
        lift: '0 28px 56px -32px rgba(7, 8, 9, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
