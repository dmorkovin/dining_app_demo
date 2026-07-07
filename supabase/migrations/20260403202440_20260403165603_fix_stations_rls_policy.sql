/*
  # Fix Stations RLS Policy

  1. Changes
    - Drop existing authenticated-only policy
    - Create new public read policy to match other tables

  2. Security
    - Allow public read access to stations (same as menu_items, staff, events, etc.)
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can read stations" ON stations;

-- Create new public policy
CREATE POLICY "Public can read stations"
  ON stations
  FOR SELECT
  TO public
  USING (true);