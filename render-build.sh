
#!/bin/bash
set -x

# Install dependencies
npm install

# Build the client
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
  echo "Build completed successfully!"
else
  echo "Build failed!"
  echo "Running npm audit to check for issues..."
  npm audit
  exit 1
fi

# Run database migrations
npm run db:push

# Final success message
echo "Build process completed successfully!"
