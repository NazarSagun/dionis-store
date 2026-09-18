import { defineConfig } from 'orval'

export default defineConfig({
  dionis: {
    output: {
      mode: 'tags-split',
      target: 'src/dionis',
      schemas: 'src/model',
      client: 'react-query',
      mock: true,
      clean: true,
      override: {
        mutator: {
          path: './instance.ts',
          name: 'customInstance',
        },
        query: {},
      },
    },
    input: {
      target: './dionis.yaml',
    },
  },
}) as typeof defineConfig
