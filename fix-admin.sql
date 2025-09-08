-- Script para garantir que o primeiro usuário seja admin
-- Execute no SQL Editor do Supabase

-- Primeiro, vamos verificar a situação atual
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.is_admin,
    p.admin_level,
    p.created_at,
    au.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at;

-- Tornar o primeiro usuário (por data de criação) em Super Admin
UPDATE public.profiles 
SET 
    is_admin = TRUE,
    admin_level = 100,
    admin_permissions = ARRAY['all']
WHERE id = (
    SELECT id 
    FROM public.profiles 
    ORDER BY created_at 
    LIMIT 1
);

-- Verificar se funcionou
SELECT 
    email,
    full_name,
    is_admin,
    admin_level,
    admin_permissions,
    created_at
FROM public.profiles 
WHERE is_admin = TRUE;

-- Se não existir nenhum perfil, vamos criar manualmente
-- (Substitua os valores pelos dados do usuário que deve ser admin)
/*
INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    is_admin,
    admin_level,
    admin_permissions
)
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name',
    TRUE,
    100,
    ARRAY['all']
FROM auth.users 
WHERE email = 'SEU-EMAIL@EXEMPLO.COM'  -- Substitua pelo email correto
ON CONFLICT (id) DO UPDATE SET
    is_admin = TRUE,
    admin_level = 100,
    admin_permissions = ARRAY['all'];
*/
