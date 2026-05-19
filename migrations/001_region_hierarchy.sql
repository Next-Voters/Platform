-- Region hierarchy: city → state → country cascading support
-- Apply via Supabase SQL editor BEFORE deploying the code changes.

-- 1. Add hierarchy columns
ALTER TABLE regions ADD COLUMN type TEXT NOT NULL DEFAULT 'city';
ALTER TABLE regions ADD COLUMN parent_region TEXT REFERENCES regions(region);

-- 2. Insert country
INSERT INTO regions (region, type) VALUES ('United States', 'country');

-- 3. Insert all 50 US states
INSERT INTO regions (region, type, parent_region) VALUES
  ('Alabama', 'state', 'United States'),
  ('Alaska', 'state', 'United States'),
  ('Arizona', 'state', 'United States'),
  ('Arkansas', 'state', 'United States'),
  ('California', 'state', 'United States'),
  ('Colorado', 'state', 'United States'),
  ('Connecticut', 'state', 'United States'),
  ('Delaware', 'state', 'United States'),
  ('Florida', 'state', 'United States'),
  ('Georgia', 'state', 'United States'),
  ('Hawaii', 'state', 'United States'),
  ('Idaho', 'state', 'United States'),
  ('Illinois', 'state', 'United States'),
  ('Indiana', 'state', 'United States'),
  ('Iowa', 'state', 'United States'),
  ('Kansas', 'state', 'United States'),
  ('Kentucky', 'state', 'United States'),
  ('Louisiana', 'state', 'United States'),
  ('Maine', 'state', 'United States'),
  ('Maryland', 'state', 'United States'),
  ('Massachusetts', 'state', 'United States'),
  ('Michigan', 'state', 'United States'),
  ('Minnesota', 'state', 'United States'),
  ('Mississippi', 'state', 'United States'),
  ('Missouri', 'state', 'United States'),
  ('Montana', 'state', 'United States'),
  ('Nebraska', 'state', 'United States'),
  ('Nevada', 'state', 'United States'),
  ('New Hampshire', 'state', 'United States'),
  ('New Jersey', 'state', 'United States'),
  ('New Mexico', 'state', 'United States'),
  ('New York', 'state', 'United States'),
  ('North Carolina', 'state', 'United States'),
  ('North Dakota', 'state', 'United States'),
  ('Ohio', 'state', 'United States'),
  ('Oklahoma', 'state', 'United States'),
  ('Oregon', 'state', 'United States'),
  ('Pennsylvania', 'state', 'United States'),
  ('Rhode Island', 'state', 'United States'),
  ('South Carolina', 'state', 'United States'),
  ('South Dakota', 'state', 'United States'),
  ('Tennessee', 'state', 'United States'),
  ('Texas', 'state', 'United States'),
  ('Utah', 'state', 'United States'),
  ('Vermont', 'state', 'United States'),
  ('Virginia', 'state', 'United States'),
  ('Washington', 'state', 'United States'),
  ('West Virginia', 'state', 'United States'),
  ('Wisconsin', 'state', 'United States'),
  ('Wyoming', 'state', 'United States');

-- 4. Update existing city rows with parent references
UPDATE regions SET type = 'city', parent_region = 'California' WHERE region = 'San Francisco';
UPDATE regions SET type = 'city', parent_region = 'New York' WHERE region = 'New York City';
