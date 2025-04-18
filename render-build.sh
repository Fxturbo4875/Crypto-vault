#!/bin/bash

# Install all dependencies including dev dependencies
npm install --production=false

# Run the build
npm run build

# Keep the build artifacts in dist folder
echo "Build completed successfully!"