/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "app.gestion360ia.com.ar" }],
        destination: "/portal",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
