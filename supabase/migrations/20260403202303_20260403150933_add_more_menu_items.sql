/*
  # Add More Menu Items

  ## Overview
  Expanding the menu with 20+ additional items across all categories to create a
  robust, production-ready dining application.

  ## New Items Added
  - Breakfast items (pancakes, omelets, breakfast bowls)
  - Lunch/dinner entrées (pasta, stir-fry, sandwiches, salads)
  - Beverages (smoothies, juices, specialty drinks)
  - Sides (appetizers, snacks)
  - Desserts and bowls

  All items include:
  - High-quality food photography from Unsplash
  - Complete nutritional information
  - Dietary tags (V, GF, DF where applicable)
  - Allergen information
*/

-- Insert additional menu items
INSERT INTO menu_items (name, description, category, calories, protein, carbs, fat, tags, allergens, image_url, trending, sold_count)
VALUES
  -- Breakfast Items
  (
    'Blueberry Protein Pancakes',
    'Fluffy whole grain pancakes packed with fresh blueberries and topped with Greek yogurt',
    'Entrée',
    380,
    18,
    52,
    10,
    ARRAY['V'],
    ARRAY['Gluten', 'Dairy', 'Eggs'],
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    false,
    145
  ),
  (
    'Veggie Breakfast Burrito',
    'Scrambled eggs, black beans, peppers, cheese, and avocado wrapped in a whole wheat tortilla',
    'Entrée',
    420,
    22,
    48,
    16,
    ARRAY['V'],
    ARRAY['Gluten', 'Dairy', 'Eggs'],
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&h=600&fit=crop',
    true,
    198
  ),
  (
    'Overnight Oats Berry Blend',
    'Steel-cut oats soaked overnight with almond milk, chia seeds, and mixed berries',
    'Bowl',
    310,
    12,
    48,
    8,
    ARRAY['V', 'GF', 'DF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&h=600&fit=crop',
    false,
    167
  ),
  
  -- Lunch/Dinner Entrées
  (
    'Pesto Pasta Primavera',
    'Whole wheat penne with house-made basil pesto, roasted vegetables, and pine nuts',
    'Entrée',
    485,
    16,
    62,
    20,
    ARRAY['V'],
    ARRAY['Gluten', 'Dairy', 'Nuts'],
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
    true,
    224
  ),
  (
    'Sesame Ginger Tofu Stir-Fry',
    'Crispy tofu with broccoli, snap peas, and carrots in a savory sesame ginger sauce',
    'Entrée',
    395,
    24,
    44,
    14,
    ARRAY['V', 'DF'],
    ARRAY['Soy', 'Sesame'],
    'https://images.unsplash.com/photo-1609501676725-7186f017a4b0?w=800&h=600&fit=crop',
    false,
    189
  ),
  (
    'Grilled Salmon Caesar Wrap',
    'Grilled Atlantic salmon with romaine, parmesan, and Caesar dressing in a spinach wrap',
    'Entrée',
    465,
    38,
    36,
    18,
    ARRAY['GF'],
    ARRAY['Fish', 'Dairy', 'Eggs'],
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop',
    false,
    203
  ),
  (
    'Thai Peanut Noodle Bowl',
    'Rice noodles tossed with vegetables, edamame, and spicy peanut sauce, topped with cilantro',
    'Bowl',
    425,
    18,
    56,
    14,
    ARRAY['V', 'DF'],
    ARRAY['Peanuts', 'Soy'],
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
    true,
    256
  ),
  (
    'Mediterranean Chickpea Bowl',
    'Roasted chickpeas, quinoa, cucumber, tomatoes, olives, and tahini drizzle',
    'Bowl',
    390,
    16,
    54,
    12,
    ARRAY['V', 'GF', 'DF'],
    ARRAY['Sesame'],
    'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800&h=600&fit=crop',
    false,
    178
  ),
  (
    'Spicy Buffalo Cauliflower Tacos',
    'Crispy buffalo cauliflower with cabbage slaw, avocado, and ranch in corn tortillas',
    'Entrée',
    355,
    12,
    48,
    14,
    ARRAY['V', 'GF'],
    ARRAY['Dairy'],
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop',
    true,
    241
  ),
  (
    'Honey Garlic Chicken Thighs',
    'Tender chicken thighs glazed with honey garlic sauce, served with jasmine rice',
    'Entrée',
    510,
    42,
    48,
    16,
    ARRAY['GF', 'DF'],
    ARRAY['Soy'],
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&h=600&fit=crop',
    false,
    195
  ),
  
  -- Salads
  (
    'Southwest Chipotle Salad',
    'Mixed greens, black beans, corn, peppers, tortilla strips, and chipotle lime dressing',
    'Entrée',
    340,
    14,
    38,
    16,
    ARRAY['V', 'GF'],
    ARRAY['Dairy'],
    'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop',
    false,
    187
  ),
  (
    'Grilled Chicken Cobb Salad',
    'Romaine, grilled chicken, bacon, egg, avocado, tomatoes, and blue cheese',
    'Entrée',
    445,
    38,
    18,
    26,
    ARRAY['GF'],
    ARRAY['Dairy', 'Eggs'],
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
    false,
    212
  ),
  
  -- Beverages
  (
    'Green Energy Smoothie',
    'Spinach, banana, mango, chia seeds, and coconut water blended to perfection',
    'Beverage',
    195,
    6,
    38,
    3,
    ARRAY['V', 'GF', 'DF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&h=600&fit=crop',
    true,
    289
  ),
  (
    'Berry Blast Protein Shake',
    'Mixed berries, protein powder, almond milk, and oats for post-workout recovery',
    'Beverage',
    265,
    24,
    32,
    6,
    ARRAY['V', 'GF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&h=600&fit=crop',
    false,
    243
  ),
  (
    'Fresh Pressed Orange Juice',
    'Freshly squeezed Florida oranges, packed with vitamin C',
    'Beverage',
    110,
    2,
    26,
    0,
    ARRAY['V', 'GF', 'DF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
    false,
    321
  ),
  (
    'Matcha Green Tea Latte',
    'Ceremonial grade matcha whisked with steamed oat milk and a touch of honey',
    'Beverage',
    145,
    5,
    22,
    4,
    ARRAY['V', 'GF', 'DF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1536013731705-287440b9c3b2?w=800&h=600&fit=crop',
    true,
    198
  ),
  
  -- Sides & Appetizers
  (
    'Truffle Parmesan Fries',
    'Crispy fries tossed with truffle oil, parmesan cheese, and fresh parsley',
    'Side',
    385,
    8,
    48,
    18,
    ARRAY['V', 'GF'],
    ARRAY['Dairy'],
    'https://images.unsplash.com/photo-1630384082796-24f5ee6c7513?w=800&h=600&fit=crop',
    false,
    267
  ),
  (
    'Garlic Herb Roasted Vegetables',
    'Seasonal vegetables roasted with garlic, rosemary, and olive oil',
    'Side',
    125,
    4,
    18,
    6,
    ARRAY['V', 'GF', 'DF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
    false,
    156
  ),
  (
    'Crispy Brussels Sprouts',
    'Flash-fried Brussels sprouts with balsamic glaze and toasted almonds',
    'Side',
    185,
    6,
    16,
    12,
    ARRAY['V', 'GF', 'DF'],
    ARRAY['Nuts'],
    'https://images.unsplash.com/photo-1569067837738-5d4a8c0d6d93?w=800&h=600&fit=crop',
    true,
    201
  ),
  (
    'Spinach Artichoke Dip',
    'Creamy blend of spinach, artichokes, and three cheeses, served with tortilla chips',
    'Side',
    320,
    12,
    24,
    20,
    ARRAY['V', 'GF'],
    ARRAY['Dairy'],
    'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=800&h=600&fit=crop',
    false,
    178
  ),
  
  -- Specialty Items
  (
    'Korean BBQ Beef Bowl',
    'Marinated beef bulgogi over rice with kimchi, pickled vegetables, and gochujang',
    'Bowl',
    495,
    36,
    52,
    16,
    ARRAY['DF'],
    ARRAY['Soy', 'Sesame'],
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop',
    true,
    287
  ),
  (
    'Vegan Buddha Bowl',
    'Rainbow vegetables, chickpeas, quinoa, tahini dressing, and microgreens',
    'Bowl',
    365,
    14,
    52,
    12,
    ARRAY['V', 'GF', 'DF'],
    ARRAY['Sesame'],
    'https://images.unsplash.com/photo-1546069901-eacef0df6022?w=800&h=600&fit=crop',
    false,
    223
  ),
  (
    'Classic Margherita Flatbread',
    'Fresh mozzarella, tomatoes, basil, and balsamic glaze on crispy flatbread',
    'Entrée',
    395,
    18,
    44,
    16,
    ARRAY['V'],
    ARRAY['Gluten', 'Dairy'],
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
    false,
    198
  ),
  (
    'Coconut Curry Lentil Soup',
    'Red lentils simmered in coconut milk with aromatic spices and fresh cilantro',
    'Entrée',
    285,
    16,
    38,
    8,
    ARRAY['V', 'GF', 'DF'],
    ARRAY[]::text[],
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop',
    true,
    234
  ),
  (
    'Pulled Pork Sandwich',
    'Slow-cooked pulled pork with tangy BBQ sauce and coleslaw on a brioche bun',
    'Entrée',
    540,
    38,
    52,
    18,
    ARRAY[]::text[],
    ARRAY['Gluten'],
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&h=600&fit=crop',
    false,
    209
  ),
  (
    'Shrimp Poke Bowl',
    'Citrus-marinated shrimp, sushi rice, edamame, cucumber, and sesame seeds',
    'Bowl',
    415,
    32,
    48,
    10,
    ARRAY['DF'],
    ARRAY['Shellfish', 'Soy', 'Sesame'],
    'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800&h=600&fit=crop',
    true,
    256
  )
ON CONFLICT DO NOTHING;

-- Update some existing items' sold counts to create variety
UPDATE menu_items 
SET sold_count = sold_count + FLOOR(RANDOM() * 50)::INTEGER
WHERE sold_count > 0;