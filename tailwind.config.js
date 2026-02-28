/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bodybyte: {
          dark: '#0b1221', // Google AI Studio Deep Blue
          card: '#1e293b', // Slate 800
          accent: '#38bdf8', // Sky 400
          success: '#34d399', // Emerald 400
          text: '#f8fafc', // Slate 50
          muted: '#94a3b8', // Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fill-up': 'fillUp 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fillUp: {
          '0%': { height: '0%' },
          '100%': { height: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: [],
}