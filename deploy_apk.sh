#!/bin/bash

# Configuration
SOURCE_APK="./android/app/build/outputs/apk/debug/app-debug.apk"
DEST_DIR="./server/public"
DEST_FILE="$DEST_DIR/simtinel.apk"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting APK Deployment..."

# 1. Check if source APK exists
if [ ! -f "$SOURCE_APK" ]; then
    echo -e "${RED}Error: Source APK not found at $SOURCE_APK${NC}"
    echo "Please ensure you have built the APK using './gradlew assembleDebug'"
    exit 1
fi

# 2. Check if destination directory exists, create if not
if [ ! -d "$DEST_DIR" ]; then
    echo "Creating destination directory: $DEST_DIR"
    mkdir -p "$DEST_DIR"
fi

# 3. Copy and rename the file
echo "Copying APK to server public directory..."
cp "$SOURCE_APK" "$DEST_FILE"

# 4. Verify copy
if [ -f "$DEST_FILE" ]; then
    echo -e "${GREEN}Success! APK deployed to: $DEST_FILE${NC}"
    ls -l "$DEST_FILE"
else
    echo -e "${RED}Error: Failed to copy APK.${NC}"
    exit 1
fi
