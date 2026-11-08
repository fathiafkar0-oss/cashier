import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alamat API bisa diatur lewat environment (dipakai docker-compose).
// Default: microservice yang dijalankan lokal di port 5001 & 5002.
const CUSTOMER_API_URL = process.env.CUSTOMER_API_URL || 'http://127.0.0.1:5001'
const EMPLOYEE_API_URL = process.env.EMPLOYEE_API_URL || 'http://127.0.0.1:5002'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/customer': {
        target: CUSTOMER_API_URL,
        changeOrigin: true,
        secure: false,
      },
      '/api/employee': {
        target: EMPLOYEE_API_URL,
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
