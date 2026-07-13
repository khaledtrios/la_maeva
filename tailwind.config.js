/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.jsx',
        './resources/**/*.ts',
        './resources/**/*.tsx',
    ],
    theme: {
        extend: {
            fontFamily: {
                'dm-sans': ['DM Sans', 'system-ui', 'sans-serif'],
                'dm-mono': ['DM Mono', 'monospace'],
            },
            animation: {
                'slide-up': 'slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            keyframes: {
                slideUp: {
                    from: {
                        opacity: '0',
                        transform: 'translateY(32px) scale(0.97)',
                    },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
            },
            backgroundImage: {
                'gradient-primary':
                    'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                'gradient-success':
                    'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                'gradient-page':
                    'linear-gradient(160deg, #0a0e1a 0%, #0f172a 60%, #0a1628 100%)',
                'gradient-modal':
                    'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
            },
        },
    },
    plugins: [],
};
