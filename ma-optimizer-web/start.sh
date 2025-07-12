#!/bin/bash

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the application
echo "Building the application..."
npm run build

# Start the server
echo "Starting the server..."
npm run server