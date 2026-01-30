# PowerShell script to push with Personal Access Token
Write-Host "Pushing Creator & Talent Hub to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Get token from user
$token = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Get username
$username = Read-Host "Enter your GitHub username (default: scabadoobop)"
if ([string]::IsNullOrWhiteSpace($username)) {
    $username = "scabadoobop"
}

# Get repository name
$repoName = Read-Host "Enter repository name (default: creator-talent-hub)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "creator-talent-hub"
}

# Update remote URL with token
$remoteUrl = "https://$tokenPlain@github.com/$username/$repoName.git"
git remote remove creator-talent-hub 2>$null
git remote add creator-talent-hub $remoteUrl

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow

# Push
git push -u creator-talent-hub main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/$username/$repoName/settings/pages" -ForegroundColor White
    Write-Host "2. Under Source, select Branch: main, Folder: / (root)" -ForegroundColor White
    Write-Host "3. Click Save" -ForegroundColor White
    Write-Host ""
    Write-Host "Your site will be at: https://$username.github.io/$repoName/" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Push failed. Please check:" -ForegroundColor Red
    Write-Host "  - Repository exists at https://github.com/$username/$repoName" -ForegroundColor White
    Write-Host "  - Token has repo permissions" -ForegroundColor White
    Write-Host "  - Repository name is correct" -ForegroundColor White
}

# Clear token from memory
$tokenPlain = $null
$token = $null
