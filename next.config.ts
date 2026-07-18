import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Remove basePath if using a custom domain
  basePath: isProd ? "/partiu-orlando" : "",
  assetPrefix: isProd ? "/partiu-orlando" : "",
};

export default nextConfig;
