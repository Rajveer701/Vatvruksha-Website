/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#E8741A',
          light: '#F59242',
          dark: '#C45E0E',
          50: '#FEF3E8',
        },
        maroon: {
          DEFAULT: '#7A1F2B',
          light: '#9B2D3C',
          dark: '#5C1620',
          50: '#F9EAEC',
        },
        gold: {
          DEFAULT: '#C9962B',
          light: '#DEB554',
          dark: '#A87820',
          50: '#FDF6E7',
        },
        cream: {
          DEFAULT: '#FFF8EC',
          dark: '#F5EDDA',
          darker: '#EDE0C4',
        },
        brown: {
          DEFAULT: '#2B1A14',
          light: '#4A2E23',
          medium: '#6B4226',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9962B 0%, #DEB554 50%, #C9962B 100%)',
        'maroon-gradient': 'linear-gradient(135deg, #5C1620 0%, #7A1F2B 50%, #9B2D3C 100%)',
        'saffron-gradient': 'linear-gradient(135deg, #C45E0E 0%, #E8741A 50%, #F59242 100%)',
        'cream-gradient': 'linear-gradient(180deg, #FFF8EC 0%, #F5EDDA 100%)',
        'hero-gradient': 'linear-gradient(135deg, rgba(90,20,30,0.85) 0%, rgba(200,100,20,0.7) 100%)',
      },
      boxShadow: {
        'card': '0 2px 20px rgba(43, 26, 20, 0.08)',
        'card-hover': '0 8px 40px rgba(43, 26, 20, 0.15)',
        'gold': '0 4px 20px rgba(201, 150, 43, 0.3)',
        'maroon': '0 4px 20px rgba(122, 31, 43, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        'marquee': 'marquee 30s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
