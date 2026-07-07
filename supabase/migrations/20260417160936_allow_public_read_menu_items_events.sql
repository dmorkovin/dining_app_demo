/*
  # Allow public read access to menu_items and events

  1. Security Changes
    - Drop existing authenticated-only SELECT policies on menu_items and events
    - Add new SELECT policies that allow public (anon + authenticated) read access
    - These tables contain non-sensitive dining content meant to be viewable by all app users

  2. Notes
    - The app uses the anon key on the client; previous policies blocked reads
    - Stations already uses a public read policy which is why stations display correctly
*/

DROP POLICY IF EXISTS "Anyone can read menu items" ON menu_items;
DROP POLICY IF EXISTS "Anyone can read events" ON events;

CREATE POLICY "Public can read menu items"
  ON menu_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read events"
  ON events FOR SELECT
  TO public
  USING (true);
