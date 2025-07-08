#!/bin/bash

# FightBot Replit Startup Script
echo "🥊 Starting FightBot..."

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Initialize database if needed
echo "🗄️ Setting up database..."
npm run setup:init

# Check if commands are deployed
echo "🚀 Checking Discord command deployment..."
if [ ! -f ".commands_deployed" ]; then
    echo "📋 Deploying Discord commands..."
    npm run deploy
    touch .commands_deployed
fi

# Start the bot
echo "🎯 Starting FightBot..."
npm start
