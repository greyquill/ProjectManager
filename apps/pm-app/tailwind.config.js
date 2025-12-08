/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3D74B6',
        secondary: '#FBF5DE',
        tertiary: '#EAC8A6',
        accent: '#DC3C22',
        'background-light': '#F9FAFB',
        'background-dark': '#111821',
        surface: '#FFFFFF',
        'surface-muted': '#F3F4F6',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'border-light': '#E5E7EB',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      fontFamily: {
        display: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/container-queries'),
  ],
}

