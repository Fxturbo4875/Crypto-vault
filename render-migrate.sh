#!/bin/bash

# Print commands and their arguments as they are executed
set -x

# Install drizzle-kit and other necessary dependencies
npm install --production=false

# Run database migration
npm run db:push

# Check if migration succeeded
if [ $? -eq 0 ]; then
  echo "Database migration completed successfully!"
else
  echo "Database migration failed!"
  exit 1
fi