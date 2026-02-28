import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    base: './',
    root: '.',
    build: {
        outDir: 'dist-vite',
        emptyOutDir: true,
        sourcemap: false, // Disable for production to save space
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
                    ui: [
                        './src/components/ui/ConfirmDialog.tsx',
                        './src/components/ui/ProgressModal.tsx',
                        './src/components/ui/SearchOverlay.tsx',
                    ],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
    },
})
