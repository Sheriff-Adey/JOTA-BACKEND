#!/bin/bash

# JOTA Backend Deployment Script
# Run this on each droplet

echo "=== JOTA Backend Deployment Script ==="

# Update system
echo "Updating system..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
echo "Installing Yarn..."
sudo npm install -g yarn

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Clone the repository
echo "Cloning repository..."
cd /home
git clone https://github.com/Sheriff-Adey/JOTA-BACKEND.git
cd JOTA-BACKEND

# Install dependencies
echo "Installing dependencies..."
yarn install

# Build the application
echo "Building application..."
yarn build

# Configure environment
echo "Configuring environment..."
cat > .env <<EOF
NODE_ENV=production
PORT=3000
DB_HOST=jota-db-do-user-16324573-0.d.db.ondigitalocean.com
DB_PORT=25060
DB_USERNAME=doadmin
DB_PASSWORD=AVNS_qDAcVGtSuqHHYDRYjML
DB_DATABASE=defaultdb
JWT_SECRET=your_jwt_secret_here
EOF

# Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# Start the application with PM2
echo "Starting application..."
pm2 start dist/main.js --name jota-api

# Configure PM2 to start on boot
pm2 startup
pm2 save

echo "=== Deployment Complete ==="
echo "API should be running on port 3000"
