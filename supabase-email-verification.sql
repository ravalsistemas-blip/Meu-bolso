-- Configurações adicionais para verificação de email
-- Execute este script após configurar a verificação de email no dashboard

-- Função para reenviar email de confirmação
CREATE OR REPLACE FUNCTION public.resend_confirmation_email(user_email TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Esta função é um placeholder - o reenvio deve ser feito via Supabase Auth API
    -- No frontend, use: supabase.auth.resend({ type: 'signup', email: user_email })
    
    SELECT json_build_object(
        'message', 'Use supabase.auth.resend() no frontend para reenviar email de confirmação',
        'email', user_email
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para permitir que usuários vejam apenas seu próprio status de confirmação
CREATE POLICY "Users can view own email confirmation status" ON auth.users
    FOR SELECT USING (auth.uid() = id);

-- Função para verificar se email foi confirmado
CREATE OR REPLACE FUNCTION public.is_email_confirmed(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    confirmed_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT email_confirmed_at INTO confirmed_at
    FROM auth.users 
    WHERE id = user_id;
    
    RETURN confirmed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para profiles - só pode inserir depois de confirmar email
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id AND 
        public.is_email_confirmed(auth.uid())
    );

-- Success message
SELECT 'Email verification setup completed!' as message;
