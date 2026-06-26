import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@base-ui/react", "@base-ui/utils", "@babel/runtime"],
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
