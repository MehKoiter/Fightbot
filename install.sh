#!/bin/bash

# FightBot Free v1.0.0 - Installation Script
# This script helps you set up FightBot Free quickly

echo "🥊 FightBot Free v1.0.0 - Installation Script"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    echo "   Please update Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️ Setting up environment configuration..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo ""
        echo "🔧 IMPORTANT: Please edit .env file with your Discord bot credentials:"
        echo "   - DISCORD_TOKEN=your_bot_token_here"
        echo "   - CLIENT_ID=your_client_id_here" 
        echo "   - GUILD_ID=your_guild_id_here (optional)"
        echo ""
        echo "📖 Need help getting these values?"
        echo "   1. Go to https://discord.com/developers/applications"
        echo "   2. Create a new application or select existing"
        echo "   3. Go to 'Bot' section and copy the token"
        echo "   4. Go to 'General Information' and copy Application ID"
        echo ""
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Test basic functionality
echo ""
echo "🧪 Running basic tests..."
if npm run test:simple; then
    echo "✅ Basic tests passed"
else
    echo "❌ Basic tests failed"
    exit 1
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your Discord bot credentials"
echo "   2. Deploy commands: npm run deploy"
echo "   3. Start the bot: npm start"
echo ""
echo "📖 For help:"
echo "   - Use /help command in Discord"
echo "   - Check README.md for full documentation"
echo "   - Email: support@fightbot.com"
echo ""
echo "🥊 Welcome to FightBot Free!"
