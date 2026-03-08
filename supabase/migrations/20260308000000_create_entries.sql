-- Migration: create entries table
-- Created: 2026-03-08
-- Updated: re-trigger workflow

CREATE TABLE IF NOT EXISTS entries (
  id         bigserial    PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text       text         NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);
