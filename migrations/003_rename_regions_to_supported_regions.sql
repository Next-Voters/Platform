-- Rename regions table to supported_regions for clarity
-- Applied 2026-05-19 via Supabase MCP

-- 1. Rename the table
ALTER TABLE regions RENAME TO supported_regions;

-- 2. Rename constraints on the table itself
ALTER TABLE supported_regions RENAME CONSTRAINT supported_cities_pkey TO supported_regions_pkey;
ALTER TABLE supported_regions RENAME CONSTRAINT regions_parent_region_fkey TO supported_regions_parent_region_fkey;
ALTER TABLE supported_regions RENAME CONSTRAINT regions_type_fkey TO supported_regions_type_fkey;
