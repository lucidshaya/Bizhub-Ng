
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
