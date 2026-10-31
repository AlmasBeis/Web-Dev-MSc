CREATE TABLE wanted_criminals (
  id              SERIAL PRIMARY KEY,
  name            TEXT,
  nickname        TEXT    NOT NULL,
  reward          NUMERIC(14, 2) NOT NULL CHECK (reward >= 0),
  last_lat        DOUBLE PRECISION CHECK (last_lat BETWEEN -90 AND 90),
  last_lon        DOUBLE PRECISION CHECK (last_lon BETWEEN -180 AND 180),
  last_location_note TEXT,
  difficulty      INT     NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  armed           BOOLEAN NOT NULL DEFAULT false,
  has_crew        BOOLEAN NOT NULL DEFAULT false,
  escape_master   BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE hunt_logs (
  id          SERIAL PRIMARY KEY,
  criminal_id INT NOT NULL REFERENCES wanted_criminals(id) ON DELETE CASCADE,
  success     BOOLEAN NOT NULL DEFAULT false,
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX hunt_logs_criminal_idx ON hunt_logs (criminal_id);
