/** @type {import('next').NextConfig} */
module.exports = {
  poweredByHeader: false,
  // `next build` writes to the same .next/ that a running `next dev` reads
  // from, and clobbering it out from under a live dev server produces stale
  // chunk 404s until the dev server restarts. Set NEXT_BUILD_DIR to build
  // into an isolated directory instead (e.g. for a one-off correctness
  // check) without disturbing a shared dev server. Unset, this is .next as
  // usual.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  transpilePackages: ['@repo/ui'],
  // Self-contained server bundle for the Docker image. The tracing root is the
  // monorepo root so the workspace packages are copied into the bundle too.
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.freetogame.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
