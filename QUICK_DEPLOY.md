# 🚀 Quick Deployment Guide - Royal Groceries

This is your **step-by-step guide** to deploy your app so you can log in again. Follow these steps in order.

## 📋 Prerequisites

- GitHub account (you already have this)
- Node.js installed (check with `node --version`)
- Git installed (check with `git --version`)

---

## Part 1: Deploy Frontend (GitHub Pages) - 5 minutes

### Step 1: Build and Deploy Frontend

Open your terminal in the project folder and run:

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

**That's it!** Your frontend will be live at:
`https://scabadoobop.github.io/love-royal-groceries`

### Step 2: Enable GitHub Pages (if not already enabled)

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Source", select **gh-pages branch** and **/ (root)**
4. Click **Save**

---

## Part 2: Deploy Backend (Choose ONE option)

### Option A: Railway (Recommended - Easiest & Free)

**Why Railway?** Free tier, automatic deployments, easy database setup.

#### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (easiest)

#### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `love-royal-groceries` repository
4. Select the **`backend`** folder (not the root!)

#### Step 3: Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait for it to provision (takes ~30 seconds)

#### Step 4: Set Environment Variables
1. Click on your backend service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add these one by one:

```
DATABASE_URL = (Railway will auto-fill this from your PostgreSQL database - click "Add" when it appears)
JWT_SECRET = (generate a random string - use: https://randomkeygen.com/ and pick a "CodeIgniter Encryption Keys")
CORS_ORIGIN = https://scabadoobop.github.io
PORT = 3001
NODE_ENV = production
```

**Important:** Replace `scabadoobop` with your actual GitHub username!

#### Step 5: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Or click **"Deploy"** button in Railway dashboard
3. Wait for deployment to complete (~2 minutes)

#### Step 6: Get Your Backend URL
1. Once deployed, click on your backend service
2. Click **"Settings"** tab
3. Under **"Domains"**, click **"Generate Domain"**
4. Copy the URL (e.g., `https://your-app.up.railway.app`)

---

### Option B: Render (Alternative Free Option)

#### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

#### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Settings:
   - **Name:** royal-groceries-backend
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

#### Step 3: Add PostgreSQL Database
1. Click **"New +"** → **"PostgreSQL"**
2. Name it: `royal-groceries-db`
3. Select **Free** plan
4. Click **"Create Database"**

#### Step 4: Set Environment Variables
In your Web Service settings, add:

```
DATABASE_URL = (copy from your PostgreSQL database's "Internal Database URL")
JWT_SECRET = (generate random string from https://randomkeygen.com/)
CORS_ORIGIN = https://scabadoobop.github.io
PORT = 3001
NODE_ENV = production
```

#### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (~5 minutes)

---

## Part 3: Connect Frontend to Backend

### Step 1: Update Frontend Environment

1. Create a `.env` file in the **root** of your project (not in backend folder):

```env
VITE_API_URL=https://your-backend-url.com/api
```

**For Railway:** Use the domain you generated (e.g., `https://your-app.up.railway.app/api`)
**For Render:** Use your Render service URL (e.g., `https://royal-groceries-backend.onrender.com/api`)

### Step 2: Rebuild and Redeploy Frontend

```bash
npm run build
npm run deploy
```

---

## Part 4: Test Your Deployment

1. **Visit your frontend:** `https://scabadoobop.github.io/love-royal-groceries`
2. **Try to log in** with your existing account
3. **If login fails:** Check browser console (F12) for errors

---

## 🔧 Troubleshooting

### "Failed to connect to backend"
- Check that your backend URL in `.env` is correct
- Make sure backend is running (check Railway/Render dashboard)
- Verify CORS_ORIGIN matches your frontend URL exactly

### "Database connection failed"
- Check DATABASE_URL in backend environment variables
- Make sure PostgreSQL database is running
- Verify credentials are correct

### "Can't log in"
- Check browser console (F12) for errors
- Verify backend is accessible: visit `https://your-backend-url.com/health`
- Should return: `{"status":"OK"}`

---

## 🔄 Future Deployments (After Initial Setup)

Once everything is set up, deploying updates is super easy:

### Update Frontend:
```bash
npm run build
npm run deploy
```

### Update Backend:
Just push to GitHub! Railway/Render will auto-deploy:
```bash
git add .
git commit -m "Update feature"
git push origin master
```

---

## 📝 Quick Reference

**Frontend URL:** `https://scabadoobop.github.io/love-royal-groceries`
**Backend URL:** (Your Railway/Render URL)
**Default Household Key:** `ROYAL2024` (change this in production!)

---

## 🆘 Need Help?

1. Check deployment logs in Railway/Render dashboard
2. Check GitHub Actions logs (for frontend)
3. Check browser console (F12) for frontend errors
4. Check backend logs in Railway/Render dashboard

---

**You're all set! 🎉**

