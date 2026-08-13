-- =========================================
-- SUPPORT TICKET REPLIES (run in Neon console)
-- Adds a reply thread table for support tickets.
-- =========================================

CREATE TABLE IF NOT EXISTS support_replies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  support_message_id TEXT NOT NULL
    REFERENCES support_messages(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 5000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_replies_ticket
  ON support_replies(support_message_id, created_at ASC);