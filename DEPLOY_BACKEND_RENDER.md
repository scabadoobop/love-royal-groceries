# 🚀 Deploy Backend to Render (Easier Alternative)

If Railway isn't working, Render is often easier and more reliable for GitHub integration.

## Step-by-Step Guide

### Step 1: Create Render Account
1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (click "Continue with GitHub")
4. Authorize Render to access your repositories

### Step 2: Create PostgreSQL Database
1. In Render dashboard, click **"New +"** (top right)
2. Select **"PostgreSQL"**
3. Fill in:
   - **Name:** `royal-groceries-db`
   - **Database:** `royal_groceries` (optional, can use default)
   - **User:** (auto-generated, or choose your own)
   - **Region:** Choose closest to you
   - **PostgreSQL Version:** 15 (or latest)
   - **Plan:** **Free** (for testing)
4. Click **"Create Database"**
5. **Wait 2-3 minutes** for database to provision

### Step 3: Get Database Connection String
1. Once database is ready, click on it
2. Go to **"Connections"** tab
3. Copy the **"Internal Database URL"** (looks like: `postgresql://user:password@hostname:5432/dbname`)
4. **Save this somewhere** - you'll need it in Step 5

### Step 4: Create Web Service (Backend)
1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select repository: **`love-royal-groceries`**
5. Fill in settings:
   - **Name:** `royal-groceries-backend`
   - **Region:** Same as database
   - **Branch:** `master`
   - **Root Directory:** `backend` ⚠️ **IMPORTANT!**
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** **Free** (for testing)

### Step 5: Set Environment Variables
Before clicking "Create Web Service", scroll down to **"Environment Variables"** and add:

1. Click **"Add Environment Variable"** for each:

   **Variable:** `DATABASE_URL`  
   **Value:** (paste the Internal Database URL from Step 3)

   **Variable:** `JWT_SECRET`  
   **Value:** (generate at https://randomkeygen.com/ - use "CodeIgniter Encryption Keys")

   **Variable:** `CORS_ORIGIN`  
   **Value:** `https://scabadoobop.github.io`

   **Variable:** `PORT`  
   **Value:** `3001`

   **Variable:** `NODE_ENV`  
   **Value:** `production`

2. Click **"Create Web Service"**

### Step 6: Wait for Deployment
- Render will start building and deploying
- This takes **3-5 minutes** the first time
- Watch the logs - you'll see it installing dependencies and starting

### Step 7: Get Your Backend URL
1. Once deployment is complete (status shows "Live")
2. Your backend URL will be: `https://royal-groceries-backend.onrender.com`
3. **Test it:** Visit `https://royal-groceries-backend.onrender.com/health`
4. Should return: `{"status":"OK","timestamp":"..."}`

### Step 8: Connect Frontend to Backend
1. Create `.env` file in project root:
   ```env
   VITE_API_URL=https://royal-groceries-backend.onrender.com/api
   ```

2. Rebuild and redeploy frontend:
   ```bash
   npm run build
   npm run deploy
   ```

## ✅ You're Done!

Your backend should now be live and connected to your frontend!

**Backend URL:** `https://royal-groceries-backend.onrender.com`  
**Frontend URL:** `https://scabadoobop.github.io/love-royal-groceries`

---

## 🔧 Troubleshooting

### "Build failed"
- Check that **Root Directory** is set to `backend` (not root!)
- Check build logs in Render dashboard

### "Database connection failed"
- Verify `DATABASE_URL` is correct (use Internal Database URL)
- Make sure database is fully provisioned (wait a few minutes)

### "Service won't start"
- Check logs in Render dashboard
- Make sure `PORT` environment variable is set
- Verify `npm start` works locally

### "CORS error"
- Make sure `CORS_ORIGIN` matches your frontend URL exactly
- No trailing slash: `https://scabadoobop.github.io` (not `https://scabadoobop.github.io/`)

---

## 💡 Tips

- **Free tier:** Services sleep after 15 minutes of inactivity (first request will be slow)
- **Upgrade:** If you need always-on service, upgrade to paid plan ($7/month)
- **Logs:** Always check Render logs if something isn't working
- **Database:** Free tier database is deleted after 90 days of inactivity

---

**Need help?** Check the logs in Render dashboard - they're very detailed!

