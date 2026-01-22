-- RBAC Setup Script
-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL, -- 'admin', 'seller', 'supervisor'
  label text NOT NULL, -- Display name: 'Administrador', 'Vendedor'
  permissions jsonb DEFAULT '[]'::jsonb, -- Array of permission strings e.g. ['sales:create', 'users:read']
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Insert Default Roles
INSERT INTO public.roles (name, label, permissions)
VALUES 
  ('admin', 'Administrador', '["*"]'::jsonb),
  ('seller', 'Vendedor', '["sales:create", "sales:read", "products:read", "clients:create", "clients:read", "cashflow:read"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  permissions = EXCLUDED.permissions;

-- 3. Add role_id to users (Optional for now, but good for linking custom roles)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id);

-- 4. Migrate existing users to have a role_id based on their text role
DO $$
DECLARE
  r_admin_id uuid;
  r_seller_id uuid;
BEGIN
  SELECT id INTO r_admin_id FROM public.roles WHERE name = 'admin';
  SELECT id INTO r_seller_id FROM public.roles WHERE name = 'seller';

  IF r_admin_id IS NOT NULL THEN
    UPDATE public.users SET role_id = r_admin_id WHERE role = 'admin' AND role_id IS NULL;
  END IF;

  IF r_seller_id IS NOT NULL THEN
    UPDATE public.users SET role_id = r_seller_id WHERE role = 'seller' AND role_id IS NULL;
  END IF;
END $$;

-- 5. Security Policies for Roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "App Access Roles" ON public.roles;
CREATE POLICY "App Access Roles" ON public.roles FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. Permissions Reference (Comments only)
-- Available Permissions:
-- 'users:manage' (Create, Edit, Delete Users)
-- 'settings:manage' (Change system settings)
-- 'products:manage' (Create, Edit, Delete Products, Stock)
-- 'products:read' (View products)
-- 'sales:create' (POS access)
-- 'sales:read' (View history)
-- 'sales:cancel' (Cancel sales)
-- 'expenses:manage' (Add/Edit expenses)
-- 'reports:view' (View detailed reports)
-- 'cashflow:view' (View cash flow)
