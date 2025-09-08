-- Comprehensive fix for admin profile issues
-- This script handles missing profiles, missing columns, and admin setup

-- Step 1: Check if admin columns exist in profiles table, add them if missing
DO $$
BEGIN
    -- Add admin columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'admin_level') THEN
        ALTER TABLE public.profiles ADD COLUMN admin_level INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'admin_permissions') THEN
        ALTER TABLE public.profiles ADD COLUMN admin_permissions TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Step 2: Create profile for the user if it doesn't exist
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
    COALESCE(u.raw_user_meta_data->>'full_name', 'Cristiano Ramos Mendes'),
    true,
    9,
    ARRAY['full_access', 'user_management', 'system_settings'],
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'novaradiosystem@outlook.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

-- Step 3: Update existing profile to admin if it exists
UPDATE public.profiles 
SET 
    is_admin = true,
    admin_level = 9,
    admin_permissions = ARRAY['full_access', 'user_management', 'system_settings'],
    updated_at = NOW()
WHERE id = 'a433771d-abdf-498e-8232-2ba6380df04a';

-- Step 4: Update policies to allow admin access
-- Drop existing policies if they exist and recreate with admin support
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Step 5: Verify the fix
SELECT 
    id, 
    email, 
    full_name, 
    is_admin, 
    admin_level, 
    admin_permissions,
    created_at
FROM public.profiles 
WHERE email = 'novaradiosystem@outlook.com';

-- Step 6: Verify user exists in auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'novaradiosystem@outlook.com';
