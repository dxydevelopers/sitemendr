import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.js', '**/*.test.ts', '**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/tests/setup.ts',
        '**/*.config.ts'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@config': path.resolve(__dirname, './config'),
      '@controllers': path.resolve(__dirname, './controllers'),
      '@middleware': path.resolve(__dirname, './middleware'),
      '@services': path.resolve(__dirname, './services'),
      '@routes': path.resolve(__dirname, './routes')
    }
  }
});
