/*
  # Make All Tables Publicly Readable

  ## Overview
  Updates all RLS policies to allow public read access since the app doesn't use authentication.

  ## Changes
  - Drop all existing authenticated-only policies
  - Create new public read policies for all tables
*/

-- Menu Items
DROP POLICY IF EXISTS "Anyone can read menu items" ON menu_items;
CREATE POLICY "Public can read menu items"
  ON menu_items FOR SELECT
  TO public
  USING (true);

-- Limited Time Offers
DROP POLICY IF EXISTS "Anyone can read limited time offers" ON limited_time_offers;
CREATE POLICY "Public can read limited time offers"
  ON limited_time_offers FOR SELECT
  TO public
  USING (true);

-- Polls
DROP POLICY IF EXISTS "Anyone can read polls" ON polls;
CREATE POLICY "Public can read polls"
  ON polls FOR SELECT
  TO public
  USING (true);

-- Poll Options
DROP POLICY IF EXISTS "Anyone can read poll options" ON poll_options;
CREATE POLICY "Public can read poll options"
  ON poll_options FOR SELECT
  TO public
  USING (true);

-- Theme Proposals
DROP POLICY IF EXISTS "Anyone can read theme proposals" ON theme_proposals;
CREATE POLICY "Public can read theme proposals"
  ON theme_proposals FOR SELECT
  TO public
  USING (true);

-- Rewards
DROP POLICY IF EXISTS "Anyone can read rewards" ON rewards;
CREATE POLICY "Public can read rewards"
  ON rewards FOR SELECT
  TO public
  USING (true);

-- Staff
DROP POLICY IF EXISTS "Anyone can read staff" ON staff;
CREATE POLICY "Public can read staff"
  ON staff FOR SELECT
  TO public
  USING (true);

-- Events
DROP POLICY IF EXISTS "Anyone can read events" ON events;
CREATE POLICY "Public can read events"
  ON events FOR SELECT
  TO public
  USING (true);

-- Weekly Menus
DROP POLICY IF EXISTS "Anyone can read weekly menus" ON weekly_menus;
CREATE POLICY "Public can read weekly menus"
  ON weekly_menus FOR SELECT
  TO public
  USING (true);

-- Videos
DROP POLICY IF EXISTS "Anyone can read videos" ON videos;
CREATE POLICY "Public can read videos"
  ON videos FOR SELECT
  TO public
  USING (true);

-- Users (for profile viewing)
DROP POLICY IF EXISTS "Users can read all user profiles" ON users;
CREATE POLICY "Public can read user profiles"
  ON users FOR SELECT
  TO public
  USING (true);