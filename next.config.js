/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true, // Define se o redirecionamento é permanente (308) ou temporário (307)
      },
    ]
  },
};

module.exports = nextConfig;
