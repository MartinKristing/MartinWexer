-- Migration: create entries table
-- Created: 2026-03-08

CREATE TABLE IF NOT EXISTS entries (
  id         bigserial    PRIMARY KEY,
  text       text         NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now()
);
