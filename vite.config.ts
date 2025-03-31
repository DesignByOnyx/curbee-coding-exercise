import { defineConfig } from 'vitest/config';
import devServer from '@hono/vite-dev-server';

export default defineConfig({
   plugins: [devServer({ entry: 'src/server.ts' })],
});
