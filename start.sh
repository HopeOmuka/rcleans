#!/bin/bash
# Fix Metro.js loading issue and clear cache

# Step 1: Verify metro.config.js content
echo "Checking metro.config.js..."
cat metro.config.js

# Step 2: Clear caches
echo "Clearing caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .watchman*

# Step 3: Clear watchman cache
if command -v watchman >/dev/null 2>&1; then
    echo "Clearing watchman cache..."
    watchman watch-del-all 2>/dev/null || true
else
    echo "watchman not available, skipping..."
fi

# Step 4: Start Expo
echo "Starting Expo..."
npx expo run:android --clear