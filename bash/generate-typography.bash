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


# Generate typography CSS
npx tsx ./bash/utils/generate-typography.ts || {
    echo "Error: Failed to generate typography CSS"
    exit 1
}



echo "✅ Typography generation completed successfully"
