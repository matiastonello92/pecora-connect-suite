-- Create comprehensive database schema for production-ready app

-- Kitchen Inventory Products Table
CREATE TABLE public.kitchen_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_key TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  is_favorite BOOLEAN DEFAULT false,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Monthly Inventory Table
CREATE TABLE public.monthly_inventories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  location TEXT NOT NULL,
  total_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Monthly Inventory Items Table
CREATE TABLE public.monthly_inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES public.monthly_inventories(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.kitchen_products(id),
  quantity DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Equipment Table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  location TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'operational',
  last_maintenance DATE,
  next_maintenance DATE,
  notes TEXT,
  manual_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Maintenance Records Table
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cost DECIMAL(10,2),
  duration_hours DECIMAL(4,2),
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Suppliers Table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders Table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  order_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivery_date DATE,
  notes TEXT,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Checklists Templates Table
CREATE TABLE public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Checklist Items Table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Checklist Sessions Table
CREATE TABLE public.checklist_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.checklist_templates(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'in_progress',
  location TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Messages Table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user UUID REFERENCES auth.users(id) NOT NULL,
  to_user UUID REFERENCES auth.users(id),
  subject TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'private',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'unread',
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Cash Closures Table
CREATE TABLE public.cash_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  opening_amount DECIMAL(10,2) DEFAULT 0,
  closing_amount DECIMAL(10,2) DEFAULT 0,
  cash_collected DECIMAL(10,2) DEFAULT 0,
  lightspeed_payments DECIMAL(10,2) DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  variance DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.kitchen_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closures ENABLE ROW LEVEL SECURITY;

-- Create location-aware policies for kitchen_products
CREATE POLICY "Users can view kitchen products for their location"
ON public.kitchen_products FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

-- Create location-aware policies for equipment
CREATE POLICY "Users can view equipment for their location"
ON public.equipment FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

CREATE POLICY "Users can manage equipment for their location"
ON public.equipment FOR ALL
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

-- Create location-aware policies for messages
CREATE POLICY "Users can view messages for their location"
ON public.messages FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
  OR from_user = auth.uid()
  OR to_user = auth.uid()
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (from_user = auth.uid());

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- Create policies for cash closures
CREATE POLICY "Users can view cash closures for their location"
ON public.cash_closures FOR SELECT
USING (
  location = (SELECT location FROM public.profiles WHERE user_id = auth.uid())
  OR (SELECT location FROM public.profiles WHERE user_id = auth.uid()) = 'all_locations'
);

CREATE POLICY "Users can create cash closures"
ON public.cash_closures FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cash closures"
ON public.cash_closures FOR UPDATE
USING (user_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['manager', 'super_admin']));

-- Insert sample kitchen products
INSERT INTO public.kitchen_products (name_key, category, unit, location) VALUES
('products.burrata', 'dairy-derivatives', 'piece', 'menton'),
('products.buffalo_mozzarella', 'dairy-derivatives', 'kg', 'menton'),
('products.pizza_mozzarella', 'dairy-derivatives', 'kg', 'menton'),
('products.white_ham', 'meats-cold-cuts', 'kg', 'menton'),
('products.parma_ham', 'meats-cold-cuts', 'kg', 'menton'),
('products.tuna_kitchen', 'fish', 'can', 'menton'),
('products.basil', 'spices-seasonings', 'bunch', 'menton'),
('products.olive_oil', 'preserves-oils-pickles', 'liter', 'menton');

-- Insert same products for Lyon location
INSERT INTO public.kitchen_products (name_key, category, unit, location) 
SELECT name_key, category, unit, 'lyon' 
FROM public.kitchen_products WHERE location = 'menton';