#!/usr/bin/env bash
# Builds backend/dist/ and packages a Hostinger-deploy-ready archive at
# /tmp/rotiradar-backend-deploy.tar.gz. See docs/deployment-hostinger.md §3.
#
# Why this script exists instead of just handing Hostinger the source (like the static sites'
# Git-import build does for web/ and admin-console/):
#
# 1. Hostinger's shared-hosting Node.js build container silently OOMs on `tsc -p tsconfig.json` —
#    no error, no crash trace, the build just sits in "running" forever. Compiling locally (a dev
#    machine or CI has real memory) and shipping the compiled `dist/` sidesteps it entirely.
# 2. Its entry-file auto-detection strips the directory off `start: "node dist/server.js"` and
#    looks for a bare `server.js` at the *archive root* — so the compiled output is placed at the
#    archive root here, not under dist/.
# 3. It runs the whole install with NODE_ENV=production, which makes `npm install` skip every
#    devDependency — including `typescript` and the `prisma` CLI that `postinstall` needs. Both
#    are regular `dependencies` in package.json for exactly this reason (see git history on that
#    file) — nothing to do here, just don't undo it.
set -euo pipefail
cd "$(dirname "$0")/.."   # -> backend/

REPO_ROOT="$(cd .. && pwd)"
WORKDIR=/tmp/rr-deploy-src
ARCHIVE=/tmp/rotiradar-backend-deploy.tar.gz

echo "==> Refreshing backend-root from the current backend/ subtree"
(cd "$REPO_ROOT" && git subtree split --prefix=backend -b backend-root --rejoin >/dev/null 2>&1 || \
  (git branch -D backend-root >/dev/null 2>&1 || true; git subtree split --prefix=backend -b backend-root))

find "$WORKDIR" -type f -delete 2>/dev/null || true
mkdir -p "$WORKDIR"
(cd "$REPO_ROOT" && git archive backend-root) | tar -x -C "$WORKDIR"

echo "==> Compiling locally (npm run build)"
npm run build
cp -R dist/. "$WORKDIR"/

echo "==> Patching package.json for the archive (postinstall/build/start)"
python3 - "$WORKDIR/package.json" <<'PYEOF'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d["scripts"]["postinstall"] = "prisma generate && prisma migrate deploy"
d["scripts"]["build"] = "echo 'prebuilt at archive root - tsc skipped (OOMs on Hostinger shared hosting)'"
d["scripts"]["start"] = "node server.js"
json.dump(d, open(p, "w"), indent=2)
PYEOF

find "$ARCHIVE" -delete 2>/dev/null || true
(cd "$WORKDIR" && tar -czf "$ARCHIVE" .)

echo "==> Archive ready: $ARCHIVE"
echo "Deploy it with the hostinger MCP:"
echo "  hosting_deployJsApplication(domain=\"api.rotiradar.in\", archivePath=\"$ARCHIVE\")"
echo "Then poll hosting_listNodeJSBuildsV1 / hosting_getNodeJSBuildLogsV1 — a healthy app settles"
echo "into state \"running\" (it never exits), which is success, not \"still building\"."
