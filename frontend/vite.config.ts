import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(
      [
        "analytics", "applications", "assistant", "auth", "feedback", "health",
        "matching", "notifications", "opportunities", "participation", "profiles",
        "saved", "schedules", "tasks", "users",
      ].map((route) => [
        `/${route}`,
        {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      ]),
    ),
  },
})
