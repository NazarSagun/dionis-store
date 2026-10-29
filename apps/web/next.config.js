const { withSentryConfig } = require('@sentry/nextjs/config')

/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // Game images from the media bucket, read at build time.
      ...(process.env.MEDIA_BASE_URL
        ? [{ protocol: 'https', hostname: new URL(process.env.MEDIA_BASE_URL).hostname, pathname: '/games/**' }]
        : []),
      // Trailer posters.
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' },
      // Thumbnails of games that the IGDB import has not replaced yet.
      { protocol: 'https', hostname: 'www.freetogame.com', pathname: '/**' },
    ],
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: 'nazar-hz',
  project: 'dionis-web',
  // Uploads source maps on `next build` when SENTRY_AUTH_TOKEN is set. Without
  // it the build still passes, and stack traces show minified code.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Browser events go through this app's own /monitoring route, so ad
  // blockers that block sentry.io do not drop them.
  tunnelRoute: '/monitoring',
  silent: !process.env.CI,
})
