# Push Command with Token

Run this command in PowerShell, replacing `YOUR_TOKEN` with your actual token:

```powershell
git remote set-url creator-talent-hub https://YOUR_TOKEN@github.com/scabadoobop/creator-talent-hub.git
git push -u creator-talent-hub main
```

**OR** if your repository has a different name, use:

```powershell
git remote set-url creator-talent-hub https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u creator-talent-hub main
```

## Alternative: Use the Script

Run the automated script (it will prompt for your token securely):

```powershell
.\push-with-token.ps1
```




