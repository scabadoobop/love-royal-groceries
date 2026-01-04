#!/bin/bash

# Royal Groceries Deployment Script
echo "👑 Deploying Royal Groceries to GitHub Pages..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed. No dist directory found."
    exit 1
fi

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://yourusername.github.io/love-royal-groceries"
echo ""
echo "📝 Next steps:"
echo "1. Set up your backend (see DEPLOYMENT.md)"
echo "2. Update the API_URL in your environment"
echo "3. Test with the default household key: ROYAL2024"
