# 🚨 Quick Fix: Railway Deployment Failing

## Most Common Issues & Fixes

### ❌ Issue 1: Root Directory Wrong
**Symptom:** "Cannot find module" or "package.json not found"

**Fix:**
1. Go to your Railway service
2. Click **"Settings"** tab
3. Find **"Root Directory"**
4. Change to: `backend` (not root!)
5. Click **"Save"**
6. Go to **"Deployments"** → Click **"Redeploy"**

---

### ❌ Issue 2: Missing Environment Variables
**Symptom:** "Database connection failed" or "JWT_SECRET is required"

**Fix:**
1. Go to your service → **"Variables"** tab
2. Add these variables (click **"+ New Variable"**):

   ```
   DATABASE_URL = (click "Add" when Railway suggests it from your PostgreSQL)
   JWT_SECRET = (generate at https://randomkeygen.com/)
   CORS_ORIGIN = https://scabadoobop.github.io
   NODE_ENV = production
   ```

3. **Important:** 
   - No quotes around values
   - No trailing slash in CORS_ORIGIN
   - JWT_SECRET should be a long random string

4. After adding, Railway will auto-redeploy

---

### ❌ Issue 3: Database Not Connected
**Symptom:** "Database connection failed" or "ECONNREFUSED"

**Fix:**
1. Make sure PostgreSQL database is **running** (not paused)
2. In your PostgreSQL service → **"Variables"** tab
3. Copy the `DATABASE_URL` value
4. In your backend service → **"Variables"** tab
5. Add/update `DATABASE_URL` with the copied value
6. Redeploy

---

### ❌ Issue 4: Build Command Issues
**Symptom:** Build fails or hangs

**Fix:**
1. Go to service → **"Settings"**
2. **Build Command:** Leave empty (Railway auto-detects)
3. **Start Command:** Should be `npm start`
4. Save and redeploy

---

### ❌ Issue 5: Port Configuration
**Symptom:** "Port already in use" or service won't start

**Fix:**
1. Railway automatically sets `PORT` environment variable
2. Your `server.js` already uses `process.env.PORT || 3001` ✅
3. **Don't** set a custom PORT variable
4. If you have one, delete it

---

## 🔍 How to Check What's Wrong

1. **Go to Railway Dashboard**
2. Click on your **backend service**
3. Click **"Deployments"** tab
4. Click on the **failed deployment** (red X)
5. Scroll down to see **logs**
6. **Copy the error message** - it will tell you exactly what's wrong

---

## ✅ Step-by-Step Verification

Run through this checklist:

- [ ] **Root Directory** = `backend` (in Settings)
- [ ] **PostgreSQL database** is running (not paused)
- [ ] **DATABASE_URL** is set (from PostgreSQL service)
- [ ] **JWT_SECRET** is set (long random string)
- [ ] **CORS_ORIGIN** = `https://scabadoobop.github.io` (no trailing slash)
- [ ] **NODE_ENV** = `production`
- [ ] **Start Command** = `npm start` (in Settings)
- [ ] **Build Command** = empty or `npm install` (in Settings)

---

## 🚀 After Fixing: Redeploy

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Or make a small change and push to GitHub:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin master
   ```

---

## 📋 Share This Info If Still Failing

If it's still not working, share:

1. **Error message** from deployment logs (last 10-20 lines)
2. **Screenshot** of your Variables tab
3. **Root Directory** setting (from Settings)
4. **Build/Start commands** (from Settings)

---

## 💡 Quick Test

To verify your setup is correct:

1. **Root Directory:** Should be `backend`
2. **Variables:** Should have at least:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `NODE_ENV`
3. **Database:** Should be running (green status)

---

## 🔄 Nuclear Option: Start Fresh

If nothing works:

1. Delete the current service in Railway
2. Create new service → Deploy from GitHub
3. **Important:** When selecting repo, make sure to set Root Directory to `backend` immediately
4. Add PostgreSQL database
5. Add environment variables
6. Deploy

---

**Most likely fix:** Root Directory not set to `backend`! Check that first! ⚠️

