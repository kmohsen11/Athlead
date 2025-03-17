-- Add new columns to the profiles table with proper constraints and defaults
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN age INTEGER CHECK (age > 0 AND age < 120);
ALTER TABLE profiles ADD COLUMN weight DECIMAL(5,2) CHECK (weight > 0 AND weight < 500);
ALTER TABLE profiles ADD COLUMN height DECIMAL(5,2) CHECK (height > 0 AND height < 300);

-- Add additional useful fields
ALTER TABLE profiles ADD COLUMN fitness_level TEXT;
ALTER TABLE profiles ADD COLUMN goals TEXT[];
ALTER TABLE profiles ADD COLUMN preferred_activities TEXT[];
ALTER TABLE profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Set default values for timestamps
ALTER TABLE profiles ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE profiles ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add comments on the columns
COMMENT ON COLUMN profiles.bio IS 'User biography or about me text';
COMMENT ON COLUMN profiles.age IS 'User age in years';
COMMENT ON COLUMN profiles.weight IS 'User weight in kilograms';
COMMENT ON COLUMN profiles.height IS 'User height in centimeters';
COMMENT ON COLUMN profiles.fitness_level IS 'User self-reported fitness level (beginner, intermediate, advanced)';
COMMENT ON COLUMN profiles.goals IS 'Array of fitness goals (e.g., weight loss, muscle gain, endurance)';
COMMENT ON COLUMN profiles.preferred_activities IS 'Array of preferred workout activities';
COMMENT ON COLUMN profiles.last_login IS 'Timestamp of the user''s last login';

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
