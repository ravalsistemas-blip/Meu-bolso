-- SOLUÇÃO RÁPIDA: Primeiro resolver a recursão, depois aplicar segurança total
-- Execute este script PRIMEIRO para resolver o erro de recursão

-- ================================
-- 1. RESOLVER RECURSÃO IMEDIATA
-- ================================

-- Remover políticas que causam recursão
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Criar políticas simples SEM verificação de admin (sem recursão)
CREATE POLICY "simple_profiles_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "simple_profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "simple_profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ================================
-- 2. GARANTIR COLUNAS ADMIN
-- ================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] DEFAULT '{}';

-- ================================
-- 3. CONFIGURAR ADMIN
-- ================================

-- Criar/atualizar perfil admin
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

-- ================================
-- 4. VERIFICAÇÃO
-- ================================

SELECT 'RECURSÃO RESOLVIDA! ✅' as status;

SELECT 
    id, 
    email, 
    full_name, 
    is_admin, 
    admin_level
FROM public.profiles 
WHERE email = 'novaradiosystem@outlook.com';
