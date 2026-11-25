import type { NextConfig } from "next";

const isGithubPages = Boolean(process.env.GITHUB_ACTIONS || process.env.DEPLOY_TARGET === "gh-pages");
const repoName = process.env.NEXT_PUBLIC_REPO_NAME || "workout";
const basePath = isGithubPages ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: isGithubPages ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
