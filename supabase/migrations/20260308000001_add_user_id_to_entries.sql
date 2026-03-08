-- Migration: add user_id column and RLS to entries table (if not already present)

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'default user can read entries'
  ) THEN
    CREATE POLICY "default user can read entries"
      ON entries FOR SELECT
      USING (user_id = '00000000-0000-0000-0000-000000000001');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'default user can insert entries'
  ) THEN
    CREATE POLICY "default user can insert entries"
      ON entries FOR INSERT
      WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'entries' AND policyname = 'default user can delete entries'
  ) THEN
    CREATE POLICY "default user can delete entries"
      ON entries FOR DELETE
      USING (user_id = '00000000-0000-0000-0000-000000000001');
  END IF;
END $$;
