-- Create health_metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own health metrics
CREATE POLICY "Users can read their own health metrics"
  ON health_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own health metrics
CREATE POLICY "Users can insert their own health metrics"
  ON health_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index on user_id and timestamp for faster queries
CREATE INDEX IF NOT EXISTS health_metrics_user_id_timestamp_idx
  ON health_metrics (user_id, timestamp);

-- Create index on metric_type for faster filtering
CREATE INDEX IF NOT EXISTS health_metrics_metric_type_idx
  ON health_metrics (metric_type); 