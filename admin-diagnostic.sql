-- Script de diagnóstico para verificar problema do admin
-- Execute no SQL Editor do Supabase

-- 1. Verificar todos os usuários na tabela auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
ORDER BY created_at;

-- 2. Verificar todos os perfis na tabela profiles
SELECT 
    id,
    email,
    full_name,
    is_admin,
    admin_level,
    admin_permissions,
    created_at
FROM public.profiles 
ORDER BY created_at;

-- 3. Verificar se há perfis sem dados de admin (problema comum)
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_admin IS NULL THEN 1 END) as null_admin,
    COUNT(CASE WHEN is_admin = TRUE THEN 1 END) as admins,
    COUNT(CASE WHEN admin_level IS NULL THEN 1 END) as null_level
FROM public.profiles;

-- 4. Corrigir perfis que não têm colunas de admin (caso existam)
UPDATE public.profiles 
SET 
    is_admin = CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY created_at) = 1 THEN TRUE 
        ELSE FALSE 
    END,
    admin_level = CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY created_at) = 1 THEN 100 
        ELSE 0 
    END,
    admin_permissions = CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY created_at) = 1 THEN ARRAY['all'] 
        ELSE ARRAY[]::TEXT[] 
    END
WHERE is_admin IS NULL OR admin_level IS NULL;

-- 5. Verificar resultado final
SELECT 
    email,
    full_name,
    is_admin,
    admin_level,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE is_admin = TRUE
ORDER BY created_at;
