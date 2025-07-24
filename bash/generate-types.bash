#!/bin/bash

# Exit on any error
set -e

# Source the .env file if it exists
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    exit 1
fi

# Check if STORYBLOK_SPACE_ID is set
if [ -z "$STORYBLOK_SPACE_ID" ]; then
    echo "Error: STORYBLOK_SPACE_ID environment variable is not set"
    exit 1
fi

# Create directories if they don't exist
mkdir -p ./src/types/storyblok-temp || {
    echo "Error: Failed to create directory ./src/types/storyblok-temp"
    exit 1
}

# Pull components from Storyblok
cd ./src/types/storyblok-temp && storyblok pull-components --space $STORYBLOK_SPACE_ID || {
    echo "Error: Failed to pull components from Storyblok. Please make sure you're logged in with the correct account."
    storyblok user
    exit 1
}
cd ../../..

# Generate TypeScript types
storyblok-generate-ts source=./src/types/storyblok-temp/components.$STORYBLOK_SPACE_ID.json target=./src/types/storyblok-temp/types-original || {
    echo "Error: Failed to generate TypeScript types"
    exit 1
}

# Modify TypeScript types
npx tsx ./bash/utils/modify-ts || {
    echo "Error: Failed to modify TypeScript types"
    exit 1
}

# Generate Zod types
ts-to-zod ./src/types/storyblok.d.ts ./src/types/storyblok.zod.ts || {
    echo "Error: Failed to generate Zod types"
    exit 1
}

# Modify Zod types
npx tsx ./bash/utils/modify-zod || {
    echo "Error: Failed to modify Zod types"
    exit 1
}

# Remove temp directory
rm -rf ./src/types/storyblok-temp || {
    echo "Error: Failed to remove temporary directory"
    exit 1
}
