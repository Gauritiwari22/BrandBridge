-- Social connections: stores OAuth tokens + live stats per provider, per user
CREATE TYPE public.social_provider AS ENUM ('instagram', 'youtube', 'twitter');

CREATE TABLE public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider public.social_provider NOT NULL,
  external_user_id TEXT,            -- the provider's account ID (e.g. Instagram Business Account ID)
  username TEXT,                    -- @handle, for display
  access_token TEXT NOT NULL,        -- long-lived token (encrypt at rest if possible)
  refresh_token TEXT,                -- not all providers issue one
  token_expires_at TIMESTAMPTZ,
  follower_count INT DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  media_count INT DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_connections TO authenticated;
GRANT ALL ON public.social_connections TO service_role;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- Tokens are sensitive: owners can see their own row fully.
-- Everyone else should only see public-safe fields, so we expose a separate view for public consumption.
CREATE POLICY "Users manage own social connections" ON public.social_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER social_connections_updated_at
  BEFORE UPDATE ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public-safe view: no tokens, just what's safe to show on a profile/creator card
CREATE VIEW public.social_connections_public AS
  SELECT id, user_id, provider, username, follower_count, engagement_rate, media_count, last_synced_at
  FROM public.social_connections;

GRANT SELECT ON public.social_connections_public TO anon, authenticated;