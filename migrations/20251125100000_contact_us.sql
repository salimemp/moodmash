-- Contact Us System
-- Allows registered users to submit support/feedback messages

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL, -- 'support', 'feedback', 'bug_report', 'feature_request', 'other'
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  user_email TEXT NOT NULL, -- Stored for convenience
  user_name TEXT, -- User's display name
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  admin_notes TEXT, -- Internal notes from admin
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_category ON contact_submissions(category);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON contact_submissions(priority);

-- Contact responses table (for admin replies)
CREATE TABLE IF NOT EXISTS contact_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  responder_id INTEGER, -- Admin user ID
  response_text TEXT NOT NULL,
  is_public BOOLEAN DEFAULT 1, -- If visible to user
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES contact_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for responses
CREATE INDEX IF NOT EXISTS idx_contact_responses_submission_id ON contact_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_contact_responses_created_at ON contact_responses(created_at);
