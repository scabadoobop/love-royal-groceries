# 🔧 Railway Deployment Troubleshooting

If your Railway deployment keeps failing, check these common issues:

## ✅ Step 1: Check Railway Settings

### Root Directory
**CRITICAL:** Make sure Root Directory is set to `backend` (not root!)

1. Go to your service in Railway
2. Click **"Settings"** tab
3. Scroll to **"Root Directory"**
4. Should be: `backend`
5. If wrong, change it and redeploy

### Build & Start Commands
Railway should auto-detect these, but verify:
- **Build Command:** (leave empty or `npm install`)
- **Start Command:** `npm start`

---

## ✅ Step 2: Check Environment Variables

Go to your service → **"Variables"** tab. You MUST have:

### Required Variables:

1. **DATABASE_URL**
   - Should be auto-filled from your PostgreSQL database
   - Format: `postgresql://user:password@host:port/dbname`
   - If missing, click your PostgreSQL service → **"Variables"** → copy `DATABASE_URL`

2. **JWT_SECRET**
   - Generate at: https://randomkeygen.com/
   - Use "CodeIgniter Encryption Keys" (long random string)
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

3. **CORS_ORIGIN**
   - Must be: `https://scabadoobop.github.io`
   - No trailing slash!

4. **PORT**
   - Railway sets this automatically, but you can add: `3001`
   - Usually not needed - Railway provides `PORT` env var

5. **NODE_ENV**
   - Set to: `production`

### Optional (but recommended):

6. **REDIS_URL** (if using Redis)
   - Only needed if you want chat/real-time features
   - Can be omitted for basic functionality

---

## ✅ Step 3: Check Deployment Logs

1. Go to your service in Railway
2. Click **"Deployments"** tab
3. Click on the **failed deployment**
4. Check the **logs** - they'll show the exact error

### Common Error Messages:

#### "Cannot find module"
- **Fix:** Make sure Root Directory is `backend`
- **Fix:** Check that `package.json` exists in `backend` folder

#### "Database connection failed"
- **Fix:** Verify `DATABASE_URL` is set correctly
- **Fix:** Make sure PostgreSQL database is running
- **Fix:** Check that database is in same project

#### "Port already in use" or "EADDRINUSE"
- **Fix:** Remove `PORT` variable (Railway sets it automatically)
- **Fix:** Or change server.js to use `process.env.PORT` (it already does)

#### "Module not found" or "Missing dependency"
- **Fix:** Check that all dependencies are in `backend/package.json`
- **Fix:** Railway should run `npm install` automatically

#### "Redis connection failed"
- **Fix:** Either add Redis service, or make Redis optional (see below)

---

## ✅ Step 4: Make Redis Optional (If Needed)

If Redis is causing issues, we can make it optional. The app will work without real-time chat features.

Let me know if you see Redis errors in the logs, and I'll help you make it optional.

---

## ✅ Step 5: Verify Database Connection

1. Make sure PostgreSQL database is **running** (not paused)
2. Check that `DATABASE_URL` is correct:
   - Should start with `postgresql://`
   - Should include username, password, host, port, database name
3. Test connection:
   - Railway provides a database URL that works automatically
   - Make sure you're using the one from Railway (not a custom one)

---

## ✅ Step 6: Check Build Process

Railway should:
1. Install dependencies (`npm install`)
2. Start the server (`npm start`)

If build fails:
- Check that `backend/package.json` has `"start": "node server.js"`
- Verify all dependencies are listed in `package.json`

---

## 🚨 Quick Fix Checklist

Before asking for help, verify:

- [ ] Root Directory = `backend`
- [ ] DATABASE_URL is set (from PostgreSQL service)
- [ ] JWT_SECRET is set (random string)
- [ ] CORS_ORIGIN = `https://scabadoobop.github.io` (no trailing slash)
- [ ] NODE_ENV = `production`
- [ ] PostgreSQL database is running
- [ ] Checked deployment logs for specific error

---

## 📋 What to Share for Help

If still failing, share:
1. **Error message** from deployment logs (copy/paste)
2. **Screenshot** of your Variables tab
3. **Root Directory** setting
4. **Last 20 lines** of deployment logs

---

## 🔄 Try Redeploying

After fixing issues:
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger redeploy

---

## 💡 Alternative: Use Render

If Railway keeps failing, Render is often more reliable:
- See `DEPLOY_BACKEND_RENDER.md` for step-by-step guide
- Render has better error messages
- Free tier is similar

---

**Most common fix:** Root Directory not set to `backend`! ⚠️


