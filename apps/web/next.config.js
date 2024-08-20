/** @type {import('next').NextConfig} */
module.exports = {
  env: {
    base_url: 'http://localhost:3000'
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
