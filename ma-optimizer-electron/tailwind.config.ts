import type { Config } from 'tailwindcss'

const config: Config = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'app-bg': '#0d0f1a',
                'sidebar-bg': 'rgba(10, 10, 15, 0.55)',
                'card-bg': 'rgba(18, 20, 31, 0.5)',
                'card-border': 'rgba(255, 255, 255, 0.06)',
                'card-hover': 'rgba(25, 28, 42, 0.7)',
                'header-bg': 'rgba(10, 10, 15, 0.55)',
                'glass-bg': 'rgba(18, 20, 31, 0.65)',
                'accent-cyan': '#00FFDE',
                'accent-violet': '#FF003C', // Overriding violet to crimson for backward compat without breaking classes
                'accent-green': '#00ff88',
                'accent-orange': '#ff9f43',
                'accent-rose': '#ff6b6b',
                'success': '#00ff88',
                'warning': '#ffd700',
                'danger': '#FF003C',
                'text-primary': '#f8fafc',
                'text-muted': '#94a3b8',
                'text-dim': '#475569',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            animation: {
                'glow-pulse': 'glow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-down': 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'fade-in': 'fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'spin-slow': 'spin-slow 12s linear infinite',
                'bounce-subtle': 'bounce-subtle 3s ease-in-out infinite',
                'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'shimmer-fast': 'shimmer 1.5s infinite',
                'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'aurora': 'aurora 25s linear infinite',
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.8', transform: 'scale(1.02)' },
                },
                'slide-up': {
                    from: { transform: 'translateY(20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-down': {
                    from: { transform: 'translateY(-20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'spin-slow': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'bounce-subtle': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-4px)' },
                },
                'slide-in-right': {
                    from: { transform: 'translateX(20px)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                'scale-in': {
                    from: { transform: 'scale(0.95)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
                'aurora': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glow-cyan': '0 0 15px rgba(0, 255, 222, 0.2), 0 0 30px rgba(0, 255, 222, 0.05)',
                'glow-violet': '0 0 15px rgba(255, 0, 60, 0.2), 0 0 30px rgba(255, 0, 60, 0.05)',
                'glow-success': '0 0 15px rgba(0, 255, 136, 0.2), 0 0 30px rgba(0, 255, 136, 0.05)',
                'card-elevated': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 255, 222, 0.05)',
            },
            transitionDuration: {
                '250': '250ms',
                '400': '400ms',
            },
        },
    },
    plugins: [],
}

export default config
