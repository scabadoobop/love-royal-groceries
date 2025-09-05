# Royal Groceries Backend

Secure backend API for the Royal Groceries household management system.

## Features

- 🔐 **Secure Authentication**: JWT-based auth with bcrypt password hashing
- 🏠 **Multi-tenant Households**: Key-based household access control
- 🛒 **Grocery Management**: Track items, quantities, and low stock alerts
- 💬 **Real-time Forum**: Household discussions with WebSocket support
- 📧 **Email Recovery**: Password reset via email
- 🛡️ **Security**: Rate limiting, CORS, helmet protection
- 📊 **PostgreSQL**: Robust data persistence

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis (for real-time features)

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE royal_groceries;
   ```

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

See `env.example` for all required environment variables:

- **Database**: PostgreSQL connection string
- **JWT**: Secret key for token signing
- **Email**: SMTP configuration for password recovery
- **Redis**: For real-time chat features
- **Security**: Rate limiting and CORS settings

## API Endpoints

### Authentication
- `POST /api/auth/validate-key` - Validate household key
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/profile` - Get user profile

### Groceries
- `GET /api/groceries` - Get all grocery items
- `POST /api/groceries` - Add new item
- `PATCH /api/groceries/:id/quantity` - Update quantity
- `PUT /api/groceries/:id` - Update item
- `DELETE /api/groceries/:id` - Delete item
- `GET /api/groceries/search` - Search items
- `GET /api/groceries/low-stock` - Get low stock items

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Add new note
- `DELETE /api/notes/:id` - Delete note

### Household
- `GET /api/households/info` - Get household info
- `GET /api/households/members` - Get household members
- `POST /api/households/regenerate-key` - Regenerate household key (admin)
- `PUT /api/households/name` - Update household name (admin)

### Forum
- `GET /api/forum/categories` - Get forum categories
- `GET /api/forum/categories/:id/threads` - Get threads in category
- `POST /api/forum/threads` - Create new thread
- `GET /api/forum/threads/:id` - Get thread with posts
- `POST /api/forum/threads/:id/posts` - Add post to thread

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Prevent abuse and DDoS
- **CORS Protection**: Configured for frontend domain
- **Input Validation**: Express-validator for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Helmet**: Security headers

## Database Schema

The system uses PostgreSQL with the following main tables:

- `households` - Household information and keys
- `users` - User accounts and authentication
- `grocery_items` - Grocery inventory items
- `notes` - Personal and family notes
- `forum_categories` - Discussion categories
- `forum_threads` - Discussion threads
- `forum_posts` - Thread replies

## Real-time Features

WebSocket support for:
- Live forum discussions
- Real-time note updates
- Grocery inventory changes
- Typing indicators

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run database migrations
npm run migrate

# Lint code
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure email service
5. Set up Redis for real-time features
6. Use PM2 or similar for process management

## Default Household

For development, a default household is created with key: `ROYAL2024`

## License

Private - Royal Groceries Household System
