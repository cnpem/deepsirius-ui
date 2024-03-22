import createMDX from 'fumadocs-mdx/config';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  reactStrictMode: true,
};

export default withMDX(config);
