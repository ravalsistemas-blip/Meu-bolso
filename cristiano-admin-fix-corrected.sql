-- Script específico para promover Cristiano Ramos Mendes a admin
-- Execute no SQL Editor do Supabase

-- 1. Verificar o usuário específico
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    au.raw_user_meta_data->>'full_name' as full_name_meta
FROM auth.users au
WHERE au.email = 'novaradiosystem@outlook.com';

-- 2. Verificar se existe perfil para este usuário
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.is_admin,
    p.admin_level,
    p.admin_permissions,
    p.created_at
FROM public.profiles p
WHERE p.email = 'novaradiosystem@outlook.com';

-- 3. Se não existir perfil, criar um
INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    is_admin,
    admin_level,
    admin_permissions
)
SELECT 
    au.id,
    au.email,
    'Cristiano Ramos Mendes',
    TRUE,
    100,
    ARRAY['all']
FROM auth.users au
WHERE au.email = 'novaradiosystem@outlook.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = 'Cristiano Ramos Mendes',
    is_admin = TRUE,
    admin_level = 100,
    admin_permissions = ARRAY['all'];

-- 4. Garantir que este usuário seja admin (caso já exista)
UPDATE public.profiles 
SET 
    is_admin = TRUE,
    admin_level = 100,
    admin_permissions = ARRAY['all'],
    full_name = COALESCE(full_name, 'Cristiano Ramos Mendes')
WHERE email = 'novaradiosystem@outlook.com';

-- 5. Verificar resultado final
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.is_admin,
    p.admin_level,
    p.admin_permissions,
    p.created_at
FROM public.profiles p
WHERE p.email = 'novaradiosystem@outlook.com';
