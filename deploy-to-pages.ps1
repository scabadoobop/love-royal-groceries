# PowerShell script to deploy Creator & Talent Hub to GitHub Pages
# Run this after creating the GitHub repository

Write-Host "Creator & Talent Hub - GitHub Pages Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Get GitHub username
$username = Read-Host "Enter your GitHub username"

Write-Host ""
Write-Host "Step 1: Create the repository on GitHub first:" -ForegroundColor Yellow
Write-Host "  1. Go to https://github.com/new" -ForegroundColor White
Write-Host "  2. Repository name: creator-talent-hub" -ForegroundColor White
Write-Host "  3. Description: Creator & Talent Hub - Static website prototype" -ForegroundColor White
Write-Host "  4. Set to Public" -ForegroundColor White
Write-Host "  5. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
Write-Host "  6. Click 'Create repository'" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Have you created the repository? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Please create the repository first, then run this script again." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Step 2: Setting up remote and pushing..." -ForegroundColor Yellow

# Remove old remote if it exists (for creator-talent-hub)
git remote remove creator-talent-hub 2>$null

# Add new remote
git remote add creator-talent-hub "https://github.com/$username/creator-talent-hub.git"

# Rename branch to main if needed
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Renaming branch to 'main'..." -ForegroundColor Cyan
    git branch -M main
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u creator-talent-hub main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 3: Enable GitHub Pages:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://github.com/$username/creator-talent-hub/settings/pages" -ForegroundColor White
    Write-Host "  2. Under 'Source', select:" -ForegroundColor White
    Write-Host "     - Branch: main" -ForegroundColor White
    Write-Host "     - Folder: / (root)" -ForegroundColor White
    Write-Host "  3. Click 'Save'" -ForegroundColor White
    Write-Host ""
    Write-Host "Your site will be available at:" -ForegroundColor Cyan
    Write-Host "  https://$username.github.io/creator-talent-hub/" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: It may take 5-10 minutes for the site to be live." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✗ Error pushing to GitHub. Please check:" -ForegroundColor Red
    Write-Host "  1. Repository exists at https://github.com/$username/creator-talent-hub" -ForegroundColor White
    Write-Host "  2. You have push access to the repository" -ForegroundColor White
    Write-Host "  3. Your GitHub credentials are configured" -ForegroundColor White
}




