#!/bin/bash

# This script deploys the MA Optimizer Web application to a production server

# Build the application
echo "Building the application..."
npm run build

# Create a deployment package
echo "Creating deployment package..."
mkdir -p deploy
cp -r dist deploy/
cp server.js deploy/
cp package.json deploy/
cp README.md deploy/

# Create a simple deployment script
cat > deploy/start.sh << 'EOF'
#!/bin/bash
npm install --production
npm run server
EOF

chmod +x deploy/start.sh

# Create a zip file
echo "Creating zip file..."
cd deploy
zip -r ma-optimizer-web.zip .
cd ..

echo "Deployment package created at deploy/ma-optimizer-web.zip"
echo "To deploy, upload the zip file to your server and run:"
echo "  unzip ma-optimizer-web.zip"
echo "  ./start.sh"