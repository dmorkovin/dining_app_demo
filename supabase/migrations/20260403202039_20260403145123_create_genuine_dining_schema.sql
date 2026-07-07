/*
  # Create Genuine Dining Database Schema

  ## Overview
  Complete database schema for the Genuine Dining student engagement application,
  including user management, menu items, voting system, rewards program, staff
  interactions, events, and notifications.

  ## New Tables

  ### Core User Management
  1. `users` - Student user profiles with meal plans and dietary preferences
     - `id` (uuid, primary key) - Unique user identifier
     - `name` (text) - Full name
     - `email` (text, unique) - Email address
     - `student_id` (text, unique) - Student ID number
     - `points` (integer) - Reward points balance
     - `tier` (text) - Reward tier (Gold, Platinum, etc.)
     - `meals_count` (integer) - Total meals consumed
     - `meal_plan_type` (text) - Type of meal plan
     - `guest_swipes` (integer) - Remaining guest swipes
     - `flex_dollars` (numeric) - Flex dollar balance
     - `dietary_alerts` (text[]) - Array of allergen alerts
     - `dietary_preference` (text) - Dietary preference
     - `profile_image_url` (text) - Profile photo URL
     - `created_at` (timestamptz) - Account creation date
     - `updated_at` (timestamptz) - Last update timestamp

  ### Menu System
  2. `menu_items` - Available menu items with nutrition info
     - `id` (uuid, primary key)
     - `name` (text) - Item name
     - `description` (text) - Item description
     - `category` (text) - Category (Entrée, Bowl, Side, Beverage)
     - `calories` (integer) - Calorie count
     - `protein` (integer) - Protein in grams
     - `carbs` (integer) - Carbohydrates in grams
     - `fat` (integer) - Fat in grams
     - `tags` (text[]) - Tags (V, GF, DF)
     - `allergens` (text[]) - Allergen information
     - `image_url` (text) - Food image URL
     - `trending` (boolean) - Featured as trending
     - `sold_count` (integer) - Total sales count
     - `created_at` (timestamptz)

  3. `user_swipes` - Track user likes/passes on menu items
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to users)
     - `menu_item_id` (uuid, foreign key to menu_items)
     - `action` (text) - 'liked' or 'passed'
     - `created_at` (timestamptz)

  ### Voting System
  4. `polls` - Weekly voting polls
     - `id` (uuid, primary key)
     - `question` (text) - Poll question
     - `active` (boolean) - Currently active
     - `created_at` (timestamptz)

  5. `poll_options` - Options for each poll
     - `id` (uuid, primary key)
     - `poll_id` (uuid, foreign key to polls)
     - `text` (text) - Option text
     - `vote_count` (integer) - Number of votes
     - `created_at` (timestamptz)

  6. `user_votes` - Track user votes
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to users)
     - `poll_id` (uuid, foreign key to polls)
     - `option_id` (uuid, foreign key to poll_options)
     - `created_at` (timestamptz)

  7. `theme_proposals` - User-submitted theme ideas
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to users)
     - `text` (text) - Theme proposal text
     - `vote_count` (integer) - Upvote count
     - `author_name` (text) - Name of proposer
     - `created_at` (timestamptz)

  8. `theme_upvotes` - Track theme proposal upvotes
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to users)
     - `theme_id` (uuid, foreign key to theme_proposals)
     - `created_at` (timestamptz)

  ### Rewards System
  9. `rewards` - Available rewards for redemption
     - `id` (uuid, primary key)
     - `name` (text) - Reward name
     - `description` (text) - Reward description
     - `point_cost` (integer) - Points required
     - `icon` (text) - Icon identifier
     - `created_at` (timestamptz)

  10. `rewards_transactions` - Points history
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `points` (integer) - Points earned/spent
      - `description` (text) - Transaction description
      - `type` (text) - 'earned' or 'spent'
      - `icon` (text) - Icon for activity type
      - `created_at` (timestamptz)

  ### Staff & Events
  11. `staff` - Dining staff members
      - `id` (uuid, primary key)
      - `name` (text) - Staff name
      - `role` (text) - Job role
      - `bio` (text) - Biography
      - `image_url` (text) - Profile photo URL
      - `smile_count` (integer) - Total smiles received
      - `created_at` (timestamptz)

  12. `smiles_sent` - Staff appreciation messages
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `staff_id` (uuid, foreign key to staff)
      - `message` (text) - Appreciation message
      - `created_at` (timestamptz)

  13. `events` - Upcoming dining events
      - `id` (uuid, primary key)
      - `name` (text) - Event name
      - `date` (text) - Event date
      - `time` (text) - Event time
      - `description` (text) - Event description
      - `image_url` (text) - Event image URL
      - `attendee_count` (integer) - RSVP count
      - `created_at` (timestamptz)

  14. `event_rsvps` - Event RSVP tracking
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `event_id` (uuid, foreign key to events)
      - `created_at` (timestamptz)

  ### Weekly Menus
  15. `weekly_menus` - 5-day menu calendar
      - `id` (uuid, primary key)
      - `day_name` (text) - Day of week
      - `day_number` (integer) - Day number
      - `main_dish` (text) - Main dish name
      - `side_dish` (text) - Side dish name
      - `is_today` (boolean) - Highlighted as today
      - `items` (jsonb) - Full menu items array
      - `created_at` (timestamptz)

  ### Communication
  16. `notifications` - User notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `from_name` (text) - Sender name
      - `message` (text) - Notification message
      - `icon` (text) - Icon identifier
      - `unread` (boolean) - Read status
      - `created_at` (timestamptz)

  17. `videos` - Nutrition educational videos
      - `id` (uuid, primary key)
      - `title` (text) - Video title
      - `category` (text) - Category (Ingredients, Performance, Wellness)
      - `duration` (text) - Video duration
      - `thumbnail_url` (text) - Thumbnail image URL
      - `created_at` (timestamptz)

  18. `limited_time_offers` - Special promotional items
      - `id` (uuid, primary key)
      - `menu_item_id` (uuid, foreign key to menu_items)
      - `days_remaining` (integer) - Countdown days
      - `vote_count` (integer) - Vote count
      - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Authenticated users can read all public data
  - Users can only modify their own data
  - Vote and RSVP systems enforce one-per-user rules
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  student_id text UNIQUE NOT NULL,
  points integer DEFAULT 0,
  tier text DEFAULT 'Gold',
  meals_count integer DEFAULT 0,
  meal_plan_type text DEFAULT 'Unlimited',
  guest_swipes integer DEFAULT 5,
  flex_dollars numeric DEFAULT 0,
  dietary_alerts text[] DEFAULT ARRAY[]::text[],
  dietary_preference text DEFAULT '',
  profile_image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all user profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  calories integer DEFAULT 0,
  protein integer DEFAULT 0,
  carbs integer DEFAULT 0,
  fat integer DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  allergens text[] DEFAULT ARRAY[]::text[],
  image_url text DEFAULT '',
  trending boolean DEFAULT false,
  sold_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

-- Create user_swipes table
CREATE TABLE IF NOT EXISTS user_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  menu_item_id uuid REFERENCES menu_items(id) NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own swipes"
  ON user_swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipes"
  ON user_swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read polls"
  ON polls FOR SELECT
  TO authenticated
  USING (true);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) NOT NULL,
  text text NOT NULL,
  vote_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read poll options"
  ON poll_options FOR SELECT
  TO authenticated
  USING (true);

-- Create user_votes table
CREATE TABLE IF NOT EXISTS user_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  poll_id uuid REFERENCES polls(id) NOT NULL,
  option_id uuid REFERENCES poll_options(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, poll_id)
);

ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own votes"
  ON user_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own votes"
  ON user_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create theme_proposals table
CREATE TABLE IF NOT EXISTS theme_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  text text NOT NULL,
  vote_count integer DEFAULT 0,
  author_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE theme_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read theme proposals"
  ON theme_proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own proposals"
  ON theme_proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create theme_upvotes table
CREATE TABLE IF NOT EXISTS theme_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  theme_id uuid REFERENCES theme_proposals(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, theme_id)
);

ALTER TABLE theme_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read theme upvotes"
  ON theme_upvotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own upvotes"
  ON theme_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  point_cost integer NOT NULL,
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (true);

-- Create rewards_transactions table
CREATE TABLE IF NOT EXISTS rewards_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  points integer NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewards_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON rewards_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON rewards_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text DEFAULT '',
  image_url text DEFAULT '',
  smile_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read staff"
  ON staff FOR SELECT
  TO authenticated
  USING (true);

-- Create smiles_sent table
CREATE TABLE IF NOT EXISTS smiles_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  staff_id uuid REFERENCES staff(id) NOT NULL,
  message text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE smiles_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own smiles"
  ON smiles_sent FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smiles"
  ON smiles_sent FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  attendee_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  event_id uuid REFERENCES events(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own RSVPs"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own RSVPs"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create weekly_menus table
CREATE TABLE IF NOT EXISTS weekly_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_name text NOT NULL,
  day_number integer NOT NULL,
  main_dish text DEFAULT '',
  side_dish text DEFAULT '',
  is_today boolean DEFAULT false,
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly menus"
  ON weekly_menus FOR SELECT
  TO authenticated
  USING (true);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  from_name text NOT NULL,
  message text NOT NULL,
  icon text DEFAULT '',
  unread boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  duration text DEFAULT '',
  thumbnail_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read videos"
  ON videos FOR SELECT
  TO authenticated
  USING (true);

-- Create limited_time_offers table
CREATE TABLE IF NOT EXISTS limited_time_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) NOT NULL,
  days_remaining integer NOT NULL,
  vote_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE limited_time_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read limited time offers"
  ON limited_time_offers FOR SELECT
  TO authenticated
  USING (true);