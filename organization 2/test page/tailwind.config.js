
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        primary: '#006B3C',
        darkGreen: '#004D2A',
        gold: '#FFD700',
        cream: '#FFFBF0',
        // App dark theme
        appBg: '#0F1117',
        appSurface: '#161B27',
        appBorder: '#1E2535',
        appAccent: '#00D084',
        appBlue: '#3B82F6',
        appAmber: '#F59E0B',
        appRed: '#EF4444',
        appTextPrimary: '#F1F5F9',
        appTextSecondary: '#94A3B8',
        appTextMuted: '#475569',
      },
      fontFamily: {
        sans: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'scan': 'scan 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
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
