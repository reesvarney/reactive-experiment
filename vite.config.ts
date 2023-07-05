import { defineConfig } from 'vite'
import path from 'path';

export default defineConfig({
  esbuild: {
    // jsxInject: `import {__jsx} from '@renderer/renderer';`,
  },
  resolve: {
    alias: {
      'renderer': path.resolve(__dirname, './renderer/')
    }
  }
})