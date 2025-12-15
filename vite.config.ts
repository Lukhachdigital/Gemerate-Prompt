import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Quan trọng: Đặt base là './' để assets load đúng đường dẫn tương đối
    // (Fix lỗi màn hình trắng trên Github Pages hoặc Sub-folder hosting)
    base: './',
    
    plugins: [react()],
    
    // Cấu hình thay thế biến môi trường (Polyfill cho process.env)
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    
    resolve: {
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  }
})