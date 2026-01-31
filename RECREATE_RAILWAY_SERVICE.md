# 🔄 How to Recreate Railway Service with Root Directory

## Step-by-Step Guide

### Step 1: Save Your Current Settings
**Before deleting anything, write down:**

1. Go to your backend service → **Variables** tab
2. Copy these values (or take screenshots):
   - `DATABASE_URL` (from your PostgreSQL)
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `NODE_ENV`
   - Any other variables you added

3. **IMPORTANT:** Don't delete your PostgreSQL database! Only delete the backend service.

---

### Step 2: Delete the Backend Service
1. In Railway, go to your **backend service**
2. Click **Settings** tab
3. Scroll to the very bottom
4. Look for **"Delete Service"** or **"Remove"** button (usually red)
5. Click it and confirm deletion
6. **DO NOT** delete the PostgreSQL database!

---

### Step 3: Create New Service
1. In your Railway project dashboard, click **"+ New"** (top right)
2. Select **"GitHub Repo"** or **"Deploy from GitHub repo"**
3. Select your repository: `scabadoobop/love-royal-groceries`
4. **IMPORTANT:** After selecting the repo, Railway will show configuration options
5. Look for **"Root Directory"** or **"Working Directory"** field
6. **Type:** `backend` (just the word, no quotes)
7. Click **"Deploy"** or **"Create"**

---

### Step 4: Add Environment Variables
1. Once the service is created, go to **Variables** tab
2. Click **"+ New Variable"** for each:

   ```
   DATABASE_URL = (paste from your PostgreSQL database)
   JWT_SECRET = (your JWT secret)
   CORS_ORIGIN = https://scabadoobop.github.io
   NODE_ENV = production
   ```

3. Railway should auto-deploy after adding variables

---

### Step 5: Verify Deployment
1. Go to **Deployments** tab
2. Watch the build - it should succeed now!
3. Once deployed, get your service URL from **Settings** → **Domains**

---

## ✅ That's It!

Your service should now deploy successfully because Railway knows to look in the `backend` folder!


