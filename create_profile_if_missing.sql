-- Create profile if it doesn't exist for the user
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

-- Update existing profile to admin if it exists
UPDATE public.profiles 
SET 
    is_admin = true,
    admin_level = 9,
    admin_permissions = ARRAY['full_access', 'user_management', 'system_settings'],
    updated_at = NOW()
WHERE id = 'a433771d-abdf-498e-8232-2ba6380df04a';

-- Verify the profile
SELECT id, email, full_name, is_admin, admin_level, admin_permissions 
FROM public.profiles 
WHERE id = 'a433771d-abdf-498e-8232-2ba6380df04a';
