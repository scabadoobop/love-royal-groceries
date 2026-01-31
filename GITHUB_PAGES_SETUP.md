# GitHub Pages Deployment Instructions

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Repository name: `creator-talent-hub`
5. Description: "Creator & Talent Hub - Static website prototype"
6. Set visibility to Public (required for free GitHub Pages)
7. **DO NOT** initialize with README, .gitignore, or license (we already have these)
8. Click "Create repository"

## Step 2: Push to GitHub

Run these commands in your terminal (replace `YOUR_USERNAME` with your GitHub username):

```bash
# Add the remote repository (if not already added)
git remote add origin https://github.com/YOUR_USERNAME/creator-talent-hub.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/creator-talent-hub.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note:** If you already have a remote configured, you may need to:
- Remove the old remote: `git remote remove origin`
- Add the new remote: `git remote add origin https://github.com/YOUR_USERNAME/creator-talent-hub.git`
- Push: `git push -u origin main`

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" (top menu)
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click "Save"
6. Wait a few minutes for GitHub to build and deploy your site

## Step 4: Access Your Site

Your site will be available at:
```
https://YOUR_USERNAME.github.io/creator-talent-hub/
```

**Note:** It may take 5-10 minutes for the site to be available after enabling GitHub Pages.

## Troubleshooting

### If the site shows a 404 error:
- Wait a few more minutes (deployment can take time)
- Check that the branch is set to `main` (not `master`)
- Ensure all files are in the root directory
- Check the repository Settings > Pages for any error messages

### If styles/images don't load:
- Ensure all file paths are relative (they should be)
- Check browser console for 404 errors
- Verify that `css/styles.css` and `js/` files are in the repository

### If you need to update the site:
Simply make changes, commit, and push:
```bash
git add .
git commit -m "Update website"
git push
```

GitHub Pages will automatically rebuild your site.


