-- Add social media columns to celebrities table

ALTER TABLE celebrities
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_links_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for social links queries
CREATE INDEX IF NOT EXISTS idx_celebrities_twitter ON celebrities(twitter_url) WHERE twitter_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_celebrities_instagram ON celebrities(instagram_url) WHERE instagram_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN celebrities.twitter_url IS 'Official verified Twitter/X profile URL';
COMMENT ON COLUMN celebrities.instagram_url IS 'Official verified Instagram profile URL';
COMMENT ON COLUMN celebrities.facebook_url IS 'Official verified Facebook profile URL';
COMMENT ON COLUMN celebrities.website_url IS 'Official website URL';
