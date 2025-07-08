@echo off
REM FightBot Free v1.0.0 - Windows Installation Script
REM This script helps you set up FightBot Free quickly on Windows

echo 🥊 FightBot Free v1.0.0 - Installation Script
echo ==============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Check if .env exists
if not exist ".env" (
    echo.
    echo ⚙️ Setting up environment configuration...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Created .env file from .env.example
        echo.
        echo 🔧 IMPORTANT: Please edit .env file with your Discord bot credentials:
        echo    - DISCORD_TOKEN=your_bot_token_here
        echo    - CLIENT_ID=your_client_id_here
        echo    - GUILD_ID=your_guild_id_here (optional)
        echo.
        echo 📖 Need help getting these values?
        echo    1. Go to https://discord.com/developers/applications
        echo    2. Create a new application or select existing
        echo    3. Go to 'Bot' section and copy the token
        echo    4. Go to 'General Information' and copy Application ID
        echo.
    ) else (
        echo ❌ .env.example file not found
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file already exists
)

REM Test basic functionality
echo.
echo 🧪 Running basic tests...
call npm run test:simple
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Basic tests failed
    pause
    exit /b 1
)
echo ✅ Basic tests passed

echo.
echo 🎉 Installation completed successfully!
echo.
echo 📋 Next steps:
echo    1. Edit .env file with your Discord bot credentials
echo    2. Deploy commands: npm run deploy
echo    3. Start the bot: npm start
echo.
echo 📖 For help:
echo    - Use /help command in Discord
echo    - Check README.md for full documentation
echo    - Email: support@fightbot.com
echo.
echo 🥊 Welcome to FightBot Free!
echo.
pause
