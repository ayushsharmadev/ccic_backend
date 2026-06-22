import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "admissionbangladesh.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "admin.admissionbangladesh.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    qualities: [25, 50, 75, 100],
  },

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*", 
        // agar aap API bana chuke ho to yahan map hoga
      },
    ];
  },
};

export default nextConfig;
