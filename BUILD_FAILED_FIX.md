# 🔧 Fix: Build Failed in Railway

## Quick Fixes (Try These First)

### ✅ Fix 1: Verify Root Directory
**This is the #1 cause of build failures!**

1. Go to Railway → Your service → **Settings**
2. Check **"Root Directory"**
3. Must be: `backend` (not empty, not `/`, not `./backend`)
4. If wrong, change it and click **Save**
5. Go to **Deployments** → Click **Redeploy**

---

### ✅ Fix 2: Check Build Command
Railway should auto-detect, but verify:

1. Go to **Settings** → **Build & Deploy**
2. **Build Command:** Should be empty OR `npm install`
3. **Start Command:** Should be `npm start`
4. If wrong, fix and save

---

### ✅ Fix 3: Add Node Version
I've updated `package.json` to specify Node version. Make sure it's committed:

```bash
git add backend/package.json
git commit -m "Add Node.js version specification"
git push origin master
```

This will trigger a new deployment.

---

### ✅ Fix 4: Check for Missing Files
Railway needs these files in the `backend` folder:
- ✅ `package.json` (must exist)
- ✅ `server.js` (must exist)
- ✅ All route files
- ✅ Database files

**Verify:** Make sure all files are committed to git:
```bash
git status
```

---

## 🔍 Check the Actual Error

To see what's really failing:

1. Go to Railway → Your service
2. Click **"Deployments"** tab
3. Click on the **failed deployment** (red X)
4. Scroll down to see **build logs**
5. Look for error messages like:
   - "Cannot find module"
   - "package.json not found"
   - "Command failed"
   - "ENOENT"

---

## Common Error Messages & Fixes

### ❌ "Cannot find module 'package.json'"
**Fix:** Root Directory is wrong - set to `backend`

### ❌ "Command 'npm install' failed"
**Fix:** 
- Check Node version (should be 18+)
- Try clearing build cache in Railway settings

### ❌ "ENOENT: no such file or directory"
**Fix:** Missing files - make sure all backend files are committed to git

### ❌ "Module not found: Can't resolve './routes/auth'"
**Fix:** Root Directory is wrong - should be `backend`

### ❌ "Port 3001 already in use"
**Fix:** Remove PORT variable (Railway sets it automatically)

---

## 🚀 Step-by-Step Fix

1. **Verify Root Directory:**
   - Settings → Root Directory = `backend`

2. **Check Build/Start Commands:**
   - Build Command: (empty or `npm install`)
   - Start Command: `npm start`

3. **Commit the updated package.json:**
   ```bash
   git add backend/package.json
   git commit -m "Fix: Add Node.js version"
   git push origin master
   ```

4. **Redeploy:**
   - Go to Deployments → Click Redeploy
   - Or wait for auto-deploy from git push

---

## 📋 What to Check Right Now

In Railway dashboard:

1. **Service Settings:**
   - [ ] Root Directory = `backend`
   - [ ] Build Command = (empty) or `npm install`
   - [ ] Start Command = `npm start`

2. **Variables:**
   - [ ] DATABASE_URL is set
   - [ ] JWT_SECRET is set
   - [ ] CORS_ORIGIN is set
   - [ ] NODE_ENV = production

3. **Deployment Logs:**
   - [ ] Check the actual error message
   - [ ] Copy the last 20 lines of logs

---

## 💡 Still Not Working?

Share with me:
1. **The exact error message** from deployment logs (last 10-20 lines)
2. **Screenshot** of your Settings page (Root Directory, Build/Start commands)
3. **Screenshot** of Variables tab

This will help me give you the exact fix!

---

## 🔄 Nuclear Option: Fresh Start

If nothing works:

1. **Delete the service** in Railway
2. **Create new service** → Deploy from GitHub repo
3. **IMPORTANT:** When creating, immediately set Root Directory to `backend`
4. Add PostgreSQL database
5. Add environment variables
6. Deploy

---

**Most likely issue:** Root Directory not set to `backend`! ⚠️

Check that first, then check the deployment logs for the specific error.

