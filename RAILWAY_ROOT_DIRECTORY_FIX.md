# 🔧 Railway: Setting Root Directory When You Don't See the Option

If you don't see "Root Directory" in Settings, here are alternative solutions:

## Option 1: Check Service Creation Settings

The Root Directory might have been set when you created the service. Let's check:

1. In Railway, go to your **service**
2. Look for **"Source"** or **"Repository"** section in Settings
3. You might see the repository path - check if there's a way to edit it there
4. Or look for **"Configure"** or **"Edit"** button near the repository info

---

## Option 2: Use railway.json (Already Created!)

I've already created a `railway.json` file in your backend folder. This should help Railway detect the correct directory.

**Next steps:**

1. Make sure the `backend/railway.json` file is committed to git
2. Push it to GitHub (this will trigger a new deployment)
3. Railway should auto-detect the backend folder

---

## Option 3: Delete and Recreate Service (Recommended)

If Root Directory option isn't available, the easiest fix is to recreate the service with the correct settings:

### Step 1: Note Your Current Settings
Before deleting, write down:
- Your environment variables (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, etc.)
- Your PostgreSQL database connection (don't delete the database!)

### Step 2: Delete the Service
1. In Railway, go to your service
2. Click **Settings** (or gear icon)
3. Scroll to bottom
4. Click **"Delete Service"** or **"Remove"**
5. **IMPORTANT:** Don't delete the PostgreSQL database!

### Step 3: Create New Service
1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** or **"Deploy from GitHub repo"**
3. Select your repository: `love-royal-groceries`
4. **IMPORTANT:** When it asks for settings, look for:
   - **"Root Directory"** or **"Working Directory"**
   - Set it to: `backend`
5. If you don't see that option during creation, continue anyway

### Step 4: Connect to Existing Database
1. In your new service, go to **Variables**
2. Add `DATABASE_URL` from your existing PostgreSQL database
3. Add all other environment variables

### Step 5: Deploy
Railway should auto-deploy, or click **"Deploy"**

---

## Option 4: Use Railway CLI (Advanced)

If the web UI doesn't have the option, you can use Railway CLI:

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   cd backend
   railway link
   ```

4. Set root directory:
   ```bash
   railway variables set RAILWAY_SOURCE_DIR=backend
   ```

---

## Option 5: Check "Custom Start Commands" Section

Since you see "Custom Start Commands", let's check if Root Directory is nearby:

1. In the same Settings page where you see "Custom Start Commands"
2. Look **above** or **below** that section
3. Look for:
   - "Working Directory"
   - "Source Directory"
   - "Base Directory"
   - "Project Root"
   - Or any field that says "Directory"

4. Also check if there's a **"Advanced"** or **"More Options"** section
5. Or look for a **"Configure"** button that expands more options

---

## Option 6: Use nixpacks.toml (Alternative Config)

Create a `nixpacks.toml` file in the backend folder to specify the directory:

```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "npm-9_x"]

[phases.install]
cmds = ["npm install"]

[start]
cmd = "npm start"
```

But this might not solve the root directory issue directly.

---

## ✅ Recommended: Try Option 3 (Recreate Service)

The easiest and most reliable solution is to **recreate the service** and set Root Directory during creation. Railway's UI sometimes hides this option after creation.

**Before you delete:**
- ✅ Write down all your environment variables
- ✅ Note your PostgreSQL database URL
- ✅ Don't delete the database!

**Then:**
- Create new service
- Set Root Directory to `backend` during creation
- Re-add environment variables
- Deploy

---

## 🆘 What to Do Right Now

1. **Check if you can see the repository path** in Settings - is there an "Edit" button?
2. **Look for any "Directory" field** near "Custom Start Commands"
3. **Or tell me what options you see** in the Settings page, and I'll guide you to the right one!

---

**Most reliable fix:** Recreate the service with Root Directory set to `backend` from the start.

