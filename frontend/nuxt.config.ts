// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['./app/assets/css/main.css'],
  
  sourcemap: {
    server: false,
    client: false
  },
  
  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: false
    },
    customLogger: {
      ...console,
      warn: () => {},
      warning: () => {}
    }
  },
  
  nitro: {
    preset: 'vercel',
    sourceMap: false
  },
  
  runtimeConfig: {
    githubRepo: 'hermesagent27/tristan-carter-job-search',
    authPassword: process.env.AUTH_PASSWORD || 'qULT9VJ6DN9Y0lc2'
  }
})
