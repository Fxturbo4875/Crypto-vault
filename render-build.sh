#!/bin/bash

# Print commands and their arguments as they are executed
set -x

# Install all dependencies including devDependencies (this is crucial for Vite)
npm install --production=false

# Run the build command
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
  echo "Build completed successfully!"
else
  echo "Build failed!"
  exit 1
fi