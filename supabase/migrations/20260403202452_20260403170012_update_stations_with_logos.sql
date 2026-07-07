/*
  # Update stations with logo URLs

  1. Changes
    - Update stations table to include logo_url column
    - Update existing stations with placeholder for logo images
    
  2. Notes
    - Logo images will be stored in the public folder
    - Each station will have a dedicated logo based on the WVSU branding concept
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stations' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE stations ADD COLUMN logo_url text;
  END IF;
END $$;

UPDATE stations SET logo_url = '/station-logos/greens.svg' WHERE name = 'Greens';
UPDATE stations SET logo_url = '/station-logos/carve.svg' WHERE name = 'Carve';
UPDATE stations SET logo_url = '/station-logos/simmer.svg' WHERE name = 'Simmer';
UPDATE stations SET logo_url = '/station-logos/terra.svg' WHERE name = 'Terra';
UPDATE stations SET logo_url = '/station-logos/feature.svg' WHERE name = 'Feature';
UPDATE stations SET logo_url = '/station-logos/simply.svg' WHERE name = 'Simply';
UPDATE stations SET logo_url = '/station-logos/hearth.svg' WHERE name = 'Hearth';
UPDATE stations SET logo_url = '/station-logos/ember.svg' WHERE name = 'Ember';
UPDATE stations SET logo_url = '/station-logos/rise.svg' WHERE name = 'Rise';