#!/bin/sh
# Copies the web app into www/ for Capacitor. Run from the app/ folder.
set -e
rm -rf www && mkdir -p www/img
cp ../hub.html www/index.html
cp ../manifest.webmanifest ../icon-192.png ../icon-512.png ../apple-touch-icon.png www/
[ -f ../baths.jpg ] && cp ../baths.jpg www/ || true
cp ../img/*.jpg www/img/ 2>/dev/null || true
echo "www/ ready"
