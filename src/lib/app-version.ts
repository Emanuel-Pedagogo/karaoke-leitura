import pkg from "../../package.json";

export function appVersionLabel() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  return sha ? `v${pkg.version} · ${sha}` : `v${pkg.version} · local`;
}
