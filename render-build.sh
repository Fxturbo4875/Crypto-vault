
#!/bin/bash
set -x

# Install dependencies including dev dependencies
npm install

# Build the client
npm run build

if [ $? -eq 0 ]; then
  echo "Build completed successfully!"
else
  echo "Build failed!"
  exit 1
fi

# Run database migrations
npm run db:push
