-- Admin System Setup
-- Run this script after the main setup to add admin functionality

-- Add admin columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_level INTEGER DEFAULT 0,
ADD COLUMN admin_permissions TEXT[] DEFAULT '{}';

-- Create function to make first user admin
CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is the first user
    IF (SELECT COUNT(*) FROM public.profiles) = 0 THEN
        NEW.is_admin = TRUE;
        NEW.admin_level = 100; -- Super admin level
        NEW.admin_permissions = ARRAY['all'];
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing user creation trigger to include admin check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Insert new profile
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name,
        is_admin,
        admin_level,
        admin_permissions
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        CASE WHEN user_count = 0 THEN TRUE ELSE FALSE END,
        CASE WHEN user_count = 0 THEN 100 ELSE 0 END,
        CASE WHEN user_count = 0 THEN ARRAY['all'] ELSE ARRAY[]::TEXT[] END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin_logs table for tracking admin actions
CREATE TABLE public.admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin logs
CREATE INDEX idx_admin_logs_admin_user ON public.admin_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_logs_target_user ON public.admin_logs(target_user_id, created_at DESC);
CREATE INDEX idx_admin_logs_action ON public.admin_logs(action, created_at DESC);

-- Enable RLS for admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin logs policies (only admins can see admin logs)
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can insert admin logs" ON public.admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user admin level
CREATE OR REPLACE FUNCTION public.get_user_admin_level(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    level INTEGER;
BEGIN
    SELECT admin_level INTO level
    FROM public.profiles 
    WHERE id = user_id;
    
    RETURN COALESCE(level, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policies for admins to manage users
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Allow admins to update other user profiles (but not admin status unless super admin)
CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_admin = TRUE AND admin_level >= 50
            )
            AND NOT (is_admin = TRUE AND admin_level >= 100) -- Can't edit super admins
        )
    );

-- Success message
SELECT 'Admin system setup completed successfully!' as message;
