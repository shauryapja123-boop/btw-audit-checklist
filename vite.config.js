import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        checklist: 'checklist.html',
        reports: 'reports.html',
        settings: 'settings.html',
        section1: 'section-1.html',
        section2: 'section-2.html',
        section3: 'section-3.html',
        section4: 'section-4.html',
        section5: 'section-5.html',
      },
    },
  },
})
