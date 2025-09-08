-- Script para promover Cristiano a admin - LIMPO
-- Copie este texto completo e cole no SQL Editor do Supabase

-- 1. Verificar usuario
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    au.raw_user_meta_data->>'full_name' as full_name_meta
FROM auth.users au
WHERE au.email = 'novaradiosystem@outlook.co';

-- 2. Verificar perfil existente
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.is_admin,
    p.admin_level,
    p.admin_permissions,
    p.created_at
FROM public.profiles p
WHERE p.email = 'novaradiosystem@outlook.co';

-- 3. Criar ou atualizar perfil como admin
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
WHERE au.email = 'novaradiosystem@outlook.co'
ON CONFLICT (id) DO UPDATE SET
    full_name = 'Cristiano Ramos Mendes',
    is_admin = TRUE,
    admin_level = 100,
    admin_permissions = ARRAY['all'];

-- 4. Garantir admin status
UPDATE public.profiles 
SET 
    is_admin = TRUE,
    admin_level = 100,
    admin_permissions = ARRAY['all'],
    full_name = COALESCE(full_name, 'Cristiano Ramos Mendes')
WHERE email = 'novaradiosystem@outlook.co';

-- 5. Verificar resultado
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.is_admin,
    p.admin_level,
    p.admin_permissions,
    p.created_at
FROM public.profiles p
WHERE p.email = 'novaradiosystem@outlook.co';
