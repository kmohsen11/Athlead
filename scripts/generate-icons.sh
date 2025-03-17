#!/bin/bash

# This script generates app icons from the logo.png file
# Requires ImageMagick to be installed: brew install imagemagick

# Create the scripts directory if it doesn't exist
mkdir -p scripts

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it with: brew install imagemagick"
    exit 1
fi

# Source logo file
SOURCE_LOGO="./assets/logo.png"

# Check if source logo exists
if [ ! -f "$SOURCE_LOGO" ]; then
    echo "Source logo file not found: $SOURCE_LOGO"
    exit 1
fi

echo "Generating app icons from $SOURCE_LOGO..."

# Create adaptive icon for Android
convert "$SOURCE_LOGO" -resize 1024x1024 -background white -gravity center -extent 1024x1024 "./assets/adaptive-icon.png"
echo "Created adaptive-icon.png (1024x1024)"

# Create regular icon
convert "$SOURCE_LOGO" -resize 1024x1024 -background white -gravity center -extent 1024x1024 "./assets/icon.png"
echo "Created icon.png (1024x1024)"

# Create favicon
convert "$SOURCE_LOGO" -resize 196x196 -background white -gravity center -extent 196x196 "./assets/favicon.png"
echo "Created favicon.png (196x196)"

# Create splash icon
convert "$SOURCE_LOGO" -resize 1024x1024 -background white -gravity center -extent 1024x1024 "./assets/splash-icon.png"
echo "Created splash-icon.png (1024x1024)"

echo "All app icons have been generated successfully!"
echo "You may need to rebuild your app for the changes to take effect." 