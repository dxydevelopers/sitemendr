/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './frontend/src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'ai-blue': '#0066FF',
        'tech-purple': '#6366F1',
        'expert-green': '#10B981',
        'dark-bg': '#0F172A',
        'light-bg': '#F8FAFC',
        'light-text': '#F8FAFC',
        'dark-text': '#1E293B',
        'medium-gray': '#64748B',
        'border-gray': '#E2E8F0',
        // Semantic Colors
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}