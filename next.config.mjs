// GitHub Pages: the deploy workflow sets PAGES_BASE_PATH (the repository name,
// e.g. "/CV") and the site is built as plain static files under that path.
// Without it (next dev, local builds) the site works from the root as before.
const basePath = process.env.PAGES_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // these need a server; the static Pages build goes without them
  cacheComponents: !basePath,
  partialPrefetching: !basePath,
  ...(basePath && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  // lets client code build URLs of files in /public
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
