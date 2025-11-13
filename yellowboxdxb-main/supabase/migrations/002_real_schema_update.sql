-- Yellowbox Fleet Management - REAL Schema Update
-- Based on actual Excel data structure (YELLOWBOX OB .xlsx)

-- Drop old schema that doesn't match real data
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.bike_locations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.bikes CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.riders CASCADE;

-- RIDERS TABLE (Main database - matches "RIDERS DATA" sheet)
CREATE TABLE public.riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Platform IDs
  talabat_id BIGINT UNIQUE,
  keeta_id TEXT,

  -- Personal Information
  name TEXT NOT NULL,
  nationality TEXT,
  email TEXT,
  date_of_birth DATE,
  age INTEGER,

  -- Contact Information
  company_phone TEXT,
  personal_phone TEXT,

  -- Documents
  eid_number BIGINT,
  passport_number TEXT,
  license_number TEXT,
  doc_folder_name TEXT, -- For Google Drive folder naming

  -- Work Assignment
  zone TEXT, -- Jumeirah, Business Bay, etc.
  bike_number TEXT, -- e.g., "52379 DXB 2"

  -- Status & Dates
  joining_date DATE,
  onboarding_date DATE,
  offboarding_date DATE,
  status TEXT CHECK (status IN ('active', 'onboarding', 'offboarded', 'cancelled')) DEFAULT 'active',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- ONBOARDING TABLE (matches "OB" sheet)
CREATE TABLE public.onboarding_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Application Info
  timestamp TIMESTAMP WITH TIME ZONE,
  email_address TEXT,
  fp_name TEXT DEFAULT 'Yellow Box Delivery Services LLC',
  application_date DATE,

  -- Applicant Details
  name TEXT NOT NULL,
  emirates_id BIGINT NOT NULL,
  nationality TEXT,
  city TEXT,
  date_of_birth DATE,
  age INTEGER,

  -- Application Status
  applicant_category TEXT, -- "New joiner", "Replacement", etc.
  application_status TEXT CHECK (application_status IN ('Pending', 'Approved', 'Rejected')),
  remarks TEXT,
  reason TEXT,

  -- Onboarding Process
  onboarded_date DATE,
  rider_id BIGINT, -- Links to Talabat ID after onboarding

  -- Training Details
  alloted_training_date DATE,
  alloted_training_slot TIME,
  trainer_name TEXT,
  actual_training_date DATE,
  test_results TEXT CHECK (test_results IN ('Pass', 'Fail', 'Pending')),

  -- Link to Rider (after approval)
  rider_uuid UUID REFERENCES public.riders(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TERMINATION TABLE (matches "Offboarding" & "CANCEL" sheets)
CREATE TABLE public.terminations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Rider Info
  rider_id BIGINT, -- Talabat ID
  rider_uuid UUID REFERENCES public.riders(id),
  name TEXT NOT NULL,
  eid_number BIGINT,

  -- Termination Details
  fleet_partner TEXT DEFAULT 'Yellow Box Delivery Services LLC (Dubai)',
  termination_month TEXT, -- e.g., "October 2025"
  deactivation_date DATE NOT NULL,
  primary_reason TEXT NOT NULL, -- "Termination", "Resignation", etc.

  -- Status
  status TEXT CHECK (status IN ('processing', 'completed')) DEFAULT 'processing',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- PLATFORM MIGRATION TABLE (matches "TALABAT TO KEETA" sheet)
CREATE TABLE public.platform_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  talabat_id BIGINT NOT NULL,
  keeta_id TEXT NOT NULL,
  rider_name TEXT,
  rider_uuid UUID REFERENCES public.riders(id),

  migration_date DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NEW HIRING TABLE (matches "New Hiring" sheet)
CREATE TABLE public.new_hires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  phone TEXT,
  expected_joining_date DATE,

  status TEXT CHECK (status IN ('pending', 'contacted', 'onboarding', 'completed')) DEFAULT 'pending',
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRAINERS TABLE
CREATE TABLE public.trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default trainers from data
INSERT INTO public.trainers (name) VALUES
('Dhanish'),
('TBD') -- For unassigned training sessions
ON CONFLICT (name) DO NOTHING;

-- ZONES TABLE (Reference data)
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL UNIQUE, -- "Jumeirah", "Business Bay", etc.
  description TEXT,
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert zones from real data
INSERT INTO public.zones (name) VALUES
('Jumeirah'),
('Business Bay'),
('DIP'), -- Dubai Investment Park
('Dubai'),
('Replacement'),
('Other')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_riders_talabat_id ON public.riders(talabat_id);
CREATE INDEX idx_riders_keeta_id ON public.riders(keeta_id);
CREATE INDEX idx_riders_zone ON public.riders(zone);
CREATE INDEX idx_riders_status ON public.riders(status);
CREATE INDEX idx_riders_joining_date ON public.riders(joining_date);
CREATE INDEX idx_onboarding_status ON public.onboarding_applications(application_status);
CREATE INDEX idx_onboarding_rider_id ON public.onboarding_applications(rider_id);
CREATE INDEX idx_terminations_rider_id ON public.terminations(rider_id);
CREATE INDEX idx_terminations_date ON public.terminations(deactivation_date);
CREATE INDEX idx_platform_migrations_talabat ON public.platform_migrations(talabat_id);

-- Add updated_at triggers
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON public.onboarding_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_new_hires_updated_at BEFORE UPDATE ON public.new_hires FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_hires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- Riders policies
CREATE POLICY "Riders can view their own data" ON public.riders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'operations')
    )
  );

CREATE POLICY "Admins and operations can manage riders" ON public.riders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'operations')
    )
  );

-- Onboarding policies
CREATE POLICY "Admins and operations can view onboarding" ON public.onboarding_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'operations')
    )
  );

CREATE POLICY "Admins and operations can manage onboarding" ON public.onboarding_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'operations')
    )
  );

-- Reference data - read-only for all authenticated users
CREATE POLICY "Everyone can view trainers" ON public.trainers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone can view zones" ON public.zones FOR SELECT TO authenticated USING (true);

-- Admins only for terminations
CREATE POLICY "Admins can manage terminations" ON public.terminations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.riders IS 'Main rider database - matches RIDERS DATA sheet';
COMMENT ON TABLE public.onboarding_applications IS 'Onboarding workflow - matches OB sheet';
COMMENT ON TABLE public.terminations IS 'Termination tracking - matches Offboarding/CANCEL sheets';
COMMENT ON TABLE public.platform_migrations IS 'Platform migration tracking - matches TALABAT TO KEETA sheet';
COMMENT ON TABLE public.new_hires IS 'Upcoming hires - matches New Hiring sheet';
COMMENT ON TABLE public.trainers IS 'Training staff reference data';
COMMENT ON TABLE public.zones IS 'Delivery zones reference data';
