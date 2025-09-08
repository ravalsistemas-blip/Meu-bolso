-- Check if the specific user profile exists
SELECT id, email, is_admin, admin_level, admin_permissions, created_at
FROM auth.users 
WHERE email = 'novaradiosystem@outlook.com';

-- Check profiles table for this user
SELECT * FROM public.profiles 
WHERE id = 'a433771d-abdf-498e-8232-2ba6380df04a';
