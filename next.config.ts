import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lightyellow-dogfish-784027.hostingersite.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
