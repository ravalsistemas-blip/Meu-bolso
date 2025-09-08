-- ================================
-- HABILITAR REAL-TIME NO SUPABASE
-- ================================

-- Habilitar Real-time em todas as tabelas principais
-- Isso permite que mudanças sejam sincronizadas instantaneamente

-- 1. PROFILES - Mudanças no perfil em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 2. EXPENSES - Despesas atualizadas instantaneamente
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;

-- 3. MONTHLY INCOME - Renda atualizada em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_income;

-- 4. MONTHLY SUMMARY - Resumos calculados instantaneamente
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_summary;

-- 5. ACTIVITY LOGS - Logs de atividade em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- ================================
-- CONFIGURAR FILTROS RLS PARA REAL-TIME
-- ================================

-- O Real-time respeita as políticas RLS que já configuramos
-- Cada usuário só receberá updates dos seus próprios dados

-- ================================
-- VERIFICAR CONFIGURAÇÃO
-- ================================

-- Listar tabelas com Real-time habilitado
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- Status
SELECT 'Real-time habilitado com sucesso! 🚀
✓ Mudanças em tempo real ativadas
✓ Sincronização instantânea
✓ Respeitando políticas de privacidade' as status;
