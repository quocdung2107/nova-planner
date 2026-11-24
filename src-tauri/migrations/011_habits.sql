CREATE TABLE IF NOT EXISTS habits (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT 'emerald',
  position   INTEGER NOT NULL DEFAULT 0,
  archived   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id         TEXT PRIMARY KEY,
  habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs (habit_id, date);
