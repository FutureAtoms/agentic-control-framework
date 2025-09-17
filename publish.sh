#!/bin/bash

# ACF npm Publishing Script
# This script helps publish the agentic-control-framework to npm

echo "🚀 Agentic Control Framework - npm Publishing Script"
echo "======================================================"

# Check if logged in to npm
echo "📝 Checking npm login status..."
npm whoami &>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to npm. Please login first:"
    npm login
    if [ $? -ne 0 ]; then
        echo "❌ Failed to login to npm. Exiting..."
        exit 1
    fi
else
    echo "✅ Logged in as: $(npm whoami)"
fi

# Check if package name is available
echo ""
echo "🔍 Checking package name availability..."
npm view agentic-control-framework &>/dev/null
if [ $? -eq 0 ]; then
    echo "⚠️  Package 'agentic-control-framework' already exists on npm"
    echo "    Current version on npm: $(npm view agentic-control-framework version)"
    echo "    Your local version: $(node -p "require('./package.json').version")"
    echo ""
    read -p "Do you want to continue publishing? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Publishing cancelled"
        exit 1
    fi
else
    echo "✅ Package name is available"
fi

# Run tests first
echo ""
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Fix issues before publishing."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Show what will be published
echo ""
echo "📦 Files to be published:"
npm pack --dry-run 2>/dev/null | grep -E "^npm notice" | sed 's/npm notice //'

# Confirm publication
echo ""
echo "📋 Package details:"
echo "   Name: $(node -p "require('./package.json').name")"
echo "   Version: $(node -p "require('./package.json').version")"
echo "   Description: $(node -p "require('./package.json').description")"
echo ""
read -p "Ready to publish to npm? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Publishing to npm..."
    npm publish
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully published!"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Install globally: npm install -g agentic-control-framework"
        echo "   2. Add to Claude Code: claude mcp add acf npx agentic-control-framework"
        echo ""
        echo "🎉 Congratulations! ACF is now available on npm!"
    else
        echo "❌ Publishing failed. Please check the error messages above."
        exit 1
    fi
else
    echo "❌ Publishing cancelled"
    exit 1
fi