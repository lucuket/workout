import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS || process.env.DEPLOY_TARGET === "gh-pages";
const repoName = process.env.NEXT_PUBLIC_REPO_NAME || "workout";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
};

export default nextConfig;
