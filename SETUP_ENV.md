# 🔧 Setup Frontend-Backend Connection

## Step 1: Get Your Railway Backend URL

1. Go to **Railway** → Your backend service
2. Click **Settings** tab
3. Scroll to **"Domains"** section
4. You should see a domain like: `https://royal-groceries-backend-xxxx.up.railway.app`
5. **Copy this URL** (without the `/api` part)

## Step 2: Create .env File

Create a file named `.env` in the **root** of your project (same folder as `package.json`) with:

```env
VITE_API_URL=https://your-railway-url.up.railway.app/api
```

Replace `your-railway-url` with your actual Railway URL.

## Step 3: Rebuild and Deploy

After creating the .env file, I'll rebuild and redeploy the frontend.

---

**Please share your Railway backend URL and I'll help you set it up!**


