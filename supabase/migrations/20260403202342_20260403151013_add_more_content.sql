/*
  # Add More Content Across the App

  ## Overview
  Expanding content for limited-time offers, theme proposals, more events,
  and additional sample data to make the app feel fully populated.

  ## New Content Added
  - More limited-time offers
  - Additional theme proposals from different users
  - More upcoming events
  - Extra rewards options
  - Additional sample transactions
*/

-- Add more limited-time offers
INSERT INTO limited_time_offers (menu_item_id, days_remaining, vote_count)
SELECT id, 4, 187 FROM menu_items WHERE name = 'Veggie Breakfast Burrito'
UNION ALL
SELECT id, 2, 203 FROM menu_items WHERE name = 'Korean BBQ Beef Bowl'
UNION ALL
SELECT id, 6, 156 FROM menu_items WHERE name = 'Shrimp Poke Bowl'
UNION ALL
SELECT id, 5, 178 FROM menu_items WHERE name = 'Coconut Curry Lentil Soup'
ON CONFLICT DO NOTHING;

-- Add more theme proposals
INSERT INTO theme_proposals (user_id, text, vote_count, author_name, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Global Street Food Week - tacos, banh mi, gyros, and more from around the world',
    47,
    'Marcus Chen',
    NOW() - INTERVAL '2 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Farm-to-Table Sundays with seasonal ingredients from local farms',
    38,
    'Emma Rodriguez',
    NOW() - INTERVAL '3 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Comfort Food Classics - mac and cheese, pot pie, meatloaf, and nostalgic favorites',
    52,
    'Jordan Blake',
    NOW() - INTERVAL '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Plant-Based Power - showcasing creative vegan and vegetarian options',
    65,
    'Aisha Patel',
    NOW() - INTERVAL '4 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Mediterranean Monday with hummus, tabbouleh, grilled proteins, and fresh salads',
    41,
    'Sofia Martinez',
    NOW() - INTERVAL '5 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Build Your Own Bowl Bar with unlimited toppings and sauce combinations',
    89,
    'Alex Johnson',
    NOW() - INTERVAL '6 days'
  )
ON CONFLICT DO NOTHING;

-- Add more events
INSERT INTO events (name, date, time, description, image_url, attendee_count)
VALUES
  (
    'Taco Tuesday Social',
    'April 16',
    '12:00 PM',
    'Build your own tacos with premium toppings and three protein options. Live music!',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=400&fit=crop',
    52
  ),
  (
    'Smoothie Bowl Workshop',
    'April 20',
    '3:00 PM',
    'Learn to create Instagram-worthy smoothie bowls with Chef Aisha. Free samples!',
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&h=400&fit=crop',
    38
  ),
  (
    'International Cuisine Night',
    'April 28',
    '6:00 PM',
    'Sample dishes from 5 different countries prepared by our culinary team.',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    71
  ),
  (
    'Coffee & Conversation',
    'May 2',
    '8:00 AM',
    'Morning meetup with specialty coffee drinks and pastries. Meet fellow students!',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&h=400&fit=crop',
    29
  )
ON CONFLICT DO NOTHING;

-- Add more rewards options
INSERT INTO rewards (name, description, point_cost, icon)
VALUES
  ('Free Dessert', 'Any dessert item of your choice', 75, 'chef'),
  ('Priority Seating', 'Skip the line during peak hours', 150, 'star'),
  ('Guest Meal Pass', 'Bring a friend to dine with you', 200, 'user-plus'),
  ('Cooking Class Access', 'Free entry to any cooking workshop', 300, 'chef'),
  ('Monthly Unlimited', 'Unlimited meals for one month', 1000, 'infinity')
ON CONFLICT DO NOTHING;

-- Add more transactions for the sample user
INSERT INTO rewards_transactions (user_id, points, description, type, icon, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 100, 'RSVP to International Cuisine Night', 'earned', 'calendar', NOW() - INTERVAL '12 days'),
  ('00000000-0000-0000-0000-000000000001', 50, 'Shared dining feedback', 'earned', 'message-square', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0000-000000000001', -75, 'Redeemed: Free Dessert', 'spent', 'chef', NOW() - INTERVAL '16 days'),
  ('00000000-0000-0000-0000-000000000001', 125, 'Weekly challenge completed', 'earned', 'trophy', NOW() - INTERVAL '18 days'),
  ('00000000-0000-0000-0000-000000000001', 75, 'Social media share bonus', 'earned', 'share', NOW() - INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000001', 100, 'Perfect attendance week', 'earned', 'star', NOW() - INTERVAL '22 days')
ON CONFLICT DO NOTHING;

-- Add more nutrition videos
INSERT INTO videos (title, category, duration, thumbnail_url)
VALUES
  (
    'Meal Prep for Busy Students',
    'Wellness',
    '10:24',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop'
  ),
  (
    'Hydration and Athletic Performance',
    'Performance',
    '7:45',
    'https://images.unsplash.com/photo-1523677011781-c91d1bbe1f22?w=600&h=400&fit=crop'
  ),
  (
    'Understanding Food Labels',
    'Ingredients',
    '8:12',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop'
  ),
  (
    'Anti-Inflammatory Foods',
    'Wellness',
    '9:30',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop'
  ),
  (
    'Building a Balanced Plate',
    'Performance',
    '6:18',
    'https://images.unsplash.com/photo-1547496502-affa22d38842?w=600&h=400&fit=crop'
  ),
  (
    'Superfoods Explained',
    'Ingredients',
    '11:05',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop'
  )
ON CONFLICT DO NOTHING;