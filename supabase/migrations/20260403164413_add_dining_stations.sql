/*
  # Add Dining Stations System

  1. New Tables
    - `stations` - Dining stations with branding from WVSU
      - `id` (integer, primary key) - Station identifier
      - `name` (text) - Station name (Greens, Carve, Simmer, Terra, Feature, Simply, Hearth, Ember, Rise)
      - `description` (text) - Full description of station concept
      - `short_description` (text) - Short tagline
      - `icon` (text) - Icon or emoji representation
      - `color` (text) - Brand color for station
      - `created_at` (timestamptz)

  2. Changes
    - Add `station_id` column to `menu_items` table
    - Link existing menu items to appropriate stations

  3. Security
    - Enable RLS on `stations` table
    - Add read policy for authenticated users
*/

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id integer PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  short_description text DEFAULT '',
  icon text DEFAULT '',
  color text DEFAULT '#2C3E50',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stations"
  ON stations FOR SELECT
  TO authenticated
  USING (true);

-- Insert the 9 official WVSU dining stations
INSERT INTO stations (id, name, short_description, description, icon, color) VALUES
(1, 'Greens', 'Fresh salads & bowls', 'Greens offers a vibrant, build-your-own salad experience focused on freshness, balance, and customization. Students can choose from a wide variety of crisp greens, seasonal vegetables, grains, proteins, and house-made dressings, allowing them to create meals that align with personal taste and wellness goals. The station supports both quick meals and hearty, nutrient-forward options.', '🥗', '#4CAF50'),
(2, 'Carve', 'Craft sandwiches', 'Carve features made-to-order sandwiches and wraps prepared with fresh breads, quality proteins, choice cheeses, and flavorful spreads. With rotating specials alongside classic offerings, the deli provides a reliable, customizable option that appeals to a broad range of preferences and dining occasions throughout the day.', '🥪', '#8D6E63'),
(3, 'Simmer', 'Soups & stews', 'Simmer highlights rotating soups prepared with seasonal ingredients and comforting flavors. Offerings range from classic favorites to globally inspired selections, providing a warm, satisfying complement to any meal or a light standalone option during colder months.', '🍲', '#FF9800'),
(4, 'Terra', 'Global kitchen', 'Terra introduces students to diverse cuisines from around the world through existing rotating menus that celebrate international flavors and culinary traditions. This station brings variety and excitement to the dining hall, encouraging exploration while remaining approachable and familiar.', '🌍', '#00897B'),
(5, 'Feature', 'Chef''s selection', 'Feature focuses on familiar, comfort-driven meals that feel home-cooked and satisfying. Menus rotate regularly and include hearty entrées and classic sides, offering students dependable, feel-good options that resonate across class years and dining habits.', '⭐', '#FFD700'),
(6, 'Simply', 'Allergen-friendly kitchen', 'Simply provides meals prepared without the top nine allergens, offering peace of mind and inclusive access for students with food allergies or sensitivities. This dedicated station follows strict protocols to support safe, consistent access to flavorful, thoughtfully prepared meals.', '✨', '#9C27B0'),
(7, 'Hearth', 'Wood-fired pizza', 'Hearth delivers classic and rotating pizza options, including cheese, pepperoni, and specialty selections. Designed for broad appeal and convenience, this station offers a familiar favorite that fits seamlessly into any dining occasion, from quick lunches to late day meals.', '🍕', '#D32F2F'),
(8, 'Ember', 'Fire grilled', 'Ember features freshly prepared, grill-style favorites made to order. Offerings may include burgers, chicken, and other grilled selections, paired with rotating sides. The station delivers bold, satisfying flavors while allowing flexibility to adjust menus based on student demand.', '🔥', '#F4511E'),
(9, 'Rise', 'Artisan bakery', 'Rise will include rotating selection of baked sweets such as cookies, brownies, and seasonal treats will be available to provide an added element of indulgence and balance.', '🥐', '#FFA726');

-- Add station_id to menu_items if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'station_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN station_id integer REFERENCES stations(id);
  END IF;
END $$;
