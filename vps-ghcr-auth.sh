#!/bin/bash
# Authenticate VPS with GitHub Container Registry for private packages
# Run this script on your VPS as the lumos user

# You'll need a GitHub Personal Access Token (PAT) with read:packages scope
# Create one at: https://github.com/settings/tokens/new
# Select scope: read:packages

echo "Enter your GitHub username:"
read GITHUB_USERNAME

echo "Enter your GitHub Personal Access Token (PAT):"
read -s GITHUB_TOKEN

# Login to GHCR
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin

if [ $? -eq 0 ]; then
    echo "✅ Successfully authenticated with GHCR!"
    echo "VPS can now pull private images from ghcr.io/getlumos"
else
    echo "❌ Authentication failed. Check your token and try again."
fi
