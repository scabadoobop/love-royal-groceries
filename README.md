# 👑 Royal Pantry & Fridge

A secure, multi-tenant household grocery management system with real-time collaboration features.

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with household key access
- 🛒 **Grocery Management** - Track items, quantities, and low stock alerts
- 💬 **Real-time Forum** - Household discussions about recipes and tips
- 📝 **Smart Notes** - Personal and family notes system
- 👥 **Multi-tenant** - Secure household isolation
- 📱 **Mobile-friendly** - Works on all devices
- 🔄 **Real-time Updates** - Live collaboration via WebSocket
- 📧 **Email Recovery** - Secure password reset system

## 🚀 Live Demo

**Frontend:** [View on GitHub Pages](https://yourusername.github.io/love-royal-groceries)

**Default Household Key:** `ROYAL2024` (for testing)

## 🏗️ Architecture

### Frontend (This Repository)
- **React 19** with TypeScript
- **Vite** for fast development and building
- **PWA** support for mobile installation
- **GitHub Pages** deployment ready

### Backend (Separate Repository)
- **Node.js/Express** API server
- **PostgreSQL** database
- **JWT Authentication** with bcrypt
- **WebSocket** for real-time features
- **Email** system for password recovery

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (for backend)
- Git

### Frontend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/love-royal-groceries.git
   cd love-royal-groceries
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:5173
   ```

### Backend Setup

See the [Backend README](backend/README.md) for detailed setup instructions.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api
# For production: https://your-backend-domain.com/api
```

### Backend Configuration

See `backend/env.example` for all required backend environment variables.

## 📱 Usage

1. **Get a household key** from your family admin
2. **Visit the app** and enter the household key
3. **Create your account** with username and password
4. **Start managing groceries** and collaborating with your family!

## 🛡️ Security Features

- **Household Keys** - Admin-generated keys for secure access
- **Password Security** - bcrypt hashing with 12 rounds
- **JWT Tokens** - Secure authentication
- **Rate Limiting** - Prevents abuse
- **Data Isolation** - Each household's data is completely separate
- **HTTPS Ready** - Secure communication
- **Input Validation** - Prevents injection attacks

## 🚀 Deployment

### GitHub Pages (Frontend)

The app is configured for automatic deployment to GitHub Pages:

1. **Push to main branch** - GitHub Actions will automatically deploy
2. **Manual deployment:**
   ```bash
   npm run deploy
   ```

### Backend Deployment

Deploy the backend to your preferred platform:
- **Heroku** (free tier available)
- **Railway** (free tier available)
- **Vercel** + PlanetScale
- **DigitalOcean** App Platform

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🏠 Household Management

### Admin Features
- Generate household keys
- Manage household members
- Update household settings
- View member activity

### Member Features
- Access grocery inventory
- Add/edit/delete items
- Participate in forum discussions
- Leave notes for family

## 💬 Forum Categories

- **🍳 Recipes** - Share and discuss recipes
- **🧽 Cleaning Tips** - Household maintenance
- **📦 Storage Solutions** - Organization tips
- **💬 General Discussion** - Family announcements

## 🔄 Real-time Features

- **Live grocery updates** - See changes instantly
- **Forum discussions** - Real-time chat
- **Typing indicators** - Know when someone is typing
- **Note notifications** - Get notified of new notes

## 📊 Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- CSS3 (Custom styling)
- PWA (Progressive Web App)

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- WebSocket (Socket.io)
- Nodemailer

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Private - Royal Groceries Household System

## 🆘 Support

If you encounter any issues:

1. Check the [Deployment Guide](DEPLOYMENT.md)
2. Review the [Backend Documentation](backend/README.md)
3. Check browser console for errors
4. Verify backend is running and accessible

---

**Made with ❤ for the royal household** 👑
