# Royal Groceries - Deployment Guide

This guide will help you deploy the new secure Royal Groceries system to GitHub Pages.

## 🚀 Quick Deployment

### Option 1: Automatic Deployment (Recommended)

1. **Push your changes to GitHub:**
   ```bash
   git add .
   git commit -m "Add secure multi-tenant system"
   git push origin main
   ```

2. **Enable GitHub Actions:**
   - Go to your repository settings
   - Navigate to "Actions" → "General"
   - Enable "Allow all actions and reusable workflows"

3. **Set up environment variables (optional):**
   - Go to repository settings → "Secrets and variables" → "Actions"
   - Add `API_URL` secret with your backend URL (e.g., `https://your-backend.herokuapp.com/api`)

4. **The deployment will happen automatically!** 🎉

### Option 2: Manual Deployment

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

## 🔧 Backend Setup

### For Production Backend

You'll need to deploy the backend separately. Here are some options:

#### Option A: Heroku (Free tier available)
1. Create a new Heroku app
2. Add PostgreSQL addon
3. Deploy the backend folder
4. Set environment variables in Heroku dashboard

#### Option B: Railway (Free tier available)
1. Connect your GitHub repository
2. Select the backend folder
3. Add PostgreSQL database
4. Set environment variables

#### Option C: Vercel + PlanetScale
1. Deploy backend to Vercel
2. Create PlanetScale database
3. Connect and configure

### Environment Variables for Backend

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CORS_ORIGIN=https://yourusername.github.io/love-royal-groceries
```

## 🌐 Frontend Configuration

### For GitHub Pages

The frontend is already configured for GitHub Pages with the correct base path. No changes needed!

### For Custom Domain

If you have a custom domain:

1. Update `vite.config.ts`:
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/' : '/',
   ```

2. Add a `CNAME` file to the `public` folder with your domain

## 📱 Testing the Deployment

1. **Visit your GitHub Pages URL:**
   ```
   https://yourusername.github.io/love-royal-groceries
   ```

2. **Test the default household key:**
   - Use `ROYAL2024` as the household key
   - Create a test account
   - Verify all features work

## 🔐 Security Notes

- **Change the default household key** in production
- **Use strong JWT secrets** (32+ characters)
- **Enable HTTPS** for your backend
- **Set up proper CORS** for your domain
- **Use environment variables** for all secrets

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to validate key"**
   - Check if backend is running
   - Verify CORS settings
   - Check API URL configuration

2. **"Network error"**
   - Ensure backend is accessible
   - Check firewall settings
   - Verify HTTPS certificates

3. **"Database connection failed"**
   - Check PostgreSQL connection string
   - Ensure database exists
   - Verify credentials

### Debug Mode

To enable debug logging, add to your frontend `.env`:
```env
VITE_DEBUG=true
```

## 📊 Monitoring

### GitHub Pages
- Check deployment status in Actions tab
- View build logs for errors

### Backend
- Monitor logs in your hosting platform
- Set up health check endpoints
- Monitor database performance

## 🔄 Updates

To update the deployment:

1. **Make your changes**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **GitHub Actions will automatically redeploy!**

## 📞 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Verify all environment variables
3. Test locally first with `npm run dev`
4. Check browser console for errors

---

**Your Royal Groceries system is now live! 👑**

Visit: `https://yourusername.github.io/love-royal-groceries`
