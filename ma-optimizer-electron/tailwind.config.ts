import type { Config } from 'tailwindcss'

const config: Config = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'app-bg': '#0a0e1a',
                'sidebar-bg': '#0d1117',
                'card-bg': '#161b22',
                'card-border': '#21262d',
                'card-hover': '#1c2333',
                'header-bg': '#0d1117',
                'glass-bg': 'rgba(22, 27, 34, 0.6)',
                'accent-cyan': '#00FFDE',
                'accent-violet': '#FF003C',
                'accent-green': '#00ff88',
                'accent-orange': '#ff9f43',
                'accent-rose': '#ff6b6b',
                'success': '#00ff88',
                'warning': '#ffd700',
                'danger': '#ff4444',
                'text-primary': '#e6edf3',
                'text-muted': '#8b949e',
                'text-dim': '#484f58',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            animation: {
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'slide-up': 'slide-up 0.3s ease-out',
                'slide-down': 'slide-down 0.3s ease-out',
                'fade-in': 'fade-in 0.2s ease-out',
                'spin-slow': 'spin-slow 8s linear infinite',
                'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                'shimmer-fast': 'shimmer 1.5s infinite',
                'scale-in': 'scale-in 0.2s ease-out',
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 8px rgba(0,255,222,0.3)' },
                    '50%': { boxShadow: '0 0 20px rgba(0,255,222,0.6)' },
                },
                'slide-up': {
                    from: { transform: 'translateY(100%)', opacity: '0' },
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
                    from: { transform: 'scale(0.9)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
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
