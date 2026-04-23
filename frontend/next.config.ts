/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow leaflet to work in SSR environment
  transpilePackages: ['leaflet', 'react-leaflet'],
};

export default nextConfig;
