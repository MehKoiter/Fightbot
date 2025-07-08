#!/bin/bash
# FightBot Command Runner
# This script simplifies running common FightBot commands
# Usage: ./run.sh [command]

function show_help {
    echo ""
    echo "FightBot Command Runner"
    echo "======================"
    echo ""
    echo "Available commands:"
    echo "  start         - Start the bot"
    echo "  dev           - Start the bot in development mode"
    echo "  deploy        - Deploy commands to development server"
    echo "  deploy-global - Deploy commands globally"
    echo "  setup         - Run setup utility"
    echo "  test          - Run tests"
    echo ""
    echo "Usage: ./run.sh [command]"
    echo ""
}

# Show help if no command provided
if [ -z "$1" ]; then
    show_help
    exit 0
fi

# Process commands
case "$1" in
    start)
        echo "Starting FightBot..."
        npm run start
        ;;
    dev)
        echo "Starting FightBot in development mode..."
        npm run dev
        ;;
    deploy)
        echo "Deploying commands..."
        npm run deploy:dev
        ;;
    deploy-global)
        echo "Deploying commands globally..."
        npm run deploy
        ;;
    setup)
        echo "Running setup..."
        npm run setup
        ;;

    test)
        echo "Running tests..."
        npm run test
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
