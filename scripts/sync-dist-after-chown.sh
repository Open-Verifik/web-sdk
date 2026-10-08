#!/usr/bin/env bash
# Run once with sudo (dist folders were created by root during deploy builds):
#   sudo bash scripts/sync-dist-after-chown.sh
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Re-run with sudo so dist ownership can be fixed."
  exit 1
fi

REPOS=(
  "/Users/miguel/verifik/biometrics-javascript-sdk|dist/fuse|dist/fuse_build|dist/fuse_root_old"
  "/Users/miguel/verifik/verifik-admin-panel/v2|dist|dist/build|dist_root_old"
  "/Users/miguel/Smart-Agent/frontend|dist|dist/build|dist_root_old"
)

for entry in "${REPOS[@]}"; do
  IFS='|' read -r root target staging backup <<<"$entry"
  echo "==> $root ($target)"
  chown -R "$(logname 2>/dev/null || echo "${SUDO_USER:-$USER}")" "$root/dist" "$root/.git" 2>/dev/null || chown -R "${SUDO_USER:-$USER}" "$root/dist" "$root/.git" 2>/dev/null || true

  if [[ -d "$root/$staging" ]]; then
    rm -rf "$root/$target"
    mv "$root/$staging" "$root/$target"
    echo "    promoted $staging -> $target"
  fi
done

echo "Done. In each repo run: git status && git checkout HEAD -- <dist-path>  # if needed"
