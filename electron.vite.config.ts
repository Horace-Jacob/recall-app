import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'native-host': resolve(__dirname, 'src/main/native-host/native-host.ts'),
          'build-native-host': resolve(__dirname, 'src/main/native-host/build-native-host.ts'),
          'content-fetch-worker': resolve(
            __dirname,
            'src/main/service-worker/content-fetch-worker.ts'
          )
        }
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
});
