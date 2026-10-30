import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const stubClient = resolve(__dirname, 'src/api/client.ts');
const e2eClient = resolve(__dirname, 'e2e/support/e2eClient.ts');

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only `--mode e2e` swaps the fail-closed stub for the mockable transport.
    ...(mode === 'e2e'
      ? [
          {
            name: 'om-ai-e2e-client',
            enforce: 'pre' as const,
            async resolveId(this: { resolve: (id: string, importer?: string, options?: object) => Promise<{ id: string } | null> }, source: string, importer?: string) {
              if (!importer || !/(^|\/)client$/u.test(source)) return null;
              const resolved = await this.resolve(source, importer, { skipSelf: true });
              return resolved?.id === stubClient ? e2eClient : null;
            },
          },
        ]
      : []),
  ],
  server: {
    proxy: {
      '/v2': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
