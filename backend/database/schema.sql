-- This creates all necessary tables for the secure multi-tenant system

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Households table (replaces the simple household selection)
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    key_code VARCHAR(20) UNIQUE NOT NULL, -- The key users enter to join
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    admin_user_id UUID
);

-- Create a sentinel default household to satisfy foreign keys for default data
INSERT INTO households (id, name, key_code, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Public Default', 'DEFAULT-PLACEHOLDER', true)
ON CONFLICT (id) DO NOTHING;

-- Seed a default household with well-known key for first-run testing
INSERT INTO households (name, key_code)
VALUES ('Royal Household', 'ROYAL2024')
ON CONFLICT (key_code) DO NOTHING;

-- Users table (replaces local storage user management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    household_id UUID REFERENCES households(id),
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Grocery items (replaces local storage items)
CREATE TABLE IF NOT EXISTS grocery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(20) NOT NULL CHECK (location IN ('fridge', 'pantry')),
    quantity INTEGER DEFAULT 0,
    low_threshold INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes system (replaces local storage notes)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'personal', -- 'personal', 'family'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum/Thread system for household discussions
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES forum_categories(id) NOT NULL,
    household_id UUID REFERENCES households(id) NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES forum_threads(id) NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_household ON users(household_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_household ON grocery_items(household_id);
CREATE INDEX IF NOT EXISTS idx_notes_household ON notes(household_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_household ON forum_threads(household_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id);

-- Insert default forum categories
INSERT INTO forum_categories (household_id, name, description)
SELECT '00000000-0000-0000-0000-000000000000', 'Recipes', 'Share and discuss recipes with your household'
WHERE NOT EXISTS (
  SELECT 1 FROM forum_categories WHERE household_id = '00000000-0000-0000-0000-000000000000' AND name = 'Recipes'
);

INSERT INTO forum_categories (household_id, name, description)
SELECT '00000000-0000-0000-0000-000000000000', 'Cleaning Tips', 'Household cleaning and maintenance tips'
WHERE NOT EXISTS (
  SELECT 1 FROM forum_categories WHERE household_id = '00000000-0000-0000-0000-000000000000' AND name = 'Cleaning Tips'
);

INSERT INTO forum_categories (household_id, name, description)
SELECT '00000000-0000-0000-0000-000000000000', 'Storage Solutions', 'Organizing and storing groceries efficiently'
WHERE NOT EXISTS (
  SELECT 1 FROM forum_categories WHERE household_id = '00000000-0000-0000-0000-000000000000' AND name = 'Storage Solutions'
);

INSERT INTO forum_categories (household_id, name, description)
SELECT '00000000-0000-0000-0000-000000000000', 'General Discussion', 'General household discussions and announcements'
WHERE NOT EXISTS (
  SELECT 1 FROM forum_categories WHERE household_id = '00000000-0000-0000-0000-000000000000' AND name = 'General Discussion'
);
