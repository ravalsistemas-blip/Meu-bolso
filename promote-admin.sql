-- Script para promover um usuário a Super Admin
-- Execute no SQL Editor do Supabase

-- Verificar usuários existentes
SELECT email, full_name, is_admin, admin_level, created_at 
FROM public.profiles 
ORDER BY created_at;

-- Promover um usuário específico a Super Admin
UPDATE public.profiles 
SET 
    is_admin = TRUE,
    admin_level = 100,
    admin_permissions = ARRAY['all']
WHERE email = 'SEU-EMAIL@EXEMPLO.COM';  -- Substitua pelo seu email

-- Verificar se funcionou
SELECT email, full_name, is_admin, admin_level 
FROM public.profiles 
WHERE is_admin = TRUE;
