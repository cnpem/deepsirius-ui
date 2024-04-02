import createMDX from 'fumadocs-mdx/config';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
  basePath: '/dive',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dive',
        basePath: false,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/docs',
      },
    ];
  }
};

export default withMDX(config);
