@echo off
setlocal

set "NODE22_PATH=%~dp0node22\node-v22.11.0-win-x64"
set "PATH=%NODE22_PATH%;%PATH%"

echo Using Node: 
node -v

echo Starting Expo...
call npx expo start --clear %*

endlocal
