-- Migration: Add frequency, assignedTo to quests, and member_points table
-- Run this to update existing schema

-- Add frequency and assigned_to columns to quests table
ALTER TABLE quests 
  ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'daily' 
    CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);

-- Update quest_completions to store points snapshot
ALTER TABLE quest_completions 
  ADD COLUMN IF NOT EXISTS points_awarded INTEGER;

-- Create member_points table for tracking point balances
CREATE TABLE IF NOT EXISTS member_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    household_id UUID REFERENCES households(id) NOT NULL,
    points_balance INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, household_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_member_points_user ON member_points(user_id);
CREATE INDEX IF NOT EXISTS idx_member_points_household ON member_points(household_id);

-- Initialize member_points for existing users
INSERT INTO member_points (user_id, household_id, points_balance)
SELECT u.id, u.household_id, 
       COALESCE((
         SELECT SUM(q.points)
         FROM quest_completions qc
         JOIN quests q ON qc.quest_id = q.id
         WHERE qc.user_id = u.id AND q.household_id = u.household_id
       ), 0) - COALESCE((
         SELECT SUM(points_spent)
         FROM point_redemptions
         WHERE user_id = u.id AND status != 'cancelled'
       ), 0) as balance
FROM users u
WHERE u.household_id IS NOT NULL
ON CONFLICT (user_id, household_id) DO NOTHING;

-- Update existing quest_completions with points_awarded
UPDATE quest_completions qc
SET points_awarded = q.points
FROM quests q
WHERE qc.quest_id = q.id AND qc.points_awarded IS NULL;

