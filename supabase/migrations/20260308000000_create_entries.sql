-- Migration: create entries table
-- Created: 2026-03-08
-- Updated: re-trigger workflow

CREATE TABLE IF NOT EXISTS entries (
  id         bigserial    PRIMARY KEY,
  user_id    uuid         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  text       text         NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "default user can read entries"   ON entries;
DROP POLICY IF EXISTS "default user can insert entries" ON entries;
DROP POLICY IF EXISTS "default user can delete entries" ON entries;

CREATE POLICY "default user can read entries"
  ON entries FOR SELECT
  USING (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "default user can insert entries"
  ON entries FOR INSERT
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "default user can delete entries"
  ON entries FOR DELETE
  USING (user_id = '00000000-0000-0000-0000-000000000001');
