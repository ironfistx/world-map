CREATE TABLE IF NOT EXISTS markers (id TEXT PRIMARY KEY NOT NULL, city_name TEXT NOT NULL, country TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_markers_city_country ON markers(city_name, country);
CREATE INDEX IF NOT EXISTS idx_markers_created_at ON markers(created_at);
