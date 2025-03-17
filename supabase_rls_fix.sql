-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own profile
CREATE POLICY insert_own_profile ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY update_own_profile ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Create policy to allow users to read their own profile
CREATE POLICY read_own_profile ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Create policy to allow users to read any profile (for public profiles)
CREATE POLICY read_all_profiles ON profiles
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert their own profile
CREATE POLICY insert_profile_authenticated ON profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow service role to manage all profiles
CREATE POLICY service_role_manage_all_profiles ON profiles
    USING (auth.role() = 'service_role'); 