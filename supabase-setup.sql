-- Supabase Setup Instructions
-- Execute these commands in the Supabase SQL Editor

-- 1. First, enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Run the main schema file (supabase-schema.sql)
-- Copy and paste the content from supabase-schema.sql into the SQL Editor

-- 3. Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'monthly_income', 'expenses', 'monthly_summary', 'activity_logs', 'expense_categories');

-- 4. Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'monthly_income', 'expenses', 'monthly_summary', 'activity_logs', 'expense_categories');

-- 5. Test insert with sample data (replace UUID with actual user ID)
-- First, create a test profile (this will be done automatically when a user signs up)
-- INSERT INTO public.profiles (id, email, full_name) 
-- VALUES ('your-user-id-here', 'test@example.com', 'Test User');

-- 6. Verify triggers work by inserting test data
-- INSERT INTO public.monthly_income (user_id, month, year, salary, extra_income)
-- VALUES ('your-user-id-here', 'janeiro', 2025, 5000.00, 1000.00);

-- INSERT INTO public.expenses (user_id, name, amount, category, payment_method, expense_type, month, year)
-- VALUES ('your-user-id-here', 'Aluguel', 1500.00, 'Moradia', 'salary', 'fixed', 'janeiro', 2025);

-- 7. Check if monthly_summary was automatically calculated
-- SELECT * FROM public.monthly_summary WHERE user_id = 'your-user-id-here';

-- 8. Test the export function
-- SELECT * FROM public.export_monthly_data('your-user-id-here', 'janeiro', 2025);

-- 9. Check activity logs
-- SELECT * FROM public.activity_logs WHERE user_id = 'your-user-id-here' ORDER BY created_at DESC;

-- 10. Test views
-- SELECT * FROM public.consolidated_investments WHERE user_id = 'your-user-id-here';
-- SELECT * FROM public.monthly_report WHERE user_id = 'your-user-id-here';
