#!/bin/sh
# 生成可以放到任意静态网站（GitHub Pages 等）的完整站点：sh make_site.sh <dist目录> <输出目录>
set -e
DIST=$1; OUT=$2; HERE=$(dirname "$0")
mkdir -p "$OUT"
cp -r "$DIST/index.txt" "$DIST/t" "$DIST/i" "$OUT/"
cp "$HERE"/icon-*.png "$HERE/manifest.webmanifest" "$HERE/sw.js" "$OUT/"
{
  printf '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<meta name="theme-color" content="#F3F5F8">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="行测真题库">\n'
  printf '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-180.png">\n<link rel="icon" href="icon-192.png">\n'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px)}body{margin:0}img{max-width:100%%}</style>\n</head>\n<body>\n'
  cat "$HERE/app.html"
  printf '\n</body>\n</html>\n'
} > "$OUT/index.html"
touch "$OUT/.nojekyll"
