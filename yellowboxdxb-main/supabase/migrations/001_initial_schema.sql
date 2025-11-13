-- Yellowbox Fleet Management - Initial Schema Migration
-- Firebase Firestore → Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Firebase Auth → Supabase Auth integrated)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'finance', 'operations', 'rider')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Riders table
CREATE TABLE public.riders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nationality TEXT,
  phone TEXT,
  email TEXT,
  bike_type TEXT,
  visa_number TEXT,
  application_stage TEXT,
  test_status JSONB DEFAULT '{"theory": "pending", "road": "pending", "medical": "pending"}'::jsonb,
  join_date DATE,
  expected_start DATE,
  notes TEXT,
  assigned_bike_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id UUID REFERENCES public.riders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  upload_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.users(id)
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id UUID REFERENCES public.riders(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount_aed DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL UNIQUE,
  allocated_aed DECIMAL(12, 2) NOT NULL,
  spent_aed DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Bikes table
CREATE TABLE public.bikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number TEXT UNIQUE NOT NULL,
  model TEXT,
  year INTEGER,
  status TEXT CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')) DEFAULT 'available',
  assigned_to UUID REFERENCES public.riders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bike Locations table (for GPS tracking)
CREATE TABLE public.bike_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID REFERENCES public.bikes(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES public.riders(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id UUID REFERENCES public.riders(id) ON DELETE CASCADE,
  bike_id UUID REFERENCES public.bikes(id),
  pickup_location TEXT,
  delivery_location TEXT,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  delivery_lat DECIMAL(10, 8),
  delivery_lng DECIMAL(11, 8),
  status TEXT CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
  pickup_time TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_riders_user_id ON public.riders(user_id);
CREATE INDEX idx_documents_rider_id ON public.documents(rider_id);
CREATE INDEX idx_expenses_rider_id ON public.expenses(rider_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_bike_locations_bike_id ON public.bike_locations(bike_id);
CREATE INDEX idx_bike_locations_timestamp ON public.bike_locations(timestamp DESC);
CREATE INDEX idx_deliveries_rider_id ON public.deliveries(rider_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON public.bikes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bike_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Rider policies
CREATE POLICY "Riders can view their own data" ON public.riders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins and operations can view all riders" ON public.riders FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'operations'));
CREATE POLICY "Admins and operations can manage riders" ON public.riders FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'operations'));

-- Expense policies
CREATE POLICY "Riders can view their own expenses" ON public.expenses FOR SELECT USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
CREATE POLICY "Finance and admin can view all expenses" ON public.expenses FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance'));
CREATE POLICY "Riders can create their own expenses" ON public.expenses FOR INSERT WITH CHECK (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
CREATE POLICY "Finance and admin can manage expenses" ON public.expenses FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'finance'));

-- Notification policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Document policies
CREATE POLICY "Riders can view their own documents" ON public.documents FOR SELECT USING (rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid()));
CREATE POLICY "Operations and admin can view all documents" ON public.documents FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'operations'));
CREATE POLICY "Operations and admin can manage documents" ON public.documents FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'operations'));

-- Comments
COMMENT ON TABLE public.users IS 'User accounts with role-based access';
COMMENT ON TABLE public.riders IS 'Delivery rider information and onboarding status';
COMMENT ON TABLE public.documents IS 'Rider documents (visa, license, etc.)';
COMMENT ON TABLE public.expenses IS 'Rider expense tracking and approval workflow';
COMMENT ON TABLE public.budgets IS 'Monthly budget allocation and tracking';
COMMENT ON TABLE public.bikes IS 'Fleet bike inventory and assignment';
COMMENT ON TABLE public.notifications IS 'User notifications and alerts';
COMMENT ON TABLE public.bike_locations IS 'Real-time GPS tracking data';
COMMENT ON TABLE public.deliveries IS 'Delivery orders and tracking';
