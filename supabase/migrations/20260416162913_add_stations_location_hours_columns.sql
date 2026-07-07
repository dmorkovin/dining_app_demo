/*
  # Add location, hours, is_active, display_order to stations table

  ## Summary
  Adds four missing columns to the stations table that are already referenced in
  the TypeScript database types but do not yet exist in the actual database schema.

  ## New Columns
  - `location` (text, nullable) — physical location description of the station
  - `hours` (jsonb, nullable) — weekly hours map keyed by lowercase day name
  - `is_active` (boolean, default true) — whether the station is currently active
  - `display_order` (integer, default 0) — controls sort order in UI lists

  ## Data Seeded
  - All 9 existing stations get is_active = true and sequential display_order (1–9)
  - Each station gets a realistic location string
  - Each station gets realistic weekday/weekend hours in the expected format

  ## Security
  - No RLS changes needed; existing policies on stations table remain in place
*/

ALTER TABLE stations
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS hours jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

UPDATE stations SET
  display_order = 1,
  location = 'Main Dining Hall — Ground Floor',
  hours = '{
    "monday":    {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "tuesday":   {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "wednesday": {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "thursday":  {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "friday":    {"open": "7:00 AM", "close": "7:00 PM", "closed": false},
    "saturday":  {"open": "9:00 AM", "close": "5:00 PM", "closed": false},
    "sunday":    {"open": "9:00 AM", "close": "5:00 PM", "closed": false}
  }'::jsonb
WHERE id = 1;

UPDATE stations SET
  display_order = 2,
  location = 'Main Dining Hall — Carving Station',
  hours = '{
    "monday":    {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "tuesday":   {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "wednesday": {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "thursday":  {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "friday":    {"open": "11:00 AM", "close": "6:00 PM", "closed": false},
    "saturday":  {"open": "11:00 AM", "close": "4:00 PM", "closed": false},
    "sunday":    {"open": "0:00 AM",  "close": "0:00 AM",  "closed": true}
  }'::jsonb
WHERE id = 2;

UPDATE stations SET
  display_order = 3,
  location = 'Main Dining Hall — Hot Entrees',
  hours = '{
    "monday":    {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "tuesday":   {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "wednesday": {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "thursday":  {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "friday":    {"open": "10:30 AM", "close": "7:00 PM", "closed": false},
    "saturday":  {"open": "11:00 AM", "close": "5:00 PM", "closed": false},
    "sunday":    {"open": "11:00 AM", "close": "5:00 PM", "closed": false}
  }'::jsonb
WHERE id = 3;

UPDATE stations SET
  display_order = 4,
  location = 'Main Dining Hall — Plant-Based Corner',
  hours = '{
    "monday":    {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "tuesday":   {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "wednesday": {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "thursday":  {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "friday":    {"open": "7:00 AM", "close": "7:00 PM", "closed": false},
    "saturday":  {"open": "9:00 AM", "close": "4:00 PM", "closed": false},
    "sunday":    {"open": "9:00 AM", "close": "4:00 PM", "closed": false}
  }'::jsonb
WHERE id = 4;

UPDATE stations SET
  display_order = 5,
  location = 'Main Dining Hall — Rotating Feature',
  hours = '{
    "monday":    {"open": "11:00 AM", "close": "7:30 PM", "closed": false},
    "tuesday":   {"open": "11:00 AM", "close": "7:30 PM", "closed": false},
    "wednesday": {"open": "11:00 AM", "close": "7:30 PM", "closed": false},
    "thursday":  {"open": "11:00 AM", "close": "7:30 PM", "closed": false},
    "friday":    {"open": "11:00 AM", "close": "6:30 PM", "closed": false},
    "saturday":  {"open": "0:00 AM",  "close": "0:00 AM",  "closed": true},
    "sunday":    {"open": "0:00 AM",  "close": "0:00 AM",  "closed": true}
  }'::jsonb
WHERE id = 5;

UPDATE stations SET
  display_order = 6,
  location = 'Main Dining Hall — Allergen-Free Zone',
  hours = '{
    "monday":    {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "tuesday":   {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "wednesday": {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "thursday":  {"open": "7:00 AM", "close": "8:00 PM", "closed": false},
    "friday":    {"open": "7:00 AM", "close": "7:00 PM", "closed": false},
    "saturday":  {"open": "9:00 AM", "close": "5:00 PM", "closed": false},
    "sunday":    {"open": "9:00 AM", "close": "5:00 PM", "closed": false}
  }'::jsonb
WHERE id = 6;

UPDATE stations SET
  display_order = 7,
  location = 'Main Dining Hall — Comfort Food',
  hours = '{
    "monday":    {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "tuesday":   {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "wednesday": {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "thursday":  {"open": "10:30 AM", "close": "8:00 PM", "closed": false},
    "friday":    {"open": "10:30 AM", "close": "7:00 PM", "closed": false},
    "saturday":  {"open": "10:00 AM", "close": "4:00 PM", "closed": false},
    "sunday":    {"open": "10:00 AM", "close": "4:00 PM", "closed": false}
  }'::jsonb
WHERE id = 7;

UPDATE stations SET
  display_order = 8,
  location = 'Main Dining Hall — Grill & Flame',
  hours = '{
    "monday":    {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "tuesday":   {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "wednesday": {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "thursday":  {"open": "11:00 AM", "close": "7:00 PM", "closed": false},
    "friday":    {"open": "11:00 AM", "close": "6:00 PM", "closed": false},
    "saturday":  {"open": "0:00 AM",  "close": "0:00 AM",  "closed": true},
    "sunday":    {"open": "0:00 AM",  "close": "0:00 AM",  "closed": true}
  }'::jsonb
WHERE id = 8;

UPDATE stations SET
  display_order = 9,
  location = 'Main Dining Hall — Breakfast & All Day',
  hours = '{
    "monday":    {"open": "7:00 AM", "close": "10:30 AM", "closed": false},
    "tuesday":   {"open": "7:00 AM", "close": "10:30 AM", "closed": false},
    "wednesday": {"open": "7:00 AM", "close": "10:30 AM", "closed": false},
    "thursday":  {"open": "7:00 AM", "close": "10:30 AM", "closed": false},
    "friday":    {"open": "7:00 AM", "close": "10:30 AM", "closed": false},
    "saturday":  {"open": "8:00 AM", "close": "11:30 AM", "closed": false},
    "sunday":    {"open": "8:00 AM", "close": "11:30 AM", "closed": false}
  }'::jsonb
WHERE id = 9;
