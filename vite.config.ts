import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      // ── Multi-key support ──────────────────────────────────────
      // Add as many VITE_API_KEY_N entries as you have keys.
      // Keys that are undefined/empty are automatically ignored
      // by geminiService.ts — no errors for missing slots.
      'import.meta.env.VITE_API_KEY_1': JSON.stringify(env.VITE_API_KEY_1 ?? ''),
      'import.meta.env.VITE_API_KEY_2': JSON.stringify(env.VITE_API_KEY_2 ?? ''),
      'import.meta.env.VITE_API_KEY_3': JSON.stringify(env.VITE_API_KEY_3 ?? ''),
      'import.meta.env.VITE_API_KEY_4': JSON.stringify(env.VITE_API_KEY_4 ?? ''),
      'import.meta.env.VITE_API_KEY_5': JSON.stringify(env.VITE_API_KEY_5 ?? ''),

      // ── Legacy single-key (kept for backwards compatibility) ───
      // If you still have any direct process.env.API_KEY references,
      // they'll fall back to key 1 so nothing breaks immediately.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY_1 ?? env.API_KEY ?? ''),
    },
  }
})
