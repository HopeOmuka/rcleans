-- =========================================
-- CLEANER PASSWORDS (run in Neon console)
-- Adds a scrypt password hash to the cleaners table.
-- Existing cleaners must set one via the "set
-- password" flow (email + phone proof) before
-- the new password login will accept them.
-- =========================================

ALTER TABLE cleaners
  ADD COLUMN IF NOT EXISTS password_hash TEXT;