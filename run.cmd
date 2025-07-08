@echo off
REM FightBot Command Runner
REM This script simplifies running common FightBot commands
REM Usage: run [command]

IF "%1"=="" (
    GOTO help
)

IF "%1"=="start" (
    echo Starting FightBot...
    npm run start
    GOTO end
)

IF "%1"=="dev" (
    echo Starting FightBot in development mode...
    npm run dev
    GOTO end
)

IF "%1"=="deploy" (
    echo Deploying commands...
    npm run deploy:dev
    GOTO end
)

IF "%1"=="deploy-global" (
    echo Deploying commands globally...
    npm run deploy
    GOTO end
)

IF "%1"=="setup" (
    echo Running setup...
    npm run setup
    GOTO end
)

IF "%1"=="legacy" (
    echo Starting FightBot with legacy architecture...
    npm run start:legacy
    GOTO end
)

IF "%1"=="test" (
    echo Running tests...
    npm run test
    GOTO end
)

:help
echo.
echo FightBot Command Runner
echo ======================
echo.
echo Available commands:
echo   start         - Start the bot
echo   dev           - Start the bot in development mode
echo   deploy        - Deploy commands to development server
echo   deploy-global - Deploy commands globally
echo   setup         - Run setup utility
echo   legacy        - Run the legacy version of the bot
echo   test          - Run tests
echo.
echo Usage: run [command]
echo.
GOTO end

:end
