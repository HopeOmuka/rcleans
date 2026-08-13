-- =========================================
-- CHAT TYPING INDICATORS (run in Neon console)
-- Tracks the last time each participant typed in a conversation.
-- =========================================

CREATE TABLE IF NOT EXISTS chat_typing (
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'cleaner')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (service_id, sender_type)
);