import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.backblazeb2.com" },
      { protocol: "https", hostname: "fls-prod.s3.eu-central-003.backblazeb2.com" },
    ],
  },
};

export default nextConfig;
