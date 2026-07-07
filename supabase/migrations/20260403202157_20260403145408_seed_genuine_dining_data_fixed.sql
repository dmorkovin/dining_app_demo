/*
  # Seed Genuine Dining Sample Data

  ## Overview
  Populates the database with sample data for development and demonstration purposes.
  
  ## Data Seeded
  1. Sample User - Sofia Martinez with complete profile
  2. 8 Menu Items - Diverse selection with nutritional info and images
  3. 3 Limited-Time Offers - Special promotional items
  4. 1 Active Poll - Weekly voting poll with 4 options
  5. 4 Staff Members - Dining team with roles and bios
  6. 3 Events - Upcoming dining events
  7. 6 Nutrition Videos - Educational content across categories
  8. 5-Day Weekly Menu - Complete calendar view
  9. 3 Rewards - Redeemable items
  10. 6 Rewards Transactions - Sample activity history
  11. 3 Notifications - Sample notifications for user
*/

-- Insert sample user (Sofia Martinez)
INSERT INTO users (id, name, email, student_id, points, tier, meals_count, meal_plan_type, guest_swipes, flex_dollars, dietary_alerts, dietary_preference, profile_image_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Sofia Martinez',
  'sofia.martinez@genuine.edu',
  'SM-2027-4891',
  1240,
  'Gold',
  47,
  'Unlimited',
  5,
  142.50,
  ARRAY['Nuts'],
  'High Protein',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
) ON CONFLICT (id) DO NOTHING;

-- Insert menu items
INSERT INTO menu_items (name, description, category, calories, protein, carbs, fat, tags, allergens, image_url, trending, sold_count)
VALUES
  (
    'Grilled Chicken Power Bowl',
    'Perfectly seasoned grilled chicken with quinoa, roasted vegetables, and tahini dressing',
    'Entrée',
    450,
    38,
    42,
    14,
    ARRAY['GF'],
    ARRAY['Sesame'],
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    true,
    234
  ),
  (
    'Mediterranean Falafel Wrap',
    'Crispy falafel with hummus, cucumber, tomato, and tzatziki in warm pita',
    'Entrée',
    380,
    14,
    52,
    12,
    ARRAY['V', 'DF'],
    ARRAY['Gluten', 'Sesame'],
    'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&h=600&fit=crop',
    false,
    189
  ),
  (
    'Teriyaki Salmon & Greens',
    'Wild-caught salmon glazed with house teriyaki, served with sautéed bok choy',
    'Entrée',
    520,
    42,
    28,
    26,
    ARRAY['GF'],
    ARRAY['Fish', 'Soy'],
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop',
    true,
    198
  ),
  (
    'Build-Your-Own Grain Bowl',
    'Custom bowl with choice of base, protein, toppings, and signature sauces',
    'Bowl',
    400,
    22,
    48,
    16,
    ARRAY['V', 'GF', 'DF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
    false,
    267
  ),
  (
    'BBQ Pulled Jackfruit Sandwich',
    'Slow-cooked jackfruit in smoky BBQ sauce on a brioche bun with coleslaw',
    'Entrée',
    410,
    8,
    62,
    14,
    ARRAY['V'],
    ARRAY['Gluten'],
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    false,
    156
  ),
  (
    'Mango Lassi Smoothie',
    'Refreshing blend of mango, yogurt, cardamom, and honey',
    'Beverage',
    220,
    8,
    38,
    4,
    ARRAY['V', 'GF'],
    ARRAY['Dairy'],
    'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=800&h=600&fit=crop',
    true,
    312
  ),
  (
    'Loaded Sweet Potato Fries',
    'Crispy sweet potato fries topped with feta, herbs, and garlic aioli',
    'Side',
    340,
    6,
    44,
    16,
    ARRAY['V', 'GF'],
    ARRAY['Dairy'],
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop',
    false,
    201
  ),
  (
    'Açaí Energy Bowl',
    'Açaí base topped with granola, fresh berries, coconut, and almond butter',
    'Bowl',
    310,
    8,
    52,
    10,
    ARRAY['V', 'GF', 'DF'],
    ARRAY['Nuts'],
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=600&fit=crop',
    false,
    178
  )
ON CONFLICT DO NOTHING;

-- Insert limited-time offers (linking to menu items)
INSERT INTO limited_time_offers (menu_item_id, days_remaining, vote_count)
SELECT id, 5, 142 FROM menu_items WHERE name = 'Grilled Chicken Power Bowl'
UNION ALL
SELECT id, 3, 98 FROM menu_items WHERE name = 'Teriyaki Salmon & Greens'
UNION ALL
SELECT id, 7, 167 FROM menu_items WHERE name = 'Mango Lassi Smoothie'
ON CONFLICT DO NOTHING;

-- Insert weekly poll
INSERT INTO polls (id, question, active)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'What cuisine should we feature next week?',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert poll options
INSERT INTO poll_options (poll_id, text, vote_count)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Thai Street Food', 87),
  ('00000000-0000-0000-0000-000000000010', 'Italian Comfort', 134),
  ('00000000-0000-0000-0000-000000000010', 'Mexican Fiesta', 109),
  ('00000000-0000-0000-0000-000000000010', 'Japanese Fusion', 76)
ON CONFLICT DO NOTHING;

-- Insert staff members
INSERT INTO staff (name, role, bio, image_url, smile_count)
VALUES
  (
    'Chef Marcus Chen',
    'Executive Chef',
    'With 15 years of culinary experience, Chef Marcus brings global flavors and nutritional expertise to campus dining.',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
    284
  ),
  (
    'Chef Aisha Patel',
    'Sous Chef',
    'Specializing in plant-based cuisine, Chef Aisha creates innovative dishes that fuel athletic performance.',
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
    192
  ),
  (
    'Chef Jordan Blake',
    'Pastry Chef',
    'Jordan crafts wholesome desserts using natural ingredients, proving healthy can also be delicious.',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    156
  ),
  (
    'Dr. Emma Rodriguez',
    'Nutrition Director',
    'Sports nutritionist and registered dietitian helping students optimize their performance through smart eating.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    201
  )
ON CONFLICT DO NOTHING;

-- Insert events
INSERT INTO events (name, date, time, description, image_url, attendee_count)
VALUES
  (
    'Farm-to-Table Dinner',
    'April 12',
    '6:00 PM',
    'Meet local farmers and enjoy a special menu featuring ingredients from within 50 miles of campus.',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
    47
  ),
  (
    'Cooking Skills Workshop',
    'April 18',
    '4:30 PM',
    'Learn knife skills and quick meal prep techniques from our chefs. Perfect for dorm cooking!',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=400&fit=crop',
    32
  ),
  (
    'Nutrition for Finals Week',
    'April 25',
    '5:00 PM',
    'Brain-boosting foods and study snack strategies with Dr. Rodriguez. Plus free samples!',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=400&fit=crop',
    68
  )
ON CONFLICT DO NOTHING;

-- Insert nutrition videos
INSERT INTO videos (title, category, duration, thumbnail_url)
VALUES
  (
    'Understanding Macros for Athletes',
    'Performance',
    '8:42',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
  ),
  (
    'Seasonal Ingredients Guide',
    'Ingredients',
    '6:15',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop'
  ),
  (
    'Stress-Reducing Foods',
    'Wellness',
    '5:30',
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&h=400&fit=crop'
  ),
  (
    'Plant-Based Protein Sources',
    'Ingredients',
    '7:18',
    'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&h=400&fit=crop'
  ),
  (
    'Pre-Game Meal Timing',
    'Performance',
    '9:05',
    'https://images.unsplash.com/photo-1484980972926-edee96e0960d?w=600&h=400&fit=crop'
  ),
  (
    'Sleep and Nutrition Connection',
    'Wellness',
    '6:52',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&h=400&fit=crop'
  )
ON CONFLICT DO NOTHING;

-- Insert weekly menus
INSERT INTO weekly_menus (day_name, day_number, main_dish, side_dish, is_today, items)
VALUES
  (
    'Mon',
    7,
    'Asian Fusion',
    'Veggie Spring Rolls',
    false,
    '[{"name": "Teriyaki Salmon Bowl", "calories": 520}, {"name": "Tofu Pad Thai", "calories": 410}, {"name": "Miso Soup", "calories": 85}, {"name": "Edamame", "calories": 120}]'::jsonb
  ),
  (
    'Tue',
    8,
    'Mediterranean',
    'Greek Salad',
    false,
    '[{"name": "Chicken Souvlaki", "calories": 445}, {"name": "Falafel Plate", "calories": 380}, {"name": "Hummus & Pita", "calories": 290}, {"name": "Tabbouleh", "calories": 160}]'::jsonb
  ),
  (
    'Wed',
    9,
    'American Comfort',
    'Mac & Cheese',
    true,
    '[{"name": "BBQ Chicken", "calories": 480}, {"name": "Veggie Burger", "calories": 390}, {"name": "Sweet Potato Fries", "calories": 340}, {"name": "Coleslaw", "calories": 110}]'::jsonb
  ),
  (
    'Thu',
    10,
    'Mexican Fiesta',
    'Chips & Salsa',
    false,
    '[{"name": "Chicken Burrito Bowl", "calories": 510}, {"name": "Black Bean Tacos", "calories": 360}, {"name": "Guacamole", "calories": 180}, {"name": "Mexican Rice", "calories": 220}]'::jsonb
  ),
  (
    'Fri',
    11,
    'Italian Night',
    'Caesar Salad',
    false,
    '[{"name": "Chicken Parmesan", "calories": 550}, {"name": "Pasta Primavera", "calories": 420}, {"name": "Garlic Bread", "calories": 180}, {"name": "Minestrone Soup", "calories": 140}]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Insert rewards
INSERT INTO rewards (name, description, point_cost, icon)
VALUES
  ('Smoothie Upgrade', 'Upgrade any beverage to a premium smoothie', 50, 'coffee'),
  ('Bowl Upgrade', 'Add premium toppings to any bowl', 100, 'salad'),
  ('Chef''s Table', 'Exclusive dining experience with our chefs', 500, 'chef')
ON CONFLICT DO NOTHING;

-- Insert rewards transactions for sample user
INSERT INTO rewards_transactions (user_id, points, description, type, icon, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 50, 'Voted in weekly poll', 'earned', 'megaphone', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', -50, 'Redeemed: Smoothie Upgrade', 'spent', 'coffee', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 100, 'Attended cooking workshop', 'earned', 'utensils', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001', 75, 'Completed feedback survey', 'earned', 'message-square', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001', 150, 'Referred a friend', 'earned', 'user-plus', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000001', -100, 'Redeemed: Bowl Upgrade', 'spent', 'salad', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- Insert notifications for sample user
INSERT INTO notifications (user_id, from_name, message, icon, unread, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Chef Marcus',
    'Thanks for the smile! Looking forward to serving you again.',
    'chef-hat',
    true,
    NOW() - INTERVAL '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Genuine Dining',
    'Don''t forget to vote in this week''s poll! Closes Friday.',
    'megaphone',
    true,
    NOW() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Rewards Program',
    'You''re only 260 points away from Platinum tier!',
    'star',
    false,
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT DO NOTHING;