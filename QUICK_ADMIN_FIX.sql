-- Single SQL command to fix all admin issues
-- Copy and paste this ENTIRE block into Supabase SQL Editor

-- Add admin columns if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';

-- Create or update admin profile
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    is_admin,
    admin_level,
    admin_permissions,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    'Cristiano Ramos Mendes',
    true,
    9,
    ARRAY['full_access', 'user_management', 'system_settings'],
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'novaradiosystem@outlook.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    admin_level = 9,
    admin_permissions = ARRAY['full_access', 'user_management', 'system_settings'],
    updated_at = NOW();

-- Update existing profile if it exists but needs admin rights
UPDATE public.profiles 
SET 
    is_admin = true,
    admin_level = 9,
    admin_permissions = ARRAY['full_access', 'user_management', 'system_settings'],
    updated_at = NOW()
WHERE email = 'novaradiosystem@outlook.com';

-- Verify the result
SELECT 
    id, 
    email, 
    full_name, 
    is_admin, 
    admin_level, 
    admin_permissions
FROM public.profiles 
WHERE email = 'novaradiosystem@outlook.com';
