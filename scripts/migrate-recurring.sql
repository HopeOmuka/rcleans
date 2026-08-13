-- =========================================
-- RECURRING CLEANS (run in Neon console)
-- Adds recurrence support to the services table.
-- =========================================

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none'
    CHECK (recurrence IN ('none', 'weekly', 'biweekly', 'monthly'));

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS recurring_parent_id TEXT
    REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_recurring_parent
  ON services(recurring_parent_id);