-- Junction table for storing multiple selected regions per subscription.
-- Mirrors the subscription_topics pattern.
CREATE TABLE IF NOT EXISTS subscription_regions (
  subscription_id TEXT NOT NULL,
  region TEXT NOT NULL,
  PRIMARY KEY (subscription_id, region),
  CONSTRAINT fk_subscription_regions_contact
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(contact) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_regions_region
    FOREIGN KEY (region) REFERENCES supported_regions(region) ON DELETE CASCADE
);
