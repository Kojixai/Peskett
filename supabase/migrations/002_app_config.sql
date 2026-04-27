-- API keys and app configuration stored in the database
-- so they can be managed through the Settings UI.
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only authenticated users can read/write their own config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage config"
  ON app_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
