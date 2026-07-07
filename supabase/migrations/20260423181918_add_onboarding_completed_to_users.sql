/*
  # Add onboarding_completed to users table

  1. Modified Tables
    - `users`
      - `onboarding_completed` (boolean, default false) — tracks whether user has finished the onboarding flow

  2. Notes
    - Existing users get default false, so they will be shown onboarding once on next login
    - No data loss; purely additive column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false NOT NULL;
  END IF;
END $$;
