# Supabase Database Schema

This directory contains the database schema for the Athlead app.

## How to Apply Database Changes

Since we can't directly push migrations through the CLI (due to password issues), you'll need to apply these changes through the Supabase dashboard:

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ueenuhespsnibaoqezmz`
3. Go to the SQL Editor
4. Copy the contents of the migration file: `supabase/migrations/20250317062635_add_profile_fields.sql`
5. Paste it into the SQL Editor
6. Click "Run" to execute the SQL

## Database Schema

### Profiles Table

The profiles table stores user profile information:

- `id`: UUID (primary key, references auth.users.id)
- `full_name`: TEXT
- `avatar_url`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE (default: NOW())
- `updated_at`: TIMESTAMP WITH TIME ZONE (default: NOW())
- `bio`: TEXT
- `age`: INTEGER
- `weight`: DECIMAL(5,2)
- `height`: DECIMAL(5,2)
- `fitness_level`: TEXT
- `goals`: TEXT[]
- `preferred_activities`: TEXT[]
- `last_login`: TIMESTAMP WITH TIME ZONE

### Other Tables

- `health_metrics`: Stores health data from Apple Watch and other sources
- `workout_sessions`: Stores workout session data
- `emg_data`: Stores EMG sensor data
- `user_goals`: Stores user fitness goals

## Triggers

The profiles table has a trigger that automatically updates the `updated_at` column whenever a row is updated. 