#!/bin/bash
# Double-click launcher for macOS: installs what is needed on the first run, then starts the site.
cd "$(dirname "$0")" || exit 1
pause() { echo; read -n 1 -s -r -p "Press any key to close this window..."; echo; }

echo "=== Hum1 site ==="
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed yet."
  echo "I will open the download page. Click the green LTS button, install it,"
  echo "then double-click this file again."
  command -v open >/dev/null 2>&1 && open "https://nodejs.org"
  pause; exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run: installing (1-2 minutes, needs internet)..."
  if ! npm install; then echo "Installation failed. Check your internet and try again."; pause; exit 1; fi
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "I created the settings file (.env) and will open it now."
  echo "1) Change the line ADMIN_PASSWORD=... to your own password"
  echo "2) Press Cmd+S to save and close the window"
  echo "3) Double-click Start-Hum1.command again"
  command -v open >/dev/null 2>&1 && open -e .env
  pause; exit 0
fi

PORT=$(grep -E '^PORT=' .env | head -n1 | cut -d= -f2 | tr -d ' \r')
PORT=${PORT:-3000}
echo "Starting... the site will open in your browser: http://localhost:$PORT"
echo "To stop the server press Control+C or close this window."
command -v open >/dev/null 2>&1 && (sleep 2; open "http://localhost:$PORT") &
npm start
pause
