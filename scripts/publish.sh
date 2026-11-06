#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
github_updated=0
stage="local checks"
report_failure() {
  status=$?
  if (( status != 0 )); then
    printf '\nPublication stopped during %s.\n' "$stage" >&2
    if (( github_updated )); then
      printf 'GitHub may contain the new commit while the site is not fully verified. Resolve the error and run this script again.\n' >&2
    else
      printf 'The site was not deployed by this run.\n' >&2
    fi
  fi
}
trap report_failure EXIT

if [[ "${1:-}" != "" && "${1:-}" != "--check" ]]; then
  printf 'Usage: bash scripts/publish.sh [--check]\n' >&2
  exit 2
fi
if [[ "$(git rev-parse --show-toplevel)" != "$root" ]]; then
  printf 'Run this script from the dedicated public repository.\n' >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != "main" ]]; then
  printf 'Switch to the main branch before publishing.\n' >&2
  exit 1
fi
if [[ "$(git remote get-url origin)" != "https://github.com/qtwhat/3GPP.studio.git" ]]; then
  printf 'The origin remote must point to qtwhat/3GPP.studio.\n' >&2
  exit 1
fi
node --test tests/*.test.mjs
check_dir="$(mktemp -d "${TMPDIR:-/tmp}/3gpp-studio-check.XXXXXX")"
LCP_OUTPUT_DIR="$check_dir" node source/lcp/build2.mjs --light
python3 source/lcp/apply_to_site.py "$check_dir/lcp-three-channels-light.html" --check
python3 tools/prepare_release.py --check
if [[ "${1:-}" == "--check" ]]; then
  printf 'Local checks passed. Nothing was pushed or deployed.\n'
  exit 0
fi

stage="fetching GitHub changes"
git fetch --no-tags origin main
remote_sha="$(git rev-parse FETCH_HEAD)"
if ! git merge-base --is-ancestor "$remote_sha" HEAD; then
  printf 'GitHub has changes not present locally. Integrate them before publishing; no files have been overwritten.\n' >&2
  exit 1
fi
stage="creating the publication commit"
git add --all
git diff --cached --check
if ! git diff --cached --quiet; then
  git commit -m "${PUBLISH_MESSAGE:-Publish 3GPP.studio updates}"
fi
release_sha="$(git rev-parse HEAD)"
stage="pushing to GitHub"
git push origin HEAD:refs/heads/main
github_updated=1
remote_sha="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
if [[ "$remote_sha" != "$release_sha" ]]; then
  printf 'GitHub main changed after the push. Integrate the new commit and publish again.\n' >&2
  exit 1
fi
stage="preparing the site from the GitHub commit"
release_dir="$(mktemp -d "${TMPDIR:-/tmp}/3gpp-studio-release.XXXXXX")"
python3 tools/prepare_release.py --commit "$release_sha" "$release_dir/site" > "$release_dir/manifest.json"
if [[ -n "${RELEASE_MANIFEST:-}" ]]; then
  cp "$release_dir/manifest.json" "$RELEASE_MANIFEST"
fi
stage="deploying to Cloudflare Pages"
if [[ -n "${WRANGLER_JS:-}" ]]; then
  env -u CLOUDFLARE_API_TOKEN node "$WRANGLER_JS" pages deploy "$release_dir/site" --project-name 3gpp-studio --branch main --commit-dirty=true
else
  env -u CLOUDFLARE_API_TOKEN npx wrangler@4.156.2 pages deploy "$release_dir/site" --project-name 3gpp-studio --branch main --commit-dirty=true
fi
stage="verifying the live site"
python3 tools/verify_release.py "$release_dir/manifest.json" "${SITE_CHECK_URL:-https://3gpp.studio}"
remote_sha="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
if [[ "$remote_sha" != "$release_sha" ]]; then
  printf 'GitHub main changed during deployment. Integrate the new commit and publish again.\n' >&2
  exit 1
fi
printf 'Published and verified commit %s. Manifest: %s/manifest.json\n' "$release_sha" "$release_dir"
