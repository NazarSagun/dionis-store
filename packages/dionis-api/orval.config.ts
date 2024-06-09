module.exports = {
  dionis: {
    output: {
      mode: 'tags-split',
      target: 'src/dionis.ts',
      schemas: 'src/model',
      client: 'react-query',
      mock: true,
    },
    input: {
      target: './dionis.yaml',
    },
  },
}
