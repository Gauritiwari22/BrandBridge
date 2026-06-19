
-- Enums
CREATE TYPE public.user_role AS ENUM ('brand','influencer','student','organizer','business');
CREATE TYPE public.campaign_status AS ENUM ('draft','open','in_progress','completed','cancelled');
CREATE TYPE public.application_status AS ENUM ('pending','accepted','rejected','withdrawn');
CREATE TYPE public.sponsorship_status AS ENUM ('proposed','accepted','rejected','paid');
CREATE TYPE public.contract_status AS ENUM ('draft','sent','signed_creator','signed_brand','active','completed');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'influencer',
  bio TEXT,
  avatar_url TEXT,
  college TEXT,
  location TEXT,
  niche TEXT[],
  skills TEXT[],
  instagram TEXT,
  youtube TEXT,
  twitter TEXT,
  linkedin TEXT,
  followers INT DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  trust_score INT DEFAULT 50,
  authenticity_score INT DEFAULT 50,
  brand_name TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'influencer'::public.user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Campaigns (created by brands)
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_niches TEXT[],
  min_followers INT DEFAULT 0,
  min_engagement NUMERIC(5,2) DEFAULT 0,
  deliverables TEXT,
  start_date DATE,
  end_date DATE,
  status public.campaign_status NOT NULL DEFAULT 'open',
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT ON public.campaigns TO anon;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns viewable by all" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Brand creates own campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "Brand updates own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = brand_id);
CREATE POLICY "Brand deletes own campaigns" ON public.campaigns FOR DELETE USING (auth.uid() = brand_id);
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pitch TEXT,
  proposed_rate NUMERIC(12,2),
  status public.application_status NOT NULL DEFAULT 'pending',
  ai_match_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creator sees own apps + brand sees apps to own campaigns" ON public.applications FOR SELECT USING (
  auth.uid() = creator_id OR
  auth.uid() IN (SELECT brand_id FROM public.campaigns WHERE id = campaign_id)
);
CREATE POLICY "Creator inserts own application" ON public.applications FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator updates own application" ON public.applications FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Brand updates app status" ON public.applications FOR UPDATE USING (
  auth.uid() IN (SELECT brand_id FROM public.campaigns WHERE id = campaign_id)
);
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Events (Campus Sponsorship Hub)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  college TEXT,
  category TEXT,
  expected_footfall INT DEFAULT 0,
  event_date DATE,
  location TEXT,
  brochure_url TEXT,
  cover_url TEXT,
  funding_goal NUMERIC(12,2) DEFAULT 0,
  funding_raised NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizer creates own event" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizer updates own event" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizer deletes own event" ON public.events FOR DELETE USING (auth.uid() = organizer_id);
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sponsorships
CREATE TABLE public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offer_amount NUMERIC(12,2) NOT NULL,
  message TEXT,
  tier TEXT,
  status public.sponsorship_status NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsorships TO authenticated;
GRANT ALL ON public.sponsorships TO service_role;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsorship visible to brand + event organizer" ON public.sponsorships FOR SELECT USING (
  auth.uid() = brand_id OR auth.uid() IN (SELECT organizer_id FROM public.events WHERE id = event_id)
);
CREATE POLICY "Brand creates sponsorship" ON public.sponsorships FOR INSERT WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "Brand updates sponsorship" ON public.sponsorships FOR UPDATE USING (auth.uid() = brand_id);
CREATE POLICY "Organizer updates sponsorship status" ON public.sponsorships FOR UPDATE USING (
  auth.uid() IN (SELECT organizer_id FROM public.events WHERE id = event_id)
);
CREATE TRIGGER sponsorships_updated_at BEFORE UPDATE ON public.sponsorships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  terms TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deliverables TEXT,
  due_date DATE,
  status public.contract_status NOT NULL DEFAULT 'sent',
  brand_signed_at TIMESTAMPTZ,
  creator_signed_at TIMESTAMPTZ,
  brand_signature TEXT,
  creator_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contract parties can view" ON public.contracts FOR SELECT USING (auth.uid() = brand_id OR auth.uid() = creator_id);
CREATE POLICY "Brand creates contract" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "Parties update contract" ON public.contracts FOR UPDATE USING (auth.uid() = brand_id OR auth.uid() = creator_id);
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Affiliate codes
CREATE TABLE public.affiliate_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  commission_pct NUMERIC(5,2) DEFAULT 10,
  url TEXT,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_codes TO authenticated;
GRANT SELECT ON public.affiliate_codes TO anon;
GRANT ALL ON public.affiliate_codes TO service_role;
ALTER TABLE public.affiliate_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliate codes viewable by all" ON public.affiliate_codes FOR SELECT USING (true);
CREATE POLICY "Brand creates affiliate code" ON public.affiliate_codes FOR INSERT WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "Brand or creator update" ON public.affiliate_codes FOR UPDATE USING (auth.uid() = brand_id OR auth.uid() = creator_id);
CREATE TRIGGER affiliate_codes_updated_at BEFORE UPDATE ON public.affiliate_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert any notification (server)" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Mark own as read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Campaign analytics (events already concluded)
CREATE TABLE public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  engagements INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_analytics TO authenticated;
GRANT ALL ON public.campaign_analytics TO service_role;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics viewable by all auth" ON public.campaign_analytics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Brand inserts analytics for own campaign" ON public.campaign_analytics FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT brand_id FROM public.campaigns WHERE id = campaign_id)
);
