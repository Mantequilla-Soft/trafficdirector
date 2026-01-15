#!/bin/bash

# 3Speak Traffic Director - Installation Script
# Run with sudo: sudo ./install.sh

set -e

echo "=========================================="
echo "3Speak Traffic Director - Installation"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root: sudo ./install.sh"
    exit 1
fi

# Get the current directory (where the script is located)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_DIR="/opt/trafficdirector"
SERVICE_NAME="trafficdirector"
LOG_DIR="/var/log/trafficdirector"

echo "📋 Configuration:"
echo "   Source: $SCRIPT_DIR"
echo "   Install to: $INSTALL_DIR"
echo "   Service: $SERVICE_NAME"
echo ""

# Confirm installation
read -p "Continue with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 1
fi

# Check for Node.js
echo "🔍 Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/ or use: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi
echo "✅ npm found: $(npm --version)"
echo ""

# Create installation directory
echo "📁 Creating installation directory..."
mkdir -p $INSTALL_DIR

# Copy files
echo "📦 Copying application files..."
rsync -av --exclude='node_modules' --exclude='.git' --exclude='*.log' $SCRIPT_DIR/ $INSTALL_DIR/
echo "✅ Files copied"

# Install dependencies
echo "📥 Installing dependencies..."
cd $INSTALL_DIR
npm install --production
echo "✅ Dependencies installed"
echo ""

# Setup .env file
echo "⚙️  Setting up configuration..."
if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp $INSTALL_DIR/.env.example $INSTALL_DIR/.env
    echo "✅ Created .env file from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: Edit $INSTALL_DIR/.env with your configuration!"
    echo "   Required settings:"
    echo "   - PORT (default: 3000)"
    echo "   - MONGODB_URI"
    echo "   - DATABASE_NAME"
    echo "   - ADMIN_PASSWORD"
    echo "   - SESSION_SECRET"
    echo "   - API_SECRET"
else
    echo "ℹ️  .env file already exists, keeping current configuration"
fi
echo ""

# Create log directory
echo "📝 Creating log directory..."
mkdir -p $LOG_DIR
chown www-data:www-data $LOG_DIR
echo "✅ Log directory created: $LOG_DIR"

# Set permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data $INSTALL_DIR
chmod 600 $INSTALL_DIR/.env
echo "✅ Permissions set"

# Install systemd service
echo "🔧 Installing systemd service..."
cp $INSTALL_DIR/trafficdirector.service /etc/systemd/system/
systemctl daemon-reload
echo "✅ Service installed"

# Enable service
echo "🚀 Enabling service..."
systemctl enable $SERVICE_NAME
echo "✅ Service enabled (will start on boot)"
echo ""

echo "=========================================="
echo "✅ Installation Complete!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit configuration:"
echo "   sudo nano $INSTALL_DIR/.env"
echo ""
echo "2. Start the service:"
echo "   sudo systemctl start $SERVICE_NAME"
echo ""
echo "3. Check status:"
echo "   sudo systemctl status $SERVICE_NAME"
echo ""
echo "4. View logs:"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo "   tail -f $LOG_DIR/access.log"
echo "   tail -f $LOG_DIR/error.log"
echo ""
echo "5. Restart service:"
echo "   sudo systemctl restart $SERVICE_NAME"
echo ""
echo "6. Stop service:"
echo "   sudo systemctl stop $SERVICE_NAME"
echo ""
echo "=========================================="
