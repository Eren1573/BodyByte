import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      // Exposes API_KEY to the app as process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  }
})
